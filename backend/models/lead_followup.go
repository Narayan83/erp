package models

import (
	"time"
)

type LeadFollowUp struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	LeadID uint `json:"lead_id"` // FK → Lead
	Lead   Lead `gorm:"foreignKey:LeadID" json:"-"`

	AssignedToID *uint `json:"assigned_to_id"`
	AssignedTo   User  `gorm:"foreignKey:AssignedToID" json:"assigned_to"`

	Title      string    `json:"title"`
	Notes      string    `json:"notes"`
	Source     string    `json:"source"` // origin of this follow-up (e.g. "quotation", "crm")
	FollowUpOn time.Time `json:"followup_on"`
	Status     string    `json:"status"` // pending, done, skipped, cancelled

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
