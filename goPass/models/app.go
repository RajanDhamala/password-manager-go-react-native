package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type AppUser struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email          string    `gorm:"unique;not null;index"`
	Password       string    `gorm:"not null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      gorm.DeletedAt `gorm:"index"`
	Devices        []Device       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	VaultEntries   []VaultEntry   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	FullName       string         `gorm:"not null"`
	ProfilePicture string
}

type Device struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;index"`
	DeviceName      string
	DevicePublicKey string `gorm:"not null"`
	LastSyncAt      time.Time
	CreatedAt       time.Time
	User            AppUser `gorm:"foreignKey:UserID"`
}

type VaultEntry struct {
	ID                uuid.UUID      `gorm:"type:uuid;primaryKey"`
	UserID            uuid.UUID      `gorm:"type:uuid;not null;index"`
	PlatformName      string         `gorm:"not null"`
	EntryKey          string         `gorm:"not null"`
	EncryptedPassword []byte         `gorm:"not null"`
	IV                []byte         `gorm:"not null"`
	MetaData          datatypes.JSON `gorm:"type:jsonb;default:'{}'::jsonb"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	Deleted           bool    `gorm:"default:false"`
	User              AppUser `gorm:"foreignKey:UserID"`
}
