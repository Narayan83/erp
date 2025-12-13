package handler

import (
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadsDB *gorm.DB

func SetLeadsDB(db *gorm.DB) {
	leadsDB = db
}

// 📌 Create Lead
func CreateLead(c *fiber.Ctx) error {
	var lead models.Lead

	// Read raw body and clean up empty time fields which would fail
	// to unmarshal into time.Time (empty string causes parse errors).
	raw := c.Body()
	if len(raw) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Empty request body"})
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		// Fallback to BodyParser for non-JSON or unexpected formats
		if err2 := c.BodyParser(&lead); err2 != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}
	} else {
		// Remove keys that map to time.Time fields when they are empty strings
		timeKeys := []string{"since", "lastTalk", "nextTalk", "transferredOn", "createdAt", "updatedAt", "created_at", "updated_at", "last_talk", "next_talk", "transferred_on"}
		for _, k := range timeKeys {
			if v, ok := payload[k]; ok {
				if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) == "" {
					delete(payload, k)
				}
			}
		}

		cleaned, _ := json.Marshal(payload)
		if err := json.Unmarshal(cleaned, &lead); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "detail": err.Error()})
		}
	}

	if err := leadsDB.Create(&lead).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Reload the created lead with associations so the response includes related objects
	if err := leadsDB.Preload("AssignedTo").Preload("Product").First(&lead, lead.ID).Error; err != nil {
		// If reload fails, still return the created lead but include an error detail for debugging
		return c.Status(201).JSON(fiber.Map{"lead": lead, "warning": "created but failed to preload associations", "detail": err.Error()})
	}

	return c.JSON(lead)
}

// 📌 Get All Leads with Pagination & Filtering
func GetAllLeads(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := leadsDB.Preload("AssignedTo").Preload("Product")

	if contact := c.Query("contact"); contact != "" {
		query = query.Where("contact ILIKE ?", "%"+contact+"%")
	}
	if stage := c.Query("stage"); stage != "" {
		query = query.Where("stage = ?", stage)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}

	var total int64
	if err := query.Model(&models.Lead{}).Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var leads []models.Lead
	if err := query.Offset(offset).Limit(limit).Find(&leads).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":       leads,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// 📌 Get Single Lead by ID
func GetLeadByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var lead models.Lead
	if err := leadsDB.Preload("AssignedTo").Preload("Product").First(&lead, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
	}
	return c.JSON(lead)
}

// 📌 Update Lead
func UpdateLead(c *fiber.Ctx) error {
	id := c.Params("id")

	var req models.Lead

	// Read raw body and clean up empty time fields (same logic as CreateLead)
	raw := c.Body()
	if len(raw) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Empty request body"})
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		// Fallback to BodyParser for non-JSON or unexpected formats
		if err2 := c.BodyParser(&req); err2 != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}
	} else {
		// Remove empty string keys that map to time.Time fields to avoid parse errors
		timeKeys := []string{"since", "lastTalk", "nextTalk", "transferredOn", "createdAt", "updatedAt", "created_at", "updated_at", "last_talk", "next_talk", "transferred_on"}
		for _, k := range timeKeys {
			if v, ok := payload[k]; ok {
				if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) == "" {
					delete(payload, k)
				}
			}
		}

		cleaned, _ := json.Marshal(payload)
		if err := json.Unmarshal(cleaned, &req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "detail": err.Error()})
		}
	}

	var lead models.Lead
	if err := leadsDB.First(&lead, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
	}

	req.UpdatedAt = time.Now()

	// Validate foreign keys before attempting DB update to return friendlier errors
	if req.AssignedToID != nil {
		var user models.User
		if err := leadsDB.First(&user, *req.AssignedToID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid assigned_to_id", "detail": "user not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate assignee", "detail": err.Error()})
		}
	}
	if req.ProductID != nil {
		var prod models.Product
		if err := leadsDB.First(&prod, *req.ProductID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid product_id", "detail": "product not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate product", "detail": err.Error()})
		}
	}

	if err := leadsDB.Model(&lead).Updates(req).Error; err != nil {
		// Return DB error for easier debugging
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update lead", "detail": err.Error()})
	}

	// Reload lead with associations for returning updated object
	if err := leadsDB.Preload("AssignedTo").Preload("Product").First(&lead, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch updated lead", "detail": err.Error()})
	}

	return c.JSON(lead)
}

// 📌 Delete Lead
func DeleteLead(c *fiber.Ctx) error {
	idParam := c.Params("id")
	// Ensure id is numeric (prevent trying to delete imported/local leads from DB)
	parsed, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lead id"})
	}

	if err := leadsDB.Delete(&models.Lead{}, uint(parsed)).Error; err != nil {
		// return actual DB error for easier debugging on client
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Lead deleted successfully"})
}
