package models

type Customer struct {
	ID           uint   `gorm:"primaryKey"`
	UserID       uint   `gorm:"not null;uniqueIndex" json:"user_id"`
	User         User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	CustomerCode string `json:"emp_code"`
}
