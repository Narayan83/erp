package models

import "time"

type EmployeeUserRelation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	EmployeeID uint      `json:"employee_id"` // the employee (manager)
	UserID     uint      `json:"user_id"`     // the user under that employee
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Employees are represented by records in `users` table (models.User)
	Employee User `gorm:"foreignKey:EmployeeID" json:"employee"`
	User     User `gorm:"foreignKey:UserID" json:"user"`
}
