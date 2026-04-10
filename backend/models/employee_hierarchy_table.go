package models

import "time"

type EmployeeHierarchy struct {
	ID uint `gorm:"primaryKey" json:"id"`

	ManagerID uint     `json:"manager_id"`
	Manager   Employee `gorm:"foreignKey:ManagerID"`

	EmployeeID uint     `json:"employee_id"`
	Employee   Employee `gorm:"foreignKey:EmployeeID"`

	RelationType string `json:"relation_type,omitempty"`
	// Example: "reports_to", "team_lead", "supervisor"

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
