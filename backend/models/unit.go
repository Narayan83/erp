package models

type Unit struct {
	ID          uint      `gorm:"primaryKey"`
	Name        string    `gorm:"unique;not null" json:"name"`
	Code        string    `json:"code"`                       // e.g., kg
	Precision   int       `gorm:"default:0" json:"precision"` // e.g., 2 for 0.00
	Description string    `gorm:"type:text" json:"description"`
	Products    []Product `gorm:"foreignKey:UnitID"`
}
