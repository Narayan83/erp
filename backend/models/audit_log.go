package models

import (
	"time"

	"gorm.io/datatypes"
)

// AuditLog stores one row per mutation (create/update/delete) with optional JSON snapshots.
type AuditLog struct {
	ID uint `gorm:"primaryKey" json:"id"`

	CreatedAt time.Time `json:"created_at"`

	// MenuLabel is the UI context (typically X-Audit-Menu: pathname or menu title).
	MenuLabel string `gorm:"size:512;index" json:"menu_label"`

	Action string `gorm:"size:32;index" json:"action"` // create, update, delete

	EntityType string `gorm:"size:128;index" json:"entity_type"`
	EntityID   string `gorm:"size:128;index" json:"entity_id"`

	UserID    *uint  `gorm:"index" json:"user_id,omitempty"`
	UserEmail string `gorm:"size:255" json:"user_email,omitempty"`
	ClientIP  string `gorm:"size:128" json:"client_ip"`

	OldValue datatypes.JSON `gorm:"type:jsonb" json:"old_value,omitempty"`
	NewValue datatypes.JSON `gorm:"type:jsonb" json:"new_value,omitempty"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
