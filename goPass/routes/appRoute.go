package router

import (
	"github.com/gofiber/fiber/v2"
	"goPass/controller"
	"goPass/middlewares"
)

func AppRouter(app *fiber.App) {
	appRoute := app.Group("/app")

	appRoute.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("app route is up and running")
	})
	appRoute.Post("/registerVault", middleware.AuthAppUser, controller.RegisterVaultEntry)
	appRoute.Get("/isVaultRegistered", middleware.AuthAppUser, controller.CheckIfVaultRegistered)
}
