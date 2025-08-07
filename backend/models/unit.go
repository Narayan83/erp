package models

type Unit struct {
	ID        uint      `gorm:"primaryKey"`
	Name      string    `gorm:"unique;not null"`
	Code      string    `json:"code"`                       // e.g., kg
	Precision int       `gorm:"default:0" json:"precision"` // e.g., 2 for 0.00
	Products  []Product `gorm:"foreignKey:UnitID"`
}
