package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var storesDB *gorm.DB

func SetstoresDB(db *gorm.DB) {
	{
		storesDB = db
	}
}

func GetAllStore(c *fiber.Ctx) error {
	var items []models.Store
	var total int64

	// Get query parameters with defaults
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	// Build query
	query := storesDB.Model(&models.Store{})

	// Apply name filter if provided
	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Count total filtered records
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	// Fetch paginated filtered data
	if err := query.
		Order("id DESC").
		Limit(limit).
		Offset(offset).
		Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return result
	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetStoreByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Store
		if err := storesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateStore(c *fiber.Ctx) error {
	{
		var item models.Store
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := storesDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateStore(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Store
		if err := storesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := storesDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteStore(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := storesDB.Delete(&models.Store{}, id).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.SendStatus(204)
	}
}
