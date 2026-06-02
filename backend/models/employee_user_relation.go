package models

import "time"

// EmployeeUserRelation links a User (e.g. CRM login) to an Employee record for assignment workflows.
type EmployeeUserRelation struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	EmployeeID uint      `gorm:"not null;index" json:"employee_id"`
	Employee   Employee  `gorm:"foreignKey:EmployeeID" json:"-"`
	UserID     uint      `gorm:"not null;uniqueIndex" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (EmployeeUserRelation) TableName() string {
	return "employee_user_relations"
}
