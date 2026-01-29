package router

import (
	"github.com/gofiber/fiber/v2"
	"goPass/controller"

	"goPass/middlewares"
)

func VaultRoute(app *fiber.App) {
	VaultRouter := app.Group("/vault")

	VaultRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("vault router is up and running")
	})
	VaultRouter.Get("/items", middleware.AuthAppUser, controller.GetYourVault)
	VaultRouter.Get("/stats", middleware.AuthAppUser, controller.GetVaultStats)

	VaultRouter.Post("/add", middleware.AuthAppUser, controller.CreateVault)
	VaultRouter.Post("/check-breaches", middleware.AuthAppUser, controller.CheckAllBreaches)

	VaultRouter.Delete("/delete/:vaultId", middleware.AuthAppUser, controller.DeleteVaultItem)

	VaultRouter.Put("/update", middleware.AuthAppUser, controller.UpdateItem)
}
