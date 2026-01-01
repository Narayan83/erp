package models

import "time"

type Department struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"unique;not null" json:"name"`
	Designation *string   `json:"designation,omitempty"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// One head per department
	HeadID *uint `json:"head_id"`
	Head   *User `gorm:"foreignKey:HeadID" json:"head,omitempty"`

	// Optional: Preload employees using DepartmentRelation
	Employees []DepartmentRelation `gorm:"foreignKey:DepartmentID" json:"employees,omitempty"`
}

// DepartmentRelation maps employees to department (under a head)
type DepartmentRelation struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	DepartmentID uint      `json:"department_id"`
	EmployeeID   uint      `json:"employee_id"`
	AssignedByID *uint     `json:"assigned_by_id"` // who assigned (optional)
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Department Department `gorm:"foreignKey:DepartmentID" json:"department"`
	Employee   User       `gorm:"foreignKey:EmployeeID" json:"employee"`
	AssignedBy *User      `gorm:"foreignKey:AssignedByID" json:"assigned_by,omitempty"`
}
