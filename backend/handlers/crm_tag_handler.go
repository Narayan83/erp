package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var crmTagDB *gorm.DB

func SetCRMTagDB(db *gorm.DB) {
	crmTagDB = db
}

/* ========== DTOs ========== */

type CreateCRMTagRequest struct {
	Code   string `json:"code"`
	Title  string `json:"title"`
	Color  string `json:"color"`
	Active *bool  `json:"active"`
}

type UpdateCRMTagRequest struct {
	Code   *string `json:"code"`
	Title  *string `json:"title"`
	Color  *string `json:"color"`
	Active *bool   `json:"active"`
}

/* ========== HANDLERS ========== */

func CreateCRMTag(c *fiber.Ctx) error {
	var body CreateCRMTagRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Code == "" || body.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code and Title are required"})
	}

	tag := models.CRMTag{
		Code:   body.Code,
		Title:  body.Title,
		Color:  body.Color,
		Active: true,
	}

	if body.Active != nil {
		tag.Active = *body.Active
	}

	if err := crmTagDB.Create(&tag).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(tag)
}

func GetCRMTags(c *fiber.Ctx) error {
	var tags []models.CRMTag

	query := crmTagDB.Order("title asc")

	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}

	if err := query.Find(&tags).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tags)
}

func GetCRMTag(c *fiber.Ctx) error {
	id := c.Params("id")
	var tag models.CRMTag

	if err := crmTagDB.First(&tag, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "CRM Tag not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tag)
}

func UpdateCRMTag(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateCRMTagRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var tag models.CRMTag
	if err := crmTagDB.First(&tag, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "CRM Tag not found"})
	}

	if body.Code != nil {
		tag.Code = *body.Code
	}
	if body.Title != nil {
		tag.Title = *body.Title
	}
	if body.Color != nil {
		tag.Color = *body.Color
	}
	if body.Active != nil {
		tag.Active = *body.Active
	}

	if err := crmTagDB.Save(&tag).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(tag)
}

func DeleteCRMTag(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := crmTagDB.Delete(&models.CRMTag{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "CRM Tag deleted successfully"})
}
