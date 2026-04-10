package models

type Distributor struct {
	ID              uint   `gorm:"primaryKey"`
	UserID          uint   `gorm:"not null;uniqueIndex" json:"user_id"`
	User            User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	DistributorCode string `json:"distributor_code"`
}
