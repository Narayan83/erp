package models

import "time"

type ProductVariant struct {
	ID            uint `gorm:"primaryKey"`
	ProductID     uint `gorm:"index;not null"`
	Color         string
	Size          string
	SKU           string `gorm:"unique"`
	Barcode       string
	PurchaseCost  float64
	StdSalesPrice float64
	Stock         int
	LeadTime      int
	Images        StringArray `gorm:"type:json"`
	IsActive      bool        `gorm:"default:true"`
	CreatedAt     time.Time

	Product Product `gorm:"constraint:OnDelete:CASCADE"`
}
