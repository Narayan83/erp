package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var unitsDB *gorm.DB

func SetunitsDB(db *gorm.DB) {
	{
		unitsDB = db
	}
}

func GetAllUnit(c *fiber.Ctx) error {
	var items []models.Unit
	var total int64

	// Read query parameters
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	// Build query
	query := unitsDB.Model(&models.Unit{})

	// Apply filter if present
	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Count total for pagination
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Fetch paginated records
	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return paginated response
	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetUnitByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Unit
		if err := unitsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateUnit(c *fiber.Ctx) error {
	{
		var item models.Unit
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := unitsDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateUnit(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Unit
		if err := unitsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := unitsDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteUnit(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if id == "" || id == "undefined" {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid ID: empty or undefined"})
		}

		// First check if the unit exists
		var unit models.Unit
		if err := unitsDB.First(&unit, id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Unit not found"})
		}

		// Find products using this unit and set their unit_id to NULL
		if err := unitsDB.Model(&models.Product{}).Where("unit_id = ?", id).Update("unit_id", nil).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update products: " + err.Error()})
		}

		// Now, delete the unit
		if err := unitsDB.Delete(&unit).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete unit: " + err.Error()})
		}

		return c.SendStatus(204)
	}
}
