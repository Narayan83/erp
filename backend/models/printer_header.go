package models

import "time"

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

	LogoData string `gorm:"type:text" json:"logo_data"` // store only the logo image as base64 or file path

	Alignment string `json:"alignment"` // left, center, right

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
