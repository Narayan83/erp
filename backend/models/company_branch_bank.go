package models

type CompanyBranchBank struct {
	ID              uint `gorm:"primaryKey" json:"id"`
	CompanyBranchID uint `gorm:"not null;index" json:"company_branch_id"`

	BankName      string  `gorm:"not null" json:"bank_name"`
	BranchName    string  `json:"branch_name"`
	BranchAddress string  `json:"branch_address"`
	AccountNumber string  `gorm:"not null;unique" json:"account_number"`
	IFSCCode      string  `json:"ifsc_code"`
	Balance       float64 `json:"balance"`
}
