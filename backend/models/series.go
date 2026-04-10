package models

import "gorm.io/datatypes"

type Series struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Name string `gorm:"size:50;not null;index" json:"name"`
	// Example: EC, INV, PO, DN, CN
	Prefix string `gorm:"size:50;not null;index" json:"prefix"`

	// it is just string
	Postfix string `gorm:"size:50;not null;index" json:"postfix"`

	Remarks string `gorm:"type:text" json:"remarks"`

	// document type (e.g. Invoice, Quotation)
	DocumentType string `gorm:"size:100" json:"document_type,omitempty"`

	// Optional scope controls (recommended for ERP)
	CompanyID        *uint          `json:"company_id,omitempty"`
	CompanyBranchID  *uint          `json:"company_branch_id,omitempty"`
	CompanyBranchIDs datatypes.JSON `gorm:"type:jsonb" json:"company_branch_ids,omitempty"`

	IsActive bool `gorm:"default:true" json:"is_active"`
}
