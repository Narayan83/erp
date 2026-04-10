package models

type Size struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"not null;unique" json:"name"`
	Code        string `gorm:"not null;unique" json:"code"` // Optional: like "M", "L", "XL"
	Description string `gorm:"not null" json:"description"` // Optional: like "M", "L", "XL"
}
