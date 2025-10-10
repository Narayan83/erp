package models

type Bank struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	Name          string  `gorm:"not null" json:"name"`
	BranchName    string  `json:"branch_name"`
	BranchAddress string  `json:"branch_address"`
	AccountNumber string  `gorm:"not null;unique" json:"account_number"`
	IFSCCode      string  `json:"ifsc_code"`
	Branch        string  `json:"branch"`
	Balance       float64 `json:"balance"`

	// Reference to a user (optional)
	UserID   *uint   `json:"user_id,omitempty"`
	UserCode *string `gorm:"size:100" json:"user_code,omitempty"`
	UserName *string `json:"user_name,omitempty"`
}
