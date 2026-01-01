package models

type Series struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Name string `gorm:"size:50;not null;index" json:"name"`
	// Example: EC, INV, PO, DN, CN
	Prefix string `gorm:"size:50;not null;index" json:"prefix"`

	// it is just string
	Postfix string `gorm:"size:50;not null;index" json:"postfix"`

	Remarks string `gorm:"type:text" json:"remarks"`

	// Optional scope controls (recommended for ERP)
	CompanyID       *uint `json:"company_id,omitempty"`
	CompanyBranchID *uint `json:"company_branch_id,omitempty"`

	IsActive bool `gorm:"default:true" json:"is_active"`
}
