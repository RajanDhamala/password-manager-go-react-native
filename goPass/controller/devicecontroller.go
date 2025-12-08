package controller

import (
	"github.com/gofiber/fiber/v2"
	"goPass/config"
	"goPass/models"

	"github.com/google/uuid"
)

type RegisterDeviceRequest struct {
	DeviceName      string `json:"devicename"`
	DevicePublicKey string `json:"devicepublickey"`
}

func RegisterDevice(c *fiber.Ctx) error {
	data := RegisterDeviceRequest{}
	id := c.Locals("id").(uuid.UUID)

	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error": "failed to parse the request",
		})
	}

	if id == uuid.Nil || data.DeviceName == "" || data.DevicePublicKey == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form data",
		})
	}

	newDevice := models.Device{
		ID:              uuid.New(),
		UserID:          id,
		DeviceName:      data.DeviceName,
		DevicePublicKey: data.DevicePublicKey,
	}
	if err := config.DB.Create(&newDevice).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to add new device",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"messaage": "succesfully add new device",
	})
}

func ListDevices(c *fiber.Ctx) error {
	id := c.Locals("id").(uuid.UUID)

	if id == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user id",
		})
	}

	deviceList := []models.Device{}

	if err := config.DB.Where("user_id=?", id).Find(&deviceList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get synced devices",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"messaage": "fetched the list of synced devices",
		"data":     deviceList,
	})
}

func RevokeDevice(c *fiber.Ctx) error {
	deviceId := c.Params("deviceId")
	id := c.Locals("id").(uuid.UUID)

	if deviceId == "" || id == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request data",
		})
	}

	res := config.DB.Where("id=? AND user_id=?", deviceId, id).Delete(&models.Device{})
	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "device not found",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"messaage": "succesfully unsynced device" + deviceId,
	})
}
