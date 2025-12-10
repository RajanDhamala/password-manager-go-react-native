package middleware

import (
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"goPass/utils"
)

func AuthAppUser(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")

	if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		log.Println("invalid token")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Missing or invalid Authorization header",
		})
	}

	bearerToken := authHeader[7:]

	data, err := utils.VerifyAccessToken(bearerToken)
	if err != nil {
		log.Println("token epired btw")
		return c.Status(498).JSON(fiber.Map{
			"error": "invalid or expired tokens",
		})
	}

	c.Locals("id", data.Id)

	return c.Next()
}
