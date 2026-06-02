package models

import (
	"time"

	"gorm.io/datatypes"
)

type PrinterHeader struct {
	ID uint `gorm:"primaryKey" json:"id"`

	HeaderTitle    string `json:"header_title"`
	HeaderSubtitle string `json:"header_subtitle"`

	Address string `json:"address"`
	Pin     string `json:"pin"`
	GSTIN   string `json:"gstin"`

	Mobile  string `json:"mobile"`
	Email   string `json:"email"`
	Website string `json:"website"`

	LogoData  string         `gorm:"type:text" json:"logo_data"`                // currently selected logo image
	LogosData datatypes.JSON `gorm:"type:jsonb;default:'[]'" json:"logos_data"` // all uploaded logo images

	Alignment string `json:"alignment"` // left, center, right

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
