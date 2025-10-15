package models

type Subcategory struct {
	ID uint `gorm:"primaryKey"`
	// Composite unique index on (lower(name), category_id) can't be expressed directly via GORM tags
	// but we can add a regular unique index (case-sensitive) and also perform case-insensitive checks in handlers.
	Name       string    `gorm:"not null;uniqueIndex:idx_name_category"`
	CategoryID uint      `gorm:"not null;uniqueIndex:idx_name_category"`
	Category   Category  `gorm:"foreignKey:CategoryID;references:ID;constraint:OnDelete:CASCADE"`
	Products   []Product `json:"products,omitempty" gorm:"foreignKey:SubcategoryID"`
}
