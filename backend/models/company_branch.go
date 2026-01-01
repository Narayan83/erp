package models

type CompanyBranch struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	CompanyID uint `gorm:"not null;index" json:"company_id"`

	Code         string `gorm:"size:100" json:"code"`
	Name         string `gorm:"not null" json:"name"`
	GSTNumber    string `gorm:"size:20;index" json:"gst_number"` // 15-char GSTIN
	Address      string `json:"address"`
	City         string `json:"city"`
	State        string `json:"state"`
	Pincode      string `gorm:"size:6" json:"pincode"`
	IsHeadOffice bool   `gorm:"default:false" json:"is_head_office"`

	Banks []CompanyBranchBank `gorm:"foreignKey:CompanyBranchID" json:"banks,omitempty"`
}
