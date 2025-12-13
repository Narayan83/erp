package models

import (
	"time"
)

type QuotationStatus string

const (
	Draft    QuotationStatus = "Draft"
	Sent     QuotationStatus = "Sent"
	Accepted QuotationStatus = "Accepted"
	Rejected QuotationStatus = "Rejected"
)

type Quotation struct {
	QuotationID       uint            `gorm:"primaryKey" json:"quotation_id"`
	QuotationNumber   string          `gorm:"unique;not null" json:"quotation_number"`
	QuotationDate     time.Time       `gorm:"not null" json:"quotation_date"`
	CustomerID        uint            `gorm:"not null" json:"customer_id"` // FK to User
	Customer          User            `gorm:"foreignKey:CustomerID" json:"customer"`
	MarketingPersonID uint            `json:"marketing_person_id"` // FK to User
	MarketingPerson   User            `gorm:"foreignKey:MarketingPersonID" json:"marketing_person"`
	ValidUntil        *time.Time      `json:"valid_until,omitempty"`
	TotalAmount       float64         `gorm:"not null" json:"total_amount"`
	Discount          *float64        `json:"discount,omitempty"`
	TaxAmount         float64         `gorm:"not null" json:"tax_amount"`
	GrandTotal        float64         `gorm:"not null" json:"grand_total"`
	Status            QuotationStatus `gorm:"type:varchar(20);not null" json:"status"`
	CreatedBy         uint            `json:"created_by"` // FK to User
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	// ✅ Optional Fields
	Currency           *string  `gorm:"type:varchar(10)" json:"currency,omitempty"`
	ExchangeRate       *float64 `json:"exchange_rate,omitempty"`
	Revised            *bool    `json:"revised,omitempty"`
	RevisedNo          *string  `gorm:"type:varchar(50)" json:"revised_no,omitempty"`
	ShippingCode       *string  `gorm:"type:varchar(50)" json:"shipping_code,omitempty"`
	GSTApplicable      *bool    `json:"gst_applicable,omitempty"`
	SalesCredit        *string  `gorm:"type:varchar(100)" json:"sales_credit,omitempty"`
	BillingAddress     *string  `gorm:"type:text" json:"billing_address,omitempty"`
	ShippingAddress    *string  `gorm:"type:text" json:"shipping_address,omitempty"`
	TermsAndConditions *string  `gorm:"type:text" json:"terms_and_conditions,omitempty"`
	References         *string  `gorm:"type:text" json:"references,omitempty"`
	Note               *string  `gorm:"type:text" json:"note,omitempty"`

	QuotationItems []QuotationItem `gorm:"foreignKey:QuotationID" json:"quotation_items,omitempty"`
}
