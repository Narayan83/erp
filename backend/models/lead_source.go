package models

import "time"

type LeadSource struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Code        string `gorm:"size:50;uniqueIndex" json:"code"`
	Name        string `gorm:"size:100;not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Active      bool   `gorm:"default:true" json:"active"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
