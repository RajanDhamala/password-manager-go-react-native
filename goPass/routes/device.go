package router

import (
	"goPass/controller"

	"github.com/gofiber/fiber/v2"
)

func DeviceRoute(app *fiber.App) {
	DeviceRouter := app.Group("/device")

	DeviceRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("device route is up and running")
	})

	DeviceRouter.Post("/register", controller.RegisterDevice)
	DeviceRouter.Get("/list", controller.ListDevices)
	DeviceRouter.Delete("/revoke/:id", controller.RevokeDevice)
}
