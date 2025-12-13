package models

type Tag struct {
	ID       uint      `gorm:"primaryKey"`
	Name     string    `gorm:"unique;not null"`
	Products []Product `gorm:"many2many:product_tags"`
}
