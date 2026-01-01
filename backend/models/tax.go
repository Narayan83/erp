package models

type Tax struct {
	ID         uint      `gorm:"primaryKey"`
	Name       string    `gorm:"not null;unique"`
	Percentage float64   `gorm:"not null"`
	Products   []Product `gorm:"foreignKey:TaxID"` // Optional if Product links to Tax
}
