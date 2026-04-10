package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var sizeDB *gorm.DB

func SetSizeDB(db *gorm.DB) {
	sizeDB = db
}

// GET /sizes?page=1&limit=10&filter=large
func GetAllSizes(c *fiber.Ctx) error {
	var sizes []models.Size
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := sizeDB.Model(&models.Size{})
	if filter != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ? OR description ILIKE ?", "%"+filter+"%", "%"+filter+"%", "%"+filter+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count sizes"})
	}

	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&sizes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  sizes,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GET /sizes/:id
func GetSizeByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var size models.Size

	if err := sizeDB.First(&size, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Size not found"})
	}
	return c.JSON(size)
}

// POST /sizes
func CreateSize(c *fiber.Ctx) error {
	var size models.Size
	if err := c.BodyParser(&size); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// If frontend doesn't provide a Name, default it to Code so DB 'not null' and 'unique' constraints are satisfied
	if size.Name == "" {
		size.Name = size.Code
	}

	if err := sizeDB.Create(&size).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(size)
}

// PUT /sizes/:id
func UpdateSize(c *fiber.Ctx) error {
	id := c.Params("id")
	var size models.Size

	if err := sizeDB.First(&size, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Size not found"})
	}

	if err := c.BodyParser(&size); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Ensure Name remains non-empty; default to Code when missing
	if size.Name == "" {
		size.Name = size.Code
	}

	if err := sizeDB.Save(&size).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(size)
}

// DELETE /sizes/:id
func DeleteSize(c *fiber.Ctx) error {
	id := c.Params("id")

	// Ensure size exists
	var size models.Size
	if err := sizeDB.First(&size, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Size not found"})
	}

	// Check references in product variants (Size field stored as string)
	var pvCount int64
	if err := sizeDB.Model(&models.ProductVariant{}).Where("size = ? OR size = ?", size.Code, size.Name).Count(&pvCount).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if pvCount > 0 {
		msg := "Cannot delete Size: it is used"
		details := []string{}
		if pvCount > 0 {
			details = append(details, fmt.Sprintf("%d product variant(s)", pvCount))
		}
		if len(details) > 0 {
			msg = msg + " in " + strings.Join(details, " and ")
		}
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}

	if err := sizeDB.Delete(&models.Size{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

// GET /sizes-search?search=xl
func SearchSizes(c *fiber.Ctx) error {
	search := c.Query("search")
	var sizes []models.Size

	query := sizeDB.Model(&models.Size{})
	if search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Limit(20).Find(&sizes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": sizes})
}
