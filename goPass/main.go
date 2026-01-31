package main

import (
	"log"
	"os"

	"goPass/config"
	"goPass/models"
	router "goPass/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
	}))
	app.Get("/robots.txt", func(c *fiber.Ctx) error {
		return c.SendFile("./robots.txt")
	})

	app.Use(logger.New())
	config.ConnectDB()
	// Auto-create table

	error := config.DB.AutoMigrate(
		&models.AppUser{},
		&models.Device{},
		&models.VaultEntry{},
		&models.OTP{})
	if error != nil {
		log.Fatal("Migration failed:", err)
	}

	// Setup routes
	router.UserRoute(app)
	router.AppRouter(app)
	router.DeviceRoute(app)
	router.VaultRoute(app)
	router.AuthRoute(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Fatal(app.Listen("0.0.0.0:" + port))
}
