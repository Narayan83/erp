package models

type HsnCode struct {
	ID    uint   `gorm:"primaryKey" json:"id"` // optional
	Code  string `gorm:"not null;unique" json:"code"`
	TaxID uint   `gorm:"not null" json:"tax_id"`
	Tax   *Tax   `gorm:"foreignKey:TaxID"` // use pointer to avoid parsing issues
}
