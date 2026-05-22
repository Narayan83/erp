// One-off: create audit_logs table. Run from backend folder:
//
//	go run ./cmd/ensure_audit_logs
package main

import (
	"fmt"
	"os"

	"erp.local/backend/initializers"
	"erp.local/backend/models"
)

func main() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
	if err := initializers.DB.AutoMigrate(&models.AuditLog{}); err != nil {
		fmt.Fprintf(os.Stderr, "migration failed: %v\n", err)
		os.Exit(1)
	}
	var n int64
	initializers.DB.Model(&models.AuditLog{}).Count(&n)
	fmt.Printf("audit_logs table OK (rows: %d)\n", n)
}
