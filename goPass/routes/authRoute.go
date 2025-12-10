package router

import (
	"github.com/gofiber/fiber/v2"
	"goPass/controller"
	"goPass/middlewares"
)

func AuthRoute(app *fiber.App) {
	AuthRouter := app.Group("/auth")

	AuthRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("auth route is up and running")
	})

	AuthRouter.Post("/register", controller.RegisterAppUser)
	AuthRouter.Post("/login", controller.LoginAppUser)
	AuthRouter.Get("/profile", middleware.AuthAppUser, controller.AppGetProfile)
	AuthRouter.Get("/refresh", controller.RefreshAppToken)
}
