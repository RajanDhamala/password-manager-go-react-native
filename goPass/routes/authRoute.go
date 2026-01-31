package router

import (
	"goPass/controller"
	middleware "goPass/middlewares"

	"github.com/gofiber/fiber/v2"
)

func AuthRoute(app *fiber.App) {
	AuthRouter := app.Group("/auth")

	AuthRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("auth route is up and running")
	})

	AuthRouter.Post("/send-register-otp", controller.SendRegisterOTP)
	AuthRouter.Post("/register", controller.RegisterAppUser)

	AuthRouter.Post("/send-login-otp", controller.SendLoginOTP)
	AuthRouter.Post("/login", controller.LoginAppUser)

	AuthRouter.Get("/profile", middleware.AuthAppUser, controller.AppGetProfile)
	AuthRouter.Put("/profile", middleware.AuthAppUser, controller.UpdateProfile)
	AuthRouter.Put("/change-password", middleware.AuthAppUser, controller.ChangePassword)
	AuthRouter.Post("/forgot-password", controller.ForgotPassword)
	AuthRouter.Get("/refresh", controller.RefreshAppToken)
}
