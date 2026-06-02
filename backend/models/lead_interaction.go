package models

import (
	"time"
)

type LeadInteraction struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	LeadID uint `json:"lead_id"` // FK → Lead
	Lead   Lead `gorm:"foreignKey:LeadID" json:"-"`

	AssignedToID *uint `json:"assigned_to_id"` // Optional assigned user
	AssignedTo   User  `gorm:"foreignKey:AssignedToID" json:"assigned_to"`

	Type      string    `json:"type"`      // call, meeting, whatsapp, email, site-visit
	Summary   string    `json:"summary"`   // short line
	Details   string    `json:"details"`   // long notes
	Timestamp time.Time `json:"timestamp"` // defaults to now

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
