package models

import (
	"time"
)

type Gender string

const (
	Male   Gender = "Male"
	Female Gender = "Female"
	Other  Gender = "Other"
)

type User struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	Usercode        *string    `gorm:"uniqueIndex;size:100" json:"usercode,omitempty"`
	Salutation      *string    `json:"salutation,omitempty"`
	Firstname       string     `json:"firstname"`
	Lastname        string     `json:"lastname"`
	DOB             *time.Time `json:"dob,omitempty"`
	Gender          Gender     `gorm:"type:varchar(10)" json:"gender"`
	Country         string     `json:"country,omitempty"`
	CountryCode     string     `json:"country_code"`
	MobileNumber    string     `gorm:"unique" json:"mobile_number"`
	WhatsappNumber  *string    `json:"whatsapp_number,omitempty"`
	EmergencyNumber *string    `json:"emergency_number,omitempty"`
	AlternateNumber *string    `json:"alternate_number,omitempty"`
	Website         string     `json:"website,omitempty"`
	Email           string     `gorm:"unique;not null" json:"email"`
	Password        string     `json:"-"`                        // hashed password, never return to frontend
	PlainPassword   string     `json:"plain_password,omitempty"` // plain text password for display
	Username        string     `json:"username,omitempty"`
	Active          bool       `json:"active"`

	// Business Information
	BusinessName    string `json:"business_name,omitempty"`
	CompanyName     string `json:"company_name,omitempty"`
	IndustrySegment string `json:"industry_segment,omitempty"`
	Designation     string `json:"designation,omitempty"`
	Title           string `json:"title,omitempty"`

	// Roles & Type Flags
	IsUser        bool `json:"is_user"`
	IsCustomer    bool `json:"is_customer"`
	IsSupplier    bool `json:"is_supplier"`
	IsEmployee    bool `json:"is_employee"`
	IsDealer      bool `json:"is_dealer"`
	IsDistributor bool `json:"is_distributor"`

	// Legal Information (stored directly on user, not as documents)
	AadharNumber string `json:"aadhar_number,omitempty"`
	PANNumber    string `json:"pan_number,omitempty"`
	GSTINNumber  string `json:"gstin_number,omitempty"`
	MSMENo       string `json:"msme_no,omitempty"`

	// Relationships
	Addresses    []UserAddress     `gorm:"foreignKey:UserID" json:"addresses,omitempty"`
	BankAccounts []UserBankAccount `gorm:"foreignKey:UserID" json:"bank_accounts,omitempty"`
	Documents    []UserDocument    `gorm:"foreignKey:UserID" json:"documents,omitempty"`

	// RoleID *uint `json:"role_id"`
	// Role   Role  `gorm:"foreignKey:RoleID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
