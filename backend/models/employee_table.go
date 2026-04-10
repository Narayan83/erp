package models

import "time"

type Employee struct {
	ID uint `gorm:"primaryKey" json:"id"`

	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID"`

	EmpCode      *string    `gorm:"uniqueIndex;size:50" json:"empcode,omitempty"`
	DepartmentID *uint      `json:"department_id,omitempty"`
	Department   Department `gorm:"foreignKey:DepartmentID"`

	DesignationID *uint       `json:"designation_id,omitempty"`
	Designation   Designation `gorm:"foreignKey:DesignationID"`

	JoiningDate *time.Time `json:"joining_date,omitempty"`
	ExitDate    *time.Time `json:"exit_date,omitempty"`

	Salary    *float64 `json:"salary,omitempty"`
	WorkEmail string   `json:"work_email,omitempty"`

	Remarks string `json:"remarks,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
