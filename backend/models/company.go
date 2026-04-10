package models

type Company struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Code string `gorm:"size:100;unique" json:"code"`
	Name string `gorm:"not null" json:"name"`
}
