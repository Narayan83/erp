package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadSourceDB *gorm.DB

func SetLeadSourceDB(db *gorm.DB) {
	leadSourceDB = db
}

/* ========== DTOs ========== */

type CreateLeadSourceRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      *bool  `json:"active"`
}

type UpdateLeadSourceRequest struct {
	Code        *string `json:"code"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Active      *bool   `json:"active"`
}

/* ========== HANDLERS ========== */

func CreateLeadSource(c *fiber.Ctx) error {
	var body CreateLeadSourceRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Code == "" || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code and Name are required"})
	}

	source := models.LeadSource{
		Code:        body.Code,
		Name:        body.Name,
		Description: body.Description,
		Active:      true,
	}

	if body.Active != nil {
		source.Active = *body.Active
	}

	if err := leadSourceDB.Create(&source).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(source)
}

func GetLeadSources(c *fiber.Ctx) error {
	var sources []models.LeadSource

	query := leadSourceDB.Order("name asc")

	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}

	if err := query.Find(&sources).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(sources)
}

func GetLeadSource(c *fiber.Ctx) error {
	id := c.Params("id")
	var source models.LeadSource

	if err := leadSourceDB.First(&source, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead source not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(source)
}

func UpdateLeadSource(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateLeadSourceRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var source models.LeadSource
	if err := leadSourceDB.First(&source, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead source not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Code != nil {
		source.Code = *body.Code
	}
	if body.Name != nil {
		source.Name = *body.Name
	}
	if body.Description != nil {
		source.Description = *body.Description
	}
	if body.Active != nil {
		source.Active = *body.Active
	}

	if err := leadSourceDB.Save(&source).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(source)
}

func DeleteLeadSource(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := leadSourceDB.Delete(&models.LeadSource{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Lead source deleted successfully"})
}
