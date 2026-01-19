package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var designationDB *gorm.DB

func SetDesignationDB(db *gorm.DB) {
	designationDB = db
}

/* ================= DTOs ================= */

type CreateDesignationRequest struct {
	Name  string `json:"name"`
	Level *uint  `json:"level,omitempty"`
}

type UpdateDesignationRequest struct {
	Name  *string `json:"name"`
	Level *uint   `json:"level"`
}

/* ================= HANDLERS ================= */

func CreateDesignation(c *fiber.Ctx) error {
	var body CreateDesignationRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	if body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	item := models.Designation{
		Name:  body.Name,
		Level: body.Level,
	}

	if err := designationDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(item)
}

func GetDesignations(c *fiber.Ctx) error {
	var items []models.Designation
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")

	if page < 1 {
		page = 1
	}

	offset := (page - 1) * limit
	query := designationDB.Model(&models.Designation{})

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").Find(&items)

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetDesignation(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Designation

	if err := designationDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Designation not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateDesignation(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateDesignationRequest
	var item models.Designation

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	if err := designationDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Designation not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		item.Name = *body.Name
	}
	if body.Level != nil {
		item.Level = body.Level
	}

	if err := designationDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func DeleteDesignation(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Designation

	if err := designationDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Designation not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := designationDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Designation deleted successfully"})
}
