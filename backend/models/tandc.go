package models

type TandC struct {
	ID        uint   `gorm:"primaryKey"`
	TandcName string `gorm:"not null;unique"`
	TandcType string `gorm:"not null"`
}
