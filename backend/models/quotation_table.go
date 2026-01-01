package models

import (
	"time"

	"gorm.io/datatypes"
)

// QuotationStatuses represents possible statuses for a quotation
type QuotationStatuses string

const (
	Qt_Draft     QuotationStatuses = "draft"
	Qt_Sent      QuotationStatuses = "sent"
	Qt_Confirmed QuotationStatuses = "confirmed"
	Qt_Cancelled QuotationStatuses = "cancelled"
)

type QuotationTable struct {
	QuotationID uint `gorm:"primaryKey" json:"quotation_id"`

	// ?? Series & Numbering
	SeriesID uint   `gorm:"not null;index" json:"series_id"`
	Series   Series `gorm:"foreignKey:SeriesID" json:"series"`

	QuotationNumber string    `gorm:"unique;not null" json:"quotation_number"`
	QuotationDate   time.Time `gorm:"not null" json:"quotation_date"`

	// ?? Company Context
	CompanyID uint `gorm:"not null;index" json:"company_id"`

	CompanyBranchID uint          `gorm:"not null;index" json:"company_branch_id"`
	CompanyBranch   CompanyBranch `gorm:"foreignKey:CompanyBranchID" json:"company_branch"`

	CompanyBranchBankID *uint              `json:"company_branch_bank_id,omitempty"`
	CompanyBranchBank   *CompanyBranchBank `gorm:"foreignKey:CompanyBranchBankID" json:"company_branch_bank,omitempty"`

	// ?? Customer & Sales
	CustomerID uint `gorm:"not null" json:"customer_id"`
	Customer   User `gorm:"foreignKey:CustomerID" json:"customer"`

	SalesCreditPersonID uint `json:"sales_credit_person_id"`
	SalesCreditPerson   User `gorm:"foreignKey:SalesCreditPersonID" json:"sales_credit_person"`

	QuotationScpCount uint `gorm:"column:quotation_scp_count;not null" json:"quotation_scp_count"`

	ValidUntil *time.Time `json:"valid_until,omitempty"`

	// ?? Amounts
	TotalAmount    float64  `gorm:"not null" json:"total_amount"`
	Discount       *float64 `json:"discount,omitempty"`
	TaxAmount      float64  `gorm:"not null" json:"tax_amount"`
	RoundoffAmount float64  `gorm:"not null" json:"roundoff_amount"`
	GrandTotal     float64  `gorm:"not null" json:"grand_total"`

	// ?? Status
	Status QuotationStatuses `gorm:"type:varchar(20);not null" json:"status"`

	// ?? Audit
	CreatedBy uint      `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ?? Optional Meta
	Currency      *string  `gorm:"type:varchar(10)" json:"currency,omitempty"`
	ExchangeRate  *float64 `json:"exchange_rate,omitempty"`
	Revised       *bool    `json:"revised,omitempty"`
	RevisedNo     *string  `gorm:"type:varchar(50)" json:"revised_no,omitempty"`
	ShippingCode  *string  `gorm:"type:varchar(50)" json:"shipping_code,omitempty"`
	GSTApplicable *bool    `json:"gst_applicable,omitempty"`

	// ?? Addresses
	BillingAddressID uint        `gorm:"not null" json:"billing_address_id"`
	BillingAddress   UserAddress `gorm:"foreignKey:BillingAddressID" json:"billing_address"`

	ShippingAddressID uint        `gorm:"not null" json:"shipping_address_id"`
	ShippingAddress   UserAddress `gorm:"foreignKey:ShippingAddressID" json:"shipping_address"`

	// ?? Terms & Notes
	TermsAndConditions datatypes.JSON `gorm:"type:json" json:"terms_and_conditions"`
	ExtraCharges       datatypes.JSON `gorm:"type:json" json:"extra_charges,omitempty"`
	Discounts          datatypes.JSON `gorm:"type:json" json:"discounts,omitempty"`

	EndCustomerName *string `gorm:"type:text" json:"end_customer_name,omitempty"`
	EndDealerName   *string `gorm:"type:text" json:"end_dealer_name,omitempty"`
	ContactPerson   *string `gorm:"type:text" json:"contact_person,omitempty"`
	References      *string `gorm:"type:text" json:"references,omitempty"`
	Note            *string `gorm:"type:text" json:"note,omitempty"`

	AttachmentPath *string `gorm:"type:text" json:"attachment_path,omitempty"`

	// ?? Items
	QuotationTableItems []QuotationTableItems `gorm:"foreignKey:QuotationID" json:"quotation_items,omitempty"`
}
