package router

import (
	"github.com/gofiber/fiber/v2"
)

func AppRouter(app *fiber.App) {
	appRoute := app.Group("/app")

	appRoute.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("app route is up and running")
	})
}
