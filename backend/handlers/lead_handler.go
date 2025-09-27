package handler

import (
	"strconv"
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
	if err := c.BodyParser(&lead); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if err := leadsDB.Create(&lead).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
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
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	var lead models.Lead
	if err := leadsDB.First(&lead, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
	}

	req.UpdatedAt = time.Now()

	if err := leadsDB.Model(&lead).Updates(req).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update lead"})
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
