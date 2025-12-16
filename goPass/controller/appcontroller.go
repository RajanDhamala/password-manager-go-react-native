package controller

//
import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"goPass/config"
	"goPass/models"
	"gorm.io/datatypes"
)

type RegisterVaultEntryRequest struct {
	AesHashKeyRecovery datatypes.JSON `json:"AesHashKeyRecovery"`
	RecoverySalt       string         `json:"RecoverySalt"`
	MasterSalt         string         `json:"MasterSalt"`
	AesHashKeyMaster   datatypes.JSON `json:"AesHashKeyMaster"`
	MasterPasswordHash string         `json:"MasterPasswordHash"`
}

func RegisterVaultEntry(c *fiber.Ctx) error {
	id := c.Locals("id").(uuid.UUID)

	var data RegisterVaultEntryRequest
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "invalid request",
		})
	}

	result := config.DB.Model(&models.AppUser{}).
		Where("id = ? AND master_salt IS NULL", id).
		Updates(map[string]interface{}{
			"master_password_hash":  data.MasterPasswordHash,
			"master_salt":           data.MasterSalt,
			"recovery_salt":         data.RecoverySalt,
			"aes_hash_key_master":   data.AesHashKeyMaster,
			"aes_hash_key_recovery": data.AesHashKeyRecovery,
		})

	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "failed to register vault",
		})
	}

	if result.RowsAffected == 0 {
		return c.Status(409).JSON(fiber.Map{
			"error": "vault already registered",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "vault registered successfully",
	})
}

func CheckIfVaultRegistered(c *fiber.Ctx) error {
	id := c.Locals("id").(uuid.UUID)
	UserData := models.AppUser{}

	if error := config.DB.Where("id=?", id).Where("master_salt IS NOT NULL").Select("id", "master_password_hash").First(&UserData).Error; error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "user not found in",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Vault initilization found",
	})
}
