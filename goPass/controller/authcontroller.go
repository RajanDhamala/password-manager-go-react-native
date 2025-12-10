package controller

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"goPass/config"
	"goPass/models"
	"goPass/utils"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"fullname"`
}

func RegisterAppUser(c *fiber.Ctx) error {
	data := RegisterRequest{}

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

	p, err := bcrypt.GenerateFromPassword([]byte(data.Password), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to encrypt password",
		})
	}
	stringpass := string(p)
	user := models.AppUser{
		ID:       uuid.New(),
		Email:    data.Email,
		Password: stringpass,
		FullName: data.FullName,
	}

	error := config.DB.Create(&user).Error
	if error != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return c.Status(400).JSON(fiber.Map{"error": "User with this email already exists"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "user created succesfully",
	})
}

type LoginAppRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginAppUser(c *fiber.Ctx) error {
	data := LoginAppRequest{}
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

func ForgotPassword(c *fiber.Ctx) error {
	return c.SendString("hello")
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
