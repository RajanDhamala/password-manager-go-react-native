package controller

import (
	"time"

	"goPass/config"
	"goPass/models"

	"github.com/gofiber/fiber/v2"

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

	clientIP := c.IP()
	if forwarded := c.Get("X-Forwarded-For"); forwarded != "" {
		clientIP = forwarded
	}

	now := time.Now()
	newDevice := models.Device{
		ID:              uuid.New(),
		UserID:          id,
		DeviceName:      data.DeviceName,
		DevicePublicKey: data.DevicePublicKey,
		IPAddress:       clientIP,
		LastSyncAt:      now,
		CreatedAt:       now,
	}
	if err := config.DB.Create(&newDevice).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to add new device",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "successfully added new device",
		"data":    newDevice,
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

	if err := config.DB.Where("user_id=?", id).Order("last_sync_at DESC").Find(&deviceList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get synced devices",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "fetched the list of synced devices",
		"data":    deviceList,
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
		"message": "successfully unsynced device " + deviceId,
	})
}

func UpdateDeviceSync(c *fiber.Ctx) error {
	userId := c.Locals("id").(uuid.UUID)
	deviceID := c.Params("deviceId")

	if userId == uuid.Nil || deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid data passed",
		})
	}

	clientIP := c.IP()
	if forwarded := c.Get("X-Forwarded-For"); forwarded != "" {
		clientIP = forwarded
	}

	deviceData := models.Device{}
	if err := config.DB.Where("id=? AND user_id=?", deviceID, userId).First(&deviceData).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "device not found",
		})
	}

	deviceData.LastSyncAt = time.Now()
	deviceData.IPAddress = clientIP

	if err := config.DB.Save(&deviceData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update device",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "device sync updated",
		"data":    deviceData,
	})
}

func ChekifDeviceRegistered(c *fiber.Ctx) error {
	userId := c.Locals("id").(uuid.UUID)
	deviceID := c.Params("deviceId")

	if userId == uuid.Nil || deviceID == "" {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "invalid data passed",
		})
	}

	deviceData := models.Device{}
	if error_ := config.DB.Where("id=?", deviceID).Where("user_id=?", userId).First(&deviceData).Error; error_ != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch device info",
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"message": "successfully retrieved device data",
		"data":    deviceData,
	})
}
