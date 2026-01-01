package models

import (
	"encoding/json"
	"time"
)

type Lead struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Business string `json:"business"`
	// Keep DB column as `contact` for backwards-compatibility with existing migrations
	Name          string    `gorm:"column:contact" json:"name"`
	Designation   string    `json:"designation"`
	Mobile        string    `json:"mobile"`
	Email         string    `json:"email"`
	AddressLine1  string    `json:"addressLine1"`
	AddressLine2  string    `json:"addressLine2"`
	City          string    `json:"city"`
	State         string    `json:"state"`
	Country       string    `json:"country"`
	Source        string    `json:"source"`
	Stage         string    `json:"stage"`
	Potential     float64   `json:"potential"`
	Since         time.Time `json:"since"`
	GSTIN         string    `json:"gstin"`
	Category      string    `json:"category"`
	Website       string    `json:"website"`
	Requirements  string    `json:"requirements"`
	Notes         string    `json:"notes"`
	Tags          string    `json:"tags"`
	LastTalk      time.Time `json:"lastTalk"`
	NextTalk      time.Time `json:"nextTalk"`
	TransferredOn time.Time `json:"transferredOn"`

	// ✅ Assigned User (make pointer for optional)
	AssignedToID *uint `json:"assigned_to_id"`
	AssignedTo   User  `gorm:"foreignKey:AssignedToID" json:"assigned_to"`

	// ✅ Product Reference (make pointer for optional)
	ProductID *uint   `json:"product_id"`
	Product   Product `gorm:"foreignKey:ProductID" json:"product"`

	// Text fields for storing names directly from import
	AssignedToName string `json:"assignedToName"`
	ProductName    string `json:"productName"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// Custom JSON unmarshal to accept both `contact` and `name` fields from clients
func (l *Lead) UnmarshalJSON(data []byte) error {
	// Define an alias to avoid recursion
	type Alias Lead
	aux := &struct {
		Contact *string `json:"contact"`
		Name    *string `json:"name"`
		*Alias
	}{
		Alias: (*Alias)(l),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Prefer explicit `name`, fallback to `contact` if provided
	if aux.Name != nil && *aux.Name != "" {
		l.Name = *aux.Name
	} else if aux.Contact != nil {
		l.Name = *aux.Contact
	}

	return nil
}

// Custom JSON marshal to include both `name` and `contact` keys for frontend compatibility
func (l Lead) MarshalJSON() ([]byte, error) {
	type Alias Lead
	aux := &struct {
		Contact string `json:"contact"`
		Name    string `json:"name"`
		*Alias
	}{
		Contact: l.Name,
		Name:    l.Name,
		Alias:   (*Alias)(&l),
	}
	return json.Marshal(aux)
}
