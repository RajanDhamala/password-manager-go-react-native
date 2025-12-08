package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"goPass/config"
	"goPass/models"
	"goPass/routes"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system environment variables")
	}
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept",
		AllowCredentials: true,
	}))
	app.Get("/robots.txt", func(c *fiber.Ctx) error {
		return c.SendFile("./robots.txt")
	})

	app.Use(logger.New())
	config.ConnectDB()
	// Auto-create table
	// config.DB.Migrator().DropTable(&models.Post{}, &models.User{})
	// config.DB.AutoMigrate(&models.User{}, &models.Post{})

	error := config.DB.AutoMigrate(
		&models.AppUser{},
		&models.Device{},
		&models.VaultEntry{})
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
		port = "8080"
	}

	app.Listen(":" + port)
}
