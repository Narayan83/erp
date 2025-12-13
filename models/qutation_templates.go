package models

import (
	"time"
)

type QutationTemplates struct {
	ID                   uint           `gorm:"primaryKey"`
	QutationTemplateName string         `gorm:"unique;not null"`
	TemplateQuotationID  uint           `gorm:"not null" json:"template_quotation_id"`
	QuotationTable       QuotationTable `gorm:"foreignKey:TemplateQuotationID" json:"qutation_table"`
	TemplateStatus       string         `gorm:"type:text" json:"template_status,omitempty"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
}
