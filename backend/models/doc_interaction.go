package models

import "time"

type DocumentInteraction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	DocumentID    uint      `gorm:"not null;index:idx_document_interactions_doc" json:"document_id"`
	DocumentType  string    `gorm:"type:varchar(100);not null;index:idx_document_interactions_doc" json:"document_type"`
	Type          string    `gorm:"type:varchar(100);not null" json:"type"`
	Notes         string    `gorm:"type:text" json:"notes"`
	InteractionOn time.Time `gorm:"not null" json:"interaction_on"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
