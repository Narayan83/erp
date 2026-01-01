package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var categoriesDB *gorm.DB

func SetcategoriesDB(db *gorm.DB) {
	{
		categoriesDB = db
	}
}

// func GetAllCategorie(c *fiber.Ctx) error {
// 	{
// 		var items []models.Category
// 		if err := categoriesDB.Find(&items).Error; err != nil {
// 			{
// 				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 			}
// 		}
// 		return c.JSON(items)
// 	}
// }

func GetAllCategorie(c *fiber.Ctx) error {
	var categories []models.Category
	var total int64

	// Get query params with defaults
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := categoriesDB.Model(&models.Category{})
	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Count total items
	if err := categoriesDB.Model(&models.Category{}).Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error counting categories"})
	}

	// Fetch paginated results
	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&categories).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return with meta info
	return c.JSON(fiber.Map{
		"data":  categories,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetCategorieByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Category
		if err := categoriesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateCategorie(c *fiber.Ctx) error {
	{
		var item models.Category
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := categoriesDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateCategorie(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Category
		if err := categoriesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := categoriesDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteCategorie(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := categoriesDB.Delete(&models.Category{}, id).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.SendStatus(204)
	}
}

func SearchCategories(c *fiber.Ctx) error {
	search := c.Query("search")
	var categories []models.Category

	query := categoriesDB.Model(&models.Category{})
	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	if err := query.Limit(20).Find(&categories).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": categories,
	})
}
