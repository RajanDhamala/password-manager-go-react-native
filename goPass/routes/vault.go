package router

import (
	"github.com/gofiber/fiber/v2"
	"goPass/controller"
)

func VaultRoute(app *fiber.App) {
	VaultRouter := app.Group("/vault")

	VaultRouter.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("vault router is up and running")
	})
	VaultRouter.Get("/items", controller.GetYourVault)

	VaultRouter.Post("/add", controller.CreateVault)

	VaultRouter.Delete("/delete/:vaultId", controller.DeleteVaultItem)

	VaultRouter.Put("/update", controller.UpdateItem)
}
