package models

type UserDocument struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	UserID    uint   `json:"user_id"`
	DocType   string `json:"doc_type"`
	DocNumber string `json:"doc_number,omitempty"`
	FileURL   string `json:"file_url"`
}
