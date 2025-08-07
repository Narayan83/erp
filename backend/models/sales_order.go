package models

import "time"

type SalesOrderStatus string

const (
	SODraft     SalesOrderStatus = "Draft"
	SOConfirmed SalesOrderStatus = "Confirmed"
	SOShipped   SalesOrderStatus = "Shipped"
	SOCancelled SalesOrderStatus = "Cancelled"
)

type SalesOrder struct {
	ID                   uint             `gorm:"primaryKey" json:"sales_order_id"`
	OrderNumber          string           `gorm:"unique;not null" json:"order_number"`
	CustomerID           uint             `gorm:"not null" json:"customer_id"` // FK to User
	Customer             User             `gorm:"foreignKey:CustomerID" json:"customer"`
	OrderDate            time.Time        `gorm:"not null" json:"order_date"`
	ExpectedDeliveryDate *time.Time       `json:"expected_delivery_date,omitempty"`
	TotalAmount          float64          `gorm:"not null" json:"total_amount"`
	Discount             *float64         `json:"discount,omitempty"`
	TaxAmount            float64          `gorm:"not null" json:"tax_amount"`
	GrandTotal           float64          `gorm:"not null" json:"grand_total"`
	Status               SalesOrderStatus `gorm:"type:varchar(20);not null" json:"status"`
	CreatedBy            uint             `json:"created_by"` // FK to User who created it
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`

	// Items []SalesOrderItem `gorm:"foreignKey:SalesOrderID;constraint:OnDelete:CASCADE" json:"items"`
}
