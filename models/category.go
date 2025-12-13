package models

type Category struct {
	ID            uint          `gorm:"primaryKey"`
	Name          string        `gorm:"unique;not null"`
	Subcategories []Subcategory `json:"subcategories,omitempty" gorm:"foreignKey:CategoryID"`
	Products      []Product     `json:"products,omitempty" gorm:"foreignKey:CategoryID"`
}
