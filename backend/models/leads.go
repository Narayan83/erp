package models

import "time"

type Lead struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Business      string    `json:"business"`
	Contact       string    `json:"contact"`
	Designation   string    `json:"designation"`
	Mobile        string    `json:"mobile"`
	Email         string    `json:"email"`
	City          string    `json:"city"`
	State         string    `json:"state"`
	Country       string    `json:"country"`
	Source        string    `json:"source"`
	Stage         string    `json:"stage"`
	Potential     float64   `json:"potential"`
	Since         time.Time `json:"since"`
	GSTIN         string    `json:"gstin"`
	Website       string    `json:"website"`
	LastTalk      time.Time `json:"lastTalk"`
	NextTalk      time.Time `json:"nextTalk"`
	TransferredOn time.Time `json:"transferredOn"`
	Requirements  string    `json:"requirements"`
	Notes         string    `json:"notes"`

	// ✅ Assigned User
	AssignedToID uint `json:"assigned_to_id"`
	AssignedTo   User `gorm:"foreignKey:AssignedToID" json:"assigned_to"`

	// ✅ Product Reference
	ProductID uint    `json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
