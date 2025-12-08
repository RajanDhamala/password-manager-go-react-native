package router

import (
	"goPass/controller"

	"github.com/gofiber/fiber/v2"
)

func AuthRoute(app *fiber.App) {
	AuthRouter := app.Group("/auth")

	AuthRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("auth route is up and running")
	})

	AuthRouter.Post("/register", controller.RegisterAppUser)

}
