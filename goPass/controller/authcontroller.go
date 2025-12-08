package controller

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"goPass/config"
	"goPass/models"
	// "goPass/utils"

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
	// accessToken, _ := utils.AppAccessToken(user.ID)
	// refreshToken, _ := utils.AppRefreshToken(user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "user logged in succesfully",
		// "accessToken":  accessToken,
		// "refreshToken": refreshToken,
	})
}

func ForgotPassword(c *fiber.Ctx) error {
	return c.SendString("hello")
}
