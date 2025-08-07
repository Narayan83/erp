package models

import "time"

type Product struct {
	ID            uint   `gorm:"primaryKey"`
	Name          string `gorm:"not null"`
	Code          string `gorm:"unique;not null"`
	CategoryID    *uint
	SubcategoryID *uint
	UnitID        *uint
	StoreID       *uint
	TaxID         *uint // If Tax is being used
	TagID         *uint // If Tax is being used

	Importance    string `gorm:"type:text;default:Normal"`
	HsnSacCode    string
	ProductMode   string
	GstPercent    float64
	Description   string
	InternalNotes string
	StdCode       string
	MinimumStock  int
	CreatedAt     time.Time
	UpdatedAt     time.Time

	ProductType string
	IsActive    bool `gorm:"default:true"`

	Category    Category    `gorm:"constraint:OnDelete:SET NULL"`
	Subcategory Subcategory `gorm:"constraint:OnDelete:SET NULL"`
	Unit        Unit        `gorm:"constraint:OnDelete:SET NULL"`
	Store       Store       `gorm:"constraint:OnDelete:SET NULL"`
	Tax         Tax         `gorm:"constraint:OnDelete:SET NULL"`

	Variants []ProductVariant `gorm:"foreignKey:ProductID"`
	Tags     []Tag            `gorm:"many2many:product_tags"`
}
