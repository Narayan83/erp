package models

import "time"

type ServiceItem struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ItemName    string `gorm:"size:200;not null" json:"item_name"`
	Description string `gorm:"type:text" json:"description"`

	Rate float64 `gorm:"not null" json:"rate"`

	Unit   string `gorm:"size:50" json:"unit"` // Nos, Hours, Days, Job, Service etc
	Nos    int    `json:"nos"`                 // default quantity
	HSNSAC string `gorm:"size:20" json:"hsn_sac"`

	GST float64 `json:"gst"` // GST %

	Active bool `gorm:"default:true" json:"active"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
