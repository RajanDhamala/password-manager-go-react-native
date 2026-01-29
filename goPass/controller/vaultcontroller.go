package controller

import (
	"crypto/sha1"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

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
	PasswordSHA1      string         `json:"passwordsha1"`
}

func CreateVault(c *fiber.Ctx) error {
	data := CreateVaultRequest{}
	id := c.Locals("id").(uuid.UUID)
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the request",
		})
	}
	log.Println("Received vault creation request for user ID:", id)
	log.Printf("Request Data: %+v\n", data)

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

	// Check breach status if SHA1 provided
	isBreached := false
	breachCount := 0
	if data.PasswordSHA1 != "" {
		isBreached, breachCount = checkPasswordBreach(data.PasswordSHA1)
	}
	now := time.Now()

	VaultEntry := models.VaultEntry{
		ID:                uuid.New(),
		UserID:            id,
		PlatformName:      data.PlatformName,
		EntryKey:          data.EntryKey,
		MetaData:          data.MetaData,
		EncryptedPassword: data.EncryptedPassword,
		IV:                data.IV,
		PasswordSHA1:      strings.ToUpper(data.PasswordSHA1),
		IsBreached:        isBreached,
		BreachCount:       breachCount,
		LastBreachCheck:   &now,
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
	id := c.Locals("id").(uuid.UUID)
	if id == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "please include id in req",
		})
	}

	// Pagination params
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// Get total count
	var totalCount int64
	config.DB.Model(&models.VaultEntry{}).Where("user_id = ? AND deleted = ?", id, false).Count(&totalCount)

	vaults := []models.VaultEntry{}
	if err := config.DB.Where("user_id = ? AND deleted = ?", id, false).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&vaults).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch vault entries",
		})
	}

	totalPages := int((totalCount + int64(limit) - 1) / int64(limit))

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":    "succesfully fetched vault",
		"data":       vaults,
		"page":       page,
		"limit":      limit,
		"totalCount": totalCount,
		"totalPages": totalPages,
		"hasMore":    page < totalPages,
	})
}

type UpdateVaultRequest struct {
	Id                uuid.UUID      `json:"id"`
	EntryKey          string         `json:"entrykey"`
	PlatformName      string         `json:"platformname"`
	EncryptedPassword []byte         `json:"encyptedpassword"`
	IV                []byte         `json:"iv"`
	MetaData          datatypes.JSON `json:"metadata"`
	PasswordSHA1      string         `json:"passwordsha1"`
}

func UpdateItem(c *fiber.Ctx) error {
	userId := c.Locals("id").(uuid.UUID)
	data := UpdateVaultRequest{}
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to parse the request",
		})
	}

	if data.Id == uuid.Nil || data.PlatformName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid data in req",
		})
	}

	vaultData := models.VaultEntry{}
	if err := config.DB.Where("id=? AND user_id=?", data.Id, userId).First(&vaultData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "vault not found in db",
		})
	}

	vaultData.PlatformName = data.PlatformName
	vaultData.EntryKey = data.EntryKey
	if data.MetaData != nil {
		vaultData.MetaData = data.MetaData
	}
	if len(data.EncryptedPassword) > 0 && len(data.IV) > 0 {
		vaultData.EncryptedPassword = data.EncryptedPassword
		vaultData.IV = data.IV
		// If password changed, update SHA1 and check breach
		if data.PasswordSHA1 != "" {
			vaultData.PasswordSHA1 = strings.ToUpper(data.PasswordSHA1)
			isBreached, breachCount := checkPasswordBreach(data.PasswordSHA1)
			vaultData.IsBreached = isBreached
			vaultData.BreachCount = breachCount
			now := time.Now()
			vaultData.LastBreachCheck = &now
		}
	}

	if err := config.DB.Save(&vaultData).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update vault in db",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "successfully updated vault",
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

func checkPasswordBreach(sha1Hash string) (bool, int) {
	sha1Hash = strings.ToUpper(sha1Hash)
	if len(sha1Hash) < 5 {
		return false, 0
	}

	prefix := sha1Hash[:5]
	suffix := sha1Hash[5:]

	resp, err := http.Get("https://api.pwnedpasswords.com/range/" + prefix)
	if err != nil {
		log.Printf("Error checking breach: %v", err)
		return false, 0
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("HIBP API returned status: %d", resp.StatusCode)
		return false, 0
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading breach response: %v", err)
		return false, 0
	}

	lines := strings.Split(string(body), "\r\n")
	for _, line := range lines {
		parts := strings.Split(line, ":")
		if len(parts) == 2 && strings.ToUpper(parts[0]) == suffix {
			count, _ := strconv.Atoi(parts[1])
			return true, count
		}
	}

	return false, 0
}

// ComputeSHA1 computes SHA1 hash of a string (utility for frontend reference)
func ComputeSHA1(input string) string {
	h := sha1.New()
	h.Write([]byte(input))
	return strings.ToUpper(hex.EncodeToString(h.Sum(nil)))
}

// GetVaultStats returns password count and breach statistics
func GetVaultStats(c *fiber.Ctx) error {
	userId := c.Locals("id").(uuid.UUID)
	if userId == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user id",
		})
	}

	var totalCount int64
	var breachedCount int64

	if err := config.DB.Model(&models.VaultEntry{}).
		Where("user_id = ? AND deleted = ?", userId, false).
		Count(&totalCount).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to count vault entries",
		})
	}

	if err := config.DB.Model(&models.VaultEntry{}).
		Where("user_id = ? AND deleted = ? AND is_breached = ?", userId, false, true).
		Count(&breachedCount).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to count breached entries",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":        "stats fetched successfully",
		"totalPasswords": totalCount,
		"breachedCount":  breachedCount,
	})
}

// CheckAllBreaches checks all vault entries for breaches (for periodic check)
func CheckAllBreaches(c *fiber.Ctx) error {
	userId := c.Locals("id").(uuid.UUID)
	if userId == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user id",
		})
	}

	var entries []models.VaultEntry
	if err := config.DB.Where("user_id = ? AND deleted = ? AND password_sha1 != ''", userId, false).
		Find(&entries).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to fetch vault entries",
		})
	}

	updatedCount := 0
	newBreaches := 0
	now := time.Now()

	for i := range entries {
		isBreached, breachCount := checkPasswordBreach(entries[i].PasswordSHA1)
		wasBreached := entries[i].IsBreached

		entries[i].IsBreached = isBreached
		entries[i].BreachCount = breachCount
		entries[i].LastBreachCheck = &now

		if err := config.DB.Save(&entries[i]).Error; err != nil {
			log.Printf("Failed to update entry %s: %v", entries[i].ID, err)
			continue
		}
		updatedCount++
		if isBreached && !wasBreached {
			newBreaches++
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":      "breach check completed",
		"checked":      updatedCount,
		"newBreaches":  newBreaches,
		"totalEntries": len(entries),
	})
}
