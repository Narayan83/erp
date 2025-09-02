package models

type Employee struct {
	ID       uint   `gorm:"primaryKey"`
	UserID   uint   `gorm:"not null;uniqueIndex" json:"user_id"`
	User     User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	EmpCode  string `json:"emp_code"`
	Position string `json:"position"`
}
