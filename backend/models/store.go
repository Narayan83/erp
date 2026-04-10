package models

type Store struct {
	ID       uint      `gorm:"primaryKey"`
	Name     string    `gorm:"unique;not null"`
	Products []Product `gorm:"foreignKey:StoreID"`
}
