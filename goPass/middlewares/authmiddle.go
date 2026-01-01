package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"goPass/utils"
)

func AuthUser(c *fiber.Ctx) error {
	accessToken := c.Cookies("access_token")
	if accessToken != "" {
		claims, err := utils.ParseAccessToken(accessToken)
		if err == nil {
			if id, ok := claims["id"].(float64); ok {
				c.Locals("id", uint(id))
				return c.Next()
			}
		}
	}

	refreshToken := c.Cookies("refresh_token")
	if refreshToken != "" {
		claims, err := utils.ParseRefreshToken(refreshToken)
		if err == nil {
			if id, ok := claims["id"].(float64); ok {
				userID := uint(id)

				newAccessToken, err := utils.GenerateAccessToken(userID)
				if err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"error": "failed to generate new access token",
					})
				}

				c.Cookie(&fiber.Cookie{
					Name:     "access_token",
					Value:    newAccessToken,
					Path:     "/",
					HTTPOnly: true,
					Secure:   false,
					Expires:  time.Now().Add(15 * time.Minute),
				})

				c.Locals("id", userID)
				return c.Next()
			}
		}
	}

	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
		"error": "invalid access and refresh token",
	})
}
