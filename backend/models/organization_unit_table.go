package models

import "time"

type OrganizationUnit struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique;not null" json:"name"`

	ParentID *uint             `json:"parent_id,omitempty"`
	Parent   *OrganizationUnit `gorm:"foreignKey:ParentID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
