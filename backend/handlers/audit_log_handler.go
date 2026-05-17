package handler

import (
	"strconv"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var auditLogDB *gorm.DB

func SetAuditLogDB(db *gorm.DB) {
	auditLogDB = db
}

// ListAuditLogs returns paginated audit records (newest first).
func ListAuditLogs(c *fiber.Ctx) error {
	if auditLogDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "audit log store not configured"})
	}

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 20
	}
	offset := (page - 1) * limit

	entityType := c.Query("entity_type")
	action := c.Query("action")

	q := auditLogDB.Model(&models.AuditLog{})
	if entityType != "" {
		q = q.Where("entity_type = ?", entityType)
	}
	if action != "" {
		q = q.Where("action = ?", action)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var rows []models.AuditLog
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  rows,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAuditLog returns a single audit row by ID.
func GetAuditLog(c *fiber.Ctx) error {
	if auditLogDB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "audit log store not configured"})
	}
	id64, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}
	var row models.AuditLog
	if err := auditLogDB.First(&row, uint(id64)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	return c.JSON(row)
}
