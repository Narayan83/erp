package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var subcategoriesDB *gorm.DB

func SetsubcategoriesDB(db *gorm.DB) {
	{
		subcategoriesDB = db
	}
}

func GetAllSubcategorie(c *fiber.Ctx) error {
	var subcategories []models.Subcategory

	// Query params
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	categoryID := c.Query("category_id")

	// Offset calculation
	offset := (page - 1) * limit

	// DB instance

	// Query builder
	query := subcategoriesDB.Model(&models.Subcategory{})

	// Optional search filter
	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Optional category filter
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	// Count total for pagination info
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Fetch data with pagination
	if err := query.Preload("Category").Offset(offset).Limit(limit).Find(&subcategories).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return paginated result
	return c.JSON(fiber.Map{
		"data":       subcategories,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

func GetSubcategorieByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Subcategory
		if err := subcategoriesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateSubcategorie(c *fiber.Ctx) error {
	{
		var item models.Subcategory
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		// Server-side duplicate check: ensure no other subcategory with same name (case-insensitive) exists for the category
		var existing models.Subcategory
		if err := subcategoriesDB.Where("LOWER(name) = LOWER(?) AND category_id = ?", item.Name, item.CategoryID).First(&existing).Error; err == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Subcategory with this name already exists for the selected category"})
		}

		if err := subcategoriesDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateSubcategorie(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Subcategory
		if err := subcategoriesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}

		// Server-side duplicate check: ensure no other subcategory (excluding this one) has same name (case-insensitive) for the category
		var existing models.Subcategory
		if err := subcategoriesDB.Where("LOWER(name) = LOWER(?) AND category_id = ? AND id <> ?", item.Name, item.CategoryID, item.ID).First(&existing).Error; err == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Another subcategory with this name already exists for the selected category"})
		}

		if err := subcategoriesDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteSubcategorie(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := subcategoriesDB.Delete(&models.Subcategory{}, id).Error; err != nil {
			// Check if it's a foreign key constraint violation
			if strings.Contains(err.Error(), "23503") || strings.Contains(strings.ToLower(err.Error()), "foreign key") {
				// Count how many products reference this subcategory
				var count int64
				subcategoriesDB.Model(&models.Product{}).Where("subcategory_id = ?", id).Count(&count)
				return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Cannot delete Subcategory: it is used in %d product(s)", count)})
			}
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(204)
	}
}
