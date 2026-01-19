package models

import "time"

type EmployeeOrganizationUnit struct {
	ID uint `gorm:"primaryKey" json:"id"`

	EmployeeID uint     `json:"employee_id"`
	Employee   Employee `gorm:"foreignKey:EmployeeID"`

	UnitID uint             `json:"unit_id"`
	Unit   OrganizationUnit `gorm:"foreignKey:UnitID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
