package models

type Supplier struct {
	ID           uint   `gorm:"primaryKey"`
	UserID       uint   `gorm:"not null;uniqueIndex" json:"user_id"`
	User         User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	SupplierCode string `json:"supllier_code,omitempty"`
}
