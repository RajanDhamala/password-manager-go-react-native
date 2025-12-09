package controller

//
import (
	// 	"log"
	//
	"github.com/gofiber/fiber/v2"

	"github.com/google/uuid"
	"goPass/config"
	"goPass/models"
	"gorm.io/datatypes"
)

type CreateVaultRequest struct {
	PlatformName      string         `json:"platformname"`
	EntryKey          string         `json:"entrykey"`
	EncryptedPassword []byte         `json:"encyptedpassword"`
	IV                []byte         `json:"iv"`
	MetaData          datatypes.JSON `json:"metadata"`
}

func CreateVault(c *fiber.Ctx) error {
	data := CreateVaultRequest{}
	id := c.Locals("id").(uuid.UUID)
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the request",
		})
	}

	if data.PlatformName == "" || data.EntryKey == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "PlatformName and EntryKey are required",
		})
	}

	if len(data.EncryptedPassword) == 0 || len(data.IV) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "EncryptedPassword and IV cannot be empty",
		})
	}

	VaultEntry := models.VaultEntry{
		ID:                uuid.New(),
		UserID:            id,
		PlatformName:      data.PlatformName,
		EntryKey:          data.EntryKey,
		MetaData:          data.MetaData,
		EncryptedPassword: data.EncryptedPassword,
	}

	if err := config.DB.Create(&VaultEntry).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to sync vault added",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "add in the vault succesfully",
		"data":    VaultEntry,
	})
}

type YourVaultResponse struct{}

func GetYourVault(c *fiber.Ctx) error {
	// return all encrypted items
	id := c.Locals("id").(uuid.UUID)
	if id == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "please include id in req",
		})
	}

	vaults := []models.VaultEntry{}
	if err := config.DB.Where("id=?", id).First(&vaults).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "no vault entry found in db",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "succesfully fetched vault form db",
		"data":    vaults,
	})
}

type UpdateVaultRequest struct {
	Id           uuid.UUID `json:"id"`
	EntryKey     string    `json:"entrykey"`
	PlatformName string    `json:"platformname"`
}

func UpdateItem(c *fiber.Ctx) error {
	// update item
	userId := c.Locals("id").(uuid.UUID)
	data := UpdateVaultRequest{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the requesr",
		})
	}

	if data.Id == uuid.Nil || data.PlatformName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid data in req",
		})
	}

	vaultData := models.VaultEntry{}
	if err := config.DB.Where("user_id=?", userId).First(&vaultData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "vault not found in db",
		})
	}
	vaultData.PlatformName = data.PlatformName
	vaultData.EntryKey = data.EntryKey

	if err := config.DB.Save(&vaultData); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update vault in db",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "succesfully update vaul",
		"data":    vaultData,
	})
}

func DeleteVaultItem(c *fiber.Ctx) error {
	vaultId := c.Params("vaultId")
	id := c.Locals("id").(uuid.UUID)

	if vaultId == "" || id == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid data",
		})
	}
	vaultmodel := models.VaultEntry{}
	if err := config.DB.Where("id=?", vaultId).Where("user_id=?", id).Delete(&vaultmodel).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to terminated vault data",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "vualt item terminated succesfully",
	})
}
