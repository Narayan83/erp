package models

import (
	"encoding/json"
	"time"
)

type Integration struct {
	ID uint `gorm:"primaryKey" json:"id"`

	Name string `json:"name"` // Display name: Razorpay Prod, Gmail SMTP

	Type string `json:"type"`
	// payment | qr | email | sms | whatsapp | gst | accounting | lead_platform | digital_signature

	Provider string `json:"provider"`
	// razorpay | stripe | phonepe | cashfree | upi | gmail | outlook | indiamart | tradeindia | justdial | 99acres | custom

	Config json.RawMessage `gorm:"type:jsonb" json:"config"` // Stores key-value pairs or structured JSON configuration (e.g., API keys, SMTP settings)

	IsActive bool `json:"is_active"`

	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
