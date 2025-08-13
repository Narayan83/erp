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
	ID              uint        `gorm:"primaryKey" json:"id"`
	Salutation      *string     `json:"salutation,omitempty"`
	Firstname       string      `gorm:"not null" json:"firstname"`
	Lastname        string      `gorm:"not null" json:"lastname"`
	DOB             *time.Time  `json:"dob,omitempty"`
	Gender          Gender      `gorm:"type:varchar(10)" json:"gender"`
	CountryCode     string      `gorm:"not null" json:"country_code"`
	MobileNumber    string      `gorm:"not null;unique" json:"mobile_number"`
	ContactNo       *string     `json:"contact_no,omitempty"`
	Email           string      `gorm:"unique;not null" json:"email"`
	Website         *string     `json:"website,omitempty"`
	BusinessName    *string     `json:"business_name,omitempty"`
	Title           *string     `json:"title,omitempty"`
	CompanyName     *string     `json:"companyname,omitempty"`
	Designation     *string     `json:"designation,omitempty"`
	IndustrySegment *string     `json:"industry_segment,omitempty"`
	Address1        *string     `json:"address1,omitempty"`
	Address2        *string     `json:"address2,omitempty"`
	Address3        *string     `json:"address3,omitempty"`
	Address4        *string     `json:"address4,omitempty"`
	Address5        *string     `json:"address5,omitempty"`
	State           *string     `json:"state,omitempty"`
	Country         *string     `json:"country,omitempty"`
	Pincode         *string     `json:"pincode,omitempty"`
	ContactAddress1 *string     `json:"contact_address1,omitempty"`
	ContactAddress2 *string     `json:"contact_address2,omitempty"`
	ContactAddress3 *string     `json:"contact_address3,omitempty"`
	ContactAddress4 *string     `json:"contact_address4,omitempty"`
	ContactAddress5 *string     `json:"contact_address5,omitempty"`
	ContactState    *string     `json:"contact_state,omitempty"`
	ContactCountry  *string     `json:"contact_country,,omitempty"`
	ContactPincode  *string     `json:"contact_pincode,omitempty"`
	AadharNumber    *string     `json:"aadhar_number,omitempty"`
	PANNumber       *string     `json:"pan_number,omitempty"`
	Addresses       StringArray `gorm:"type:json"`
	GSTIN           *string     `json:"gstin,omitempty"`
	MSMENo          *string     `json:"msme_no,omitempty"`
	Password        string      `json:"password"`
	Active          bool        `json:"active"`
	IsUser          bool        `json:"is_user"`
	IsCustomer      bool        `json:"is_customer"`
	IsSupplier      bool        `json:"is_supplier"`
	IsEmployee      bool        `json:"IsEmployee"`
	IsDealer        bool        `json:"IsDealer"`
	IsDistributor   bool        `json:"IsDistributor"`
	RoleID          *int        `json:"role_id,omitempty"`

	// Customers assigned to an employee
	ManagedCustomers []EmployeeCustomer `gorm:"foreignKey:EmployeeID" json:"managed_customers,omitempty"`

	// Employee(s) assigned to manage a customer
	AssignedEmployees []EmployeeCustomer `gorm:"foreignKey:CustomerID" json:"assigned_employees,omitempty"`
}
