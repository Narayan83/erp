package models

import "time"

type EmployeeCustomer struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	EmployeeID uint      `gorm:"not null" json:"employee_id"`
	CustomerID uint      `gorm:"not null" json:"customer_id"`
	AssignedAt time.Time `gorm:"autoCreateTime" json:"assigned_at"`

	Employee User `gorm:"foreignKey:EmployeeID" json:"employee"`
	Customer User `gorm:"foreignKey:CustomerID" json:"customer"`
}
