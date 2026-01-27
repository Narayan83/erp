package models

import "time"

type CRMTag struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Code   string `gorm:"size:50;uniqueIndex" json:"code"`
	Title  string `gorm:"size:100;not null" json:"title"`
	Color  string `gorm:"size:20" json:"color"`
	Active bool   `gorm:"default:true" json:"active"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (CRMTag) TableName() string {
	return "crm_tags"
}
