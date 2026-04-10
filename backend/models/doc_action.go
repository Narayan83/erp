package models

import "time"

type DocumentAction struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	DocumentID   uint       `gorm:"not null;index:idx_document_actions_doc" json:"document_id"`
	DocumentType string     `gorm:"type:varchar(100);not null;index:idx_document_actions_doc" json:"document_type"`
	AssignedToID *uint      `json:"assigned_to_id"`
	AssignedTo   User       `gorm:"foreignKey:AssignedToID" json:"assigned_to"`
	Title        string     `gorm:"type:varchar(100);not null" json:"title"`
	Notes        string     `gorm:"type:text" json:"notes"`
	ActionOn     time.Time  `gorm:"not null" json:"action_on"`
	Status       string     `gorm:"type:varchar(30);not null;default:pending" json:"status"`
	CompletedAt  *time.Time `json:"completed_at"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
