package models

type PurchaseOrderItem struct {
	ID               uint    `gorm:"primaryKey" json:"id"`
	PurchaseOrderID  uint    `gorm:"not null" json:"purchase_order_id"`  // FK to PurchaseOrder
	ProductID        uint    `gorm:"not null" json:"product_id"`         // FK to Product
	ProductVariantID uint    `gorm:"not null" json:"product_variant_id"` // FK to ProductVariant
	Description      string  `gorm:"type:text" json:"description"`
	Quantity         float64 `gorm:"not null" json:"quantity"`
	UnitPrice        float64 `gorm:"not null" json:"unit_price"`
	TaxPercent       float64 `gorm:"not null" json:"tax_percent"`
	TaxAmount        float64 `gorm:"not null" json:"tax_amount"`
	LineTotal        float64 `gorm:"not null" json:"line_total"`

	Product        Product        `gorm:"foreignKey:ProductID" json:"product"`
	ProductVariant ProductVariant `gorm:"foreignKey:ProductVariantID" json:"product_variant"`
}
