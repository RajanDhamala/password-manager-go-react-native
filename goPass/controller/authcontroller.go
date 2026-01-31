package controller

import (
	"log"
	"sync"
	"time"

	"goPass/config"
	"goPass/models"
	"goPass/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
)

type PendingRegistration struct {
	Data      RegisterRequest
	ExpiresAt time.Time
}

var (
	pendingRegistrations = make(map[string]PendingRegistration)
	pendingRegMutex      sync.RWMutex
)

type RegisterRequest struct {
	Email              string         `json:"email"`
	Password           string         `json:"password"`
	FullName           string         `json:"fullname"`
	MasterPasswordHash string         `json:"masterPasswordHash"`
	MasterSalt         string         `json:"masterSalt"`
	RecoverySalt       string         `json:"recoverySalt"`
	AesHashKeyMaster   datatypes.JSON `json:"aesHashKeyMaster"`
	AesHashKeyRecovery datatypes.JSON `json:"aesHashKeyRecovery"`
}

func SendRegisterOTP(c *fiber.Ctx) error {
	type SendOTPRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"fullname"`
	}

	data := SendOTPRequest{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if data.Email == "" || data.Password == "" || data.FullName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, password and fullname are required",
		})
	}

	if len(data.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Password must be at least 6 characters",
		})
	}

	var existingUser models.AppUser
	if err := config.DB.Where("email = ?", data.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User with this email already exists",
		})
	}

	otp := utils.GenerateOTP()
	utils.StoreOTP(data.Email, otp, "register")

	if err := utils.SendOTPEmail(data.Email, otp, "register"); err != nil {
		log.Printf("Failed to send OTP email: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send verification email",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "OTP sent to your email",
	})
}

func RegisterAppUser(c *fiber.Ctx) error {
	type VerifyRegisterRequest struct {
		Email              string         `json:"email"`
		Password           string         `json:"password"`
		FullName           string         `json:"fullname"`
		OTP                string         `json:"otp"`
		MasterPasswordHash string         `json:"masterPasswordHash"`
		MasterSalt         string         `json:"masterSalt"`
		RecoverySalt       string         `json:"recoverySalt"`
		AesHashKeyMaster   datatypes.JSON `json:"aesHashKeyMaster"`
		AesHashKeyRecovery datatypes.JSON `json:"aesHashKeyRecovery"`
	}

	data := VerifyRegisterRequest{}
	log.Println("register invoked")
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"msg":   err.Error(),
		})
	}

	if data.Email == "" || data.Password == "" || len(data.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form data",
		})
	}

	if data.OTP == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "OTP is required",
		})
	}

	// Verify OTP
	if !utils.VerifyOTP(data.Email, data.OTP, "register") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired OTP",
		})
	}

	p, err := bcrypt.GenerateFromPassword([]byte(data.Password), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to encrypt password",
		})
	}
	stringpass := string(p)

	user := models.AppUser{
		ID:                 uuid.New(),
		Email:              data.Email,
		Password:           stringpass,
		FullName:           data.FullName,
		MasterPasswordHash: data.MasterPasswordHash,
		MasterSalt:         &data.MasterSalt,
		RecoverySalt:       &data.RecoverySalt,
		AesHashKeyMaster:   data.AesHashKeyMaster,
		AesHashKeyRecovery: data.AesHashKeyRecovery,
	}

	error := config.DB.Create(&user).Error
	if error != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return c.Status(400).JSON(fiber.Map{"error": "User with this email already exists"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	accessToken, _ := utils.CreateAppAccessToken(user.ID)
	refreshToken, _ := utils.CreateAppRefreshToken(user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":      "user created succesfully",
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"firstLogin":   true,
	})
}

type LoginAppRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SendLoginOTP(c *fiber.Ctx) error {
	data := LoginAppRequest{}

	log.Println("send login OTP invoked")
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the body",
		})
	}

	if data.Email == "" || data.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form data",
		})
	}

	user := models.AppUser{}
	if error := config.DB.Where("email=?", data.Email).Select("email", "id", "password").First(&user).Error; error != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email not found",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid credentials",
		})
	}

	otp := utils.GenerateOTP()
	utils.StoreOTP(data.Email, otp, "login")

	if err := utils.SendOTPEmail(data.Email, otp, "login"); err != nil {
		log.Printf("Failed to send OTP email: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send verification email",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "OTP sent to your email",
	})
}

func LoginAppUser(c *fiber.Ctx) error {
	type VerifyLoginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		OTP      string `json:"otp"`
	}

	data := VerifyLoginRequest{}

	log.Println("login invoked")
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the body",
		})
	}

	if data.Email == "" || data.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form data",
		})
	}

	if data.OTP == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "OTP is required",
		})
	}

	// Verify OTP first
	if !utils.VerifyOTP(data.Email, data.OTP, "login") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid or expired OTP",
		})
	}

	user := models.AppUser{}
	if error := config.DB.Where("email=?", data.Email).Select("email", "id", "password").First(&user).Error; error != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email not found",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid credentials",
		})
	}
	accessToken, _ := utils.CreateAppAccessToken(user.ID)
	refreshToken, _ := utils.CreateAppRefreshToken(user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":      "user logged in succesfully",
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func AppGetProfile(c *fiber.Ctx) error {
	id := c.Locals("id")
	data := models.AppUser{}
	if err := config.DB.Where("id=?", id).First(&data).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"err": "user not found",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "succesfully fetched profile",
		"data":    data,
	})
}

type ForgotPasswordRequest struct {
	Email       string `json:"email"`
	NewPassword string `json:"newPassword"`
}

func ForgotPassword(c *fiber.Ctx) error {
	data := ForgotPasswordRequest{}

	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse request body",
		})
	}

	if data.Email == "" || data.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email and newPassword are required",
		})
	}

	if len(data.NewPassword) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "new password must be at least 6 characters",
		})
	}

	user := models.AppUser{}
	if err := config.DB.Where("email=?", data.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(data.NewPassword), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to hash new password",
		})
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update password",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "password reset successfully. Use your recovery code to restore vault access.",
	})
}

type UpdateProfileRequest struct {
	FullName string `json:"fullName"`
}

func UpdateProfile(c *fiber.Ctx) error {
	id := c.Locals("id").(uuid.UUID)
	data := UpdateProfileRequest{}

	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse request body",
		})
	}

	if data.FullName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "fullName is required",
		})
	}

	user := models.AppUser{}
	if err := config.DB.Where("id=?", id).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	user.FullName = data.FullName
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update profile",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "profile updated successfully",
		"data":    user,
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func ChangePassword(c *fiber.Ctx) error {
	id := c.Locals("id").(uuid.UUID)
	data := ChangePasswordRequest{}

	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse request body",
		})
	}

	if data.CurrentPassword == "" || data.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "currentPassword and newPassword are required",
		})
	}

	if len(data.NewPassword) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "new password must be at least 6 characters",
		})
	}

	user := models.AppUser{}
	if err := config.DB.Where("id=?", id).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data.CurrentPassword)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "current password is incorrect",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(data.NewPassword), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to hash new password",
		})
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update password",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "password changed successfully",
	})
}

func RefreshAppToken(c *fiber.Ctx) error {
	log.Println("refresh route called my frined")
	authHeader := c.Get("Authorization")
	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Missing or invalid Authorization header",
		})
	}

	bearerToken := authHeader[7:]

	data, err := utils.VerifyRefreshToken(bearerToken)
	if err != nil {
		return c.Status(fiber.ErrBadRequest.Code).JSON(fiber.Map{
			"error": "invalid token",
		})
	}
	newAccessToken, err := utils.CreateAppAccessToken(data.Id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "invalid token generation",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"newToken": newAccessToken,
	})
}
