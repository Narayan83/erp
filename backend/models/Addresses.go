package models

type Addresses struct {
	ID           uint   `gorm:"primaryKey"`
	AddressTitle string `gorm:"unique;not null"`
	AddressLine1 string `gorm:"type:text" json:"address_line1,omitempty"`
	AddressLine2 string `gorm:"type:text" json:"address_line2,omitempty"`
	AddressLine3 string `gorm:"type:text" json:"address_line3,omitempty"`
	AddressLine4 string `gorm:"type:text" json:"address_line4,omitempty"`

	City        string `gorm:"type:text" json:"city,omitempty"`
	District    string `gorm:"type:text" json:"district,omitempty"`
	State       string `gorm:"type:text" json:"state,omitempty"`
	Country     string `gorm:"type:text" json:"country,omitempty"`
	Pincode     string `gorm:"type:text" json:"pincode,omitempty"`
	AddressType string `gorm:"type:text" json:"address_type,omitempty"`
}
