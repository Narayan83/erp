package models

import "time"

type Employee struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Empcode      *string    `gorm:"uniqueIndex;size:100" json:"empcode,omitempty"`
	Salutation   *string    `json:"salutation,omitempty"`
	Firstname    string     `json:"firstname"`
	Lastname     string     `json:"lastname"`
	DOB          *time.Time `json:"dob,omitempty"`
	Gender       Gender     `gorm:"type:varchar(10)" json:"gender"`
	CountryCode  string     `json:"country_code"`
	MobileNumber string     `gorm:"unique" json:"mobile_number"`
	Email        string     `gorm:"unique;not null" json:"email"`
	Password     string     `json:"-"` // never expose password
	Active       bool       `json:"active"`

	// Relations
	// Addresses    []UserAddress     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"addresses"`
	// BankAccounts []UserBankAccount `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"bank_accounts"`
	// Documents    []UserDocument    `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"documents"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
