package handler

import (
	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var tagsDB *gorm.DB

func SettagsDB(db *gorm.DB) {
	{
		tagsDB = db
	}
}

// func GetAllTag(c *fiber.Ctx) error {
// 	{
// 		var items []models.Tag
// 		if err := tagsDB.Find(&items).Error; err != nil {
// 			{
// 				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 			}
// 		}
// 		return c.JSON(items)
// 	}
// }

func GetAllTag(c *fiber.Ctx) error {

	var tags []models.Tag
	var total int64

	// Get query params with defaults
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := tagsDB.Model(&models.Tag{})
	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Count total items
	if err := tagsDB.Model(&models.Tag{}).Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error counting Tags"})
	}

	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&tags).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return with meta info
	return c.JSON(fiber.Map{
		"data":  tags,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
func GetTagByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Tag
		if err := tagsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateTag(c *fiber.Ctx) error {
	{
		var item models.Tag
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := tagsDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateTag(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Tag
		if err := tagsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := tagsDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteTag(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := tagsDB.Delete(&models.Tag{}, id).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.SendStatus(204)
	}
}
