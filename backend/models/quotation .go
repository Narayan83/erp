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
	QuotationID         uint            `gorm:"primaryKey" json:"quotation_id"`
	QuotationNumber     string          `gorm:"unique;not null" json:"quotation_number"`
	QuotationDate       time.Time       `gorm:"not null" json:"quotation_date"`
	CustomerID          uint            `gorm:"not null" json:"customer_id"` // FK to User
	Customer            User            `gorm:"foreignKey:CustomerID" json:"customer"`
	MarketingPersonID   uint            `json:"marketing_person_id"` // FK to User
	MarketingPerson     User            `gorm:"foreignKey:MarketingPersonID" json:"marketing_person"`
	SalesCreditPersonID uint            `json:"sales_credit_person_id"` // FK to User
	SalesCreditPerson   User            `gorm:"foreignKey:SalesCreditPersonID" json:"sales_credit_person"`
	ValidUntil          *time.Time      `json:"valid_until,omitempty"`
	TotalAmount         float64         `gorm:"not null" json:"total_amount"`
	Discount            *float64        `json:"discount,omitempty"`
	TaxAmount           float64         `gorm:"not null" json:"tax_amount"`
	GrandTotal          float64         `gorm:"not null" json:"grand_total"`
	Status              QuotationStatus `gorm:"type:varchar(20);not null" json:"status"`
	CreatedBy           uint            `json:"created_by"` // FK to User
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`

	SeriesID          *uint         `json:"series_id,omitempty"` // FK to Series
	Series            Series        `gorm:"foreignKey:SeriesID" json:"series,omitempty"`
	CompanyID         *uint         `json:"company_id,omitempty"` // FK to Company
	Company           Company       `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	CompanyBranchID   *uint         `json:"company_branch_id,omitempty"` // FK to CompanyBranch
	Branch            CompanyBranch `gorm:"foreignKey:CompanyBranchID" json:"branch,omitempty"`
	BillingAddressID  *uint         `json:"billing_address_id,omitempty"` // FK to UserAddress
	BillingAddress    UserAddress   `gorm:"foreignKey:BillingAddressID" json:"billing_address,omitempty"`
	ShippingAddressID *uint         `json:"shipping_address_id,omitempty"` // FK to UserAddress
	ShippingAddress   UserAddress   `gorm:"foreignKey:ShippingAddressID" json:"shipping_address,omitempty"`
	QuotationScpCount *int          `json:"quotation_scp_count,omitempty"`

	// ✅ Optional Fields
	Currency            *string  `gorm:"type:varchar(10)" json:"currency,omitempty"`
	ExchangeRate        *float64 `json:"exchange_rate,omitempty"`
	Revised             *bool    `json:"revised,omitempty"`
	RevisedNo           *string  `gorm:"type:varchar(50)" json:"revised_no,omitempty"`
	ShippingCode        *string  `gorm:"type:varchar(50)" json:"shipping_code,omitempty"`
	GSTApplicable       *bool    `json:"gst_applicable,omitempty"`
	SalesCredit         *string  `gorm:"type:varchar(100)" json:"sales_credit,omitempty"`
	BillingAddressText  *string  `gorm:"type:text" json:"billing_address,omitempty"`
	ShippingAddressText *string  `gorm:"type:text" json:"shipping_address,omitempty"`
	TermsAndConditions  *string  `gorm:"type:text" json:"terms_and_conditions,omitempty"`
	References          *string  `gorm:"type:text" json:"references,omitempty"`
	Note                *string  `gorm:"type:text" json:"note,omitempty"`
	ContactPerson       *string  `gorm:"type:varchar(100)" json:"contact_person,omitempty"`
	EndCustomerName     *string  `gorm:"type:varchar(100)" json:"end_customer_name,omitempty"`
	EndDealerName       *string  `gorm:"type:varchar(100)" json:"end_dealer_name,omitempty"`
	AttachmentPath      *string  `gorm:"type:text" json:"attachment_path,omitempty"`

	QuotationItems []QuotationItem `gorm:"foreignKey:QuotationID" json:"quotation_items,omitempty"`
}
