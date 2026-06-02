package models

import "time"

type LeadProduct struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"size:50;uniqueIndex" json:"code"`
	Name      string    `gorm:"size:150;not null;uniqueIndex" json:"name"`
	Active    bool      `gorm:"default:true" json:"active"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
