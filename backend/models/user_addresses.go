package models

import (
	"time"

	"gorm.io/datatypes"
)

type UserAddress struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `json:"user_id"`
	Title       string         `json:"title"` // Permanent, Home, Office, Billing, Shipping
	Address1    string         `json:"address1"`
	Address2    string         `json:"address2"`
	Address3    string         `json:"address3"`
	City        string         `json:"city"`
	State       string         `json:"state"`
	Country     string         `json:"country"`
	CountryCode string         `json:"country_code"`
	Pincode     string         `json:"pincode"`
	GSTIN       string         `json:"gstin"` // GSTIN for this address
	KeyValues   datatypes.JSON `json:"keyValues" gorm:"type:json"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
