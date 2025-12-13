package models

import "time"

type PurchaseOrderStatus string

const (
	PODraft    PurchaseOrderStatus = "Draft"
	POApproved PurchaseOrderStatus = "Approved"
	POOrdered  PurchaseOrderStatus = "Ordered"
	POReceived PurchaseOrderStatus = "Received"
)

type PurchaseOrder struct {
	ID                   uint                `gorm:"primaryKey" json:"purchase_order_id"`
	PONumber             string              `gorm:"unique;not null" json:"po_number"`
	SupplierID           uint                `gorm:"not null" json:"supplier_id"` // FK to User table
	Supplier             User                `gorm:"foreignKey:SupplierID" json:"supplier"`
	PODate               time.Time           `gorm:"not null" json:"po_date"`
	ExpectedDeliveryDate *time.Time          `json:"expected_delivery_date,omitempty"`
	TotalAmount          float64             `gorm:"not null" json:"total_amount"`
	TaxAmount            float64             `gorm:"not null" json:"tax_amount"`
	Discount             *float64            `json:"discount,omitempty"`
	GrandTotal           float64             `gorm:"not null" json:"grand_total"`
	Status               PurchaseOrderStatus `gorm:"type:varchar(20);not null" json:"status"`
	CreatedBy            uint                `json:"created_by"` // FK to User (Admin who created)
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`

	Items []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID" json:"items"`
}
