package initializers

import (
	"log"

	"erp.local/backend/models"
)

// EnsureAuditLogsTable creates audit_logs if missing (safe to call on every startup).
func EnsureAuditLogsTable() {
	if DB == nil {
		log.Println("EnsureAuditLogsTable: database not connected")
		return
	}
	if err := DB.AutoMigrate(&models.AuditLog{}); err != nil {
		log.Printf("EnsureAuditLogsTable: migration failed: %v", err)
		return
	}
	log.Println("EnsureAuditLogsTable: audit_logs table is ready")
}
