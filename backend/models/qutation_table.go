package models

import (
	"time"
)

type QuotationStatuses string

const (
	Qt_Draft    QuotationStatuses = "Draft"
	Qt_Sent     QuotationStatuses = "Sent"
	Qt_Accepted QuotationStatuses = "Accepted"
	Qt_Rejected QuotationStatuses = "Rejected"
)

type QuotationTable struct {
	QuotationID         uint              `gorm:"primaryKey" json:"quotation_id"`
	QuotationNumber     string            `gorm:"unique;not null" json:"quotation_number"`
	QuotationDate       time.Time         `gorm:"not null" json:"quotation_date"`
	CustomerID          uint              `gorm:"not null" json:"customer_id"` // FK to User
	Customer            User              `gorm:"foreignKey:CustomerID" json:"customer"`
	SalesCreditPersonID uint              `json:"sales_credit_person_id"` // FK to User
	SalesCreditPerson   User              `gorm:"foreignKey:SalesCreditPersonID" json:"sales_credit_person"`
	ValidUntil          *time.Time        `json:"valid_until,omitempty"`
	TotalAmount         float64           `gorm:"not null" json:"total_amount"`
	Discount            *float64          `json:"discount,omitempty"`
	TaxAmount           float64           `gorm:"not null" json:"tax_amount"`
	RoundoffAmount      float64           `gorm:"not null" json:"roundoff_amount"`
	GrandTotal          float64           `gorm:"not null" json:"grand_total"`
	Status              QuotationStatuses `gorm:"type:varchar(20);not null" json:"status"`
	CreatedBy           uint              `json:"created_by"` // FK to User
	CreatedAt           time.Time         `json:"created_at"`
	UpdatedAt           time.Time         `json:"updated_at"`

	// ✅ Optional Fields
	Currency      *string  `gorm:"type:varchar(10)" json:"currency,omitempty"`
	ExchangeRate  *float64 `json:"exchange_rate,omitempty"`
	Revised       *bool    `json:"revised,omitempty"`
	RevisedNo     *string  `gorm:"type:varchar(50)" json:"revised_no,omitempty"`
	ShippingCode  *string  `gorm:"type:varchar(50)" json:"shipping_code,omitempty"`
	GSTApplicable *bool    `json:"gst_applicable,omitempty"`

	BillingAddressID  uint      `gorm:"not null" json:"billing_address_id"`
	BillingAddress    Addresses `gorm:"foreignKey:BillingAddressID" json:"billing_address"`
	ShippingAddressID uint      `gorm:"not null" json:"shipping_address_id"`
	ShippingAddress   Addresses `gorm:"foreignKey:ShippingAddressID" json:"shipping_address"`

	TandCId           uint    `json:"t_and_c_id"`
	TermsAndCondtions TandC   `gorm:"foreignKey:TandCId" json:"terms_and_conditions"`
	References        *string `gorm:"type:text" json:"references,omitempty"`
	Note              *string `gorm:"type:text" json:"note,omitempty"`

	QuotationTableItems []QuotationTableItems `gorm:"foreignKey:QuotationID" json:"quotation_items,omitempty"`
}
