package models

type Dealer struct {
	ID         uint   `gorm:"primaryKey"`
	UserID     uint   `gorm:"not null;uniqueIndex" json:"user_id"`
	User       User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	DealerCode string `json:"dealer_code"`
}
