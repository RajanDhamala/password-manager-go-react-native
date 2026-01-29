package router

import (
	"github.com/gofiber/fiber/v2"
	"goPass/controller"
	"goPass/middlewares"
)

func DeviceRoute(app *fiber.App) {
	DeviceRouter := app.Group("/device")

	DeviceRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("device route is up and running")
	})

	DeviceRouter.Post("/register", middleware.AuthAppUser, controller.RegisterDevice)
	DeviceRouter.Get("/list", middleware.AuthAppUser, controller.ListDevices)
	DeviceRouter.Delete("/revoke/:deviceId", middleware.AuthAppUser, controller.RevokeDevice)
	DeviceRouter.Get("/check/:deviceId", middleware.AuthAppUser, controller.ChekifDeviceRegistered)
	DeviceRouter.Put("/sync/:deviceId", middleware.AuthAppUser, controller.UpdateDeviceSync)
}
