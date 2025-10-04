package models

type QuotationTableItems struct {
	ID          uint `gorm:"primaryKey" json:"id"`
	QuotationID uint `gorm:"not null" json:"quotation_id"` // FK to Quotation
	ProductID   uint `gorm:"not null" json:"product_id"`   // FK to Product

	ProductCode string  `gorm:"type:text" json:"product_code"`
	Description string  `gorm:"type:text" json:"description"`
	Quantity    float64 `gorm:"not null" json:"quantity"`
	Units       float64 `gorm:"not null" json:"unit"`
	Rate        float64 `gorm:"not null" json:"rate"`

	LeadTime  string  `gorm:"type:text" json:"lead_time"`
	HsnCode   string  `gorm:"type:text" json:"hsncode"`
	Gst       float64 `gorm:"not null" json:"gst"`
	TaxAmount float64 `gorm:"not null" json:"tax_amount"`
	LineTotal float64 `gorm:"not null" json:"line_total"`

	Product Product `gorm:"foreignKey:ProductID" json:"product"`
}
