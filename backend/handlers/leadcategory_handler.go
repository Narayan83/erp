package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadCategoryDB *gorm.DB

func SetLeadCategoryDB(db *gorm.DB) {
	leadCategoryDB = db
}

type CreateLeadCategoryRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      *bool  `json:"active"`
}

type UpdateLeadCategoryRequest struct {
	Code        *string `json:"code"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Active      *bool   `json:"active"`
}

func sanitizeLeadCategoryCode(name string) string {
	upper := strings.ToUpper(strings.TrimSpace(name))
	if upper == "" {
		return "LC"
	}
	upper = strings.ReplaceAll(upper, " ", "_")
	upper = strings.ReplaceAll(upper, "-", "_")
	if len(upper) > 20 {
		upper = upper[:20]
	}
	return fmt.Sprintf("LC_%s", upper)
}

func nextLeadCategoryCode(name string, excludeID uint) (string, error) {
	baseCode := sanitizeLeadCategoryCode(name)
	if leadCategoryDB == nil {
		return baseCode, fmt.Errorf("lead category database not initialized")
	}

	for attempt := 0; attempt < 1000; attempt++ {
		candidate := baseCode
		if attempt > 0 {
			candidate = fmt.Sprintf("%s_%d", baseCode, attempt+1)
		}

		var existing models.LeadCategory
		err := leadCategoryDB.Where("code = ?", candidate).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			return candidate, nil
		}
		if err != nil {
			return "", err
		}
		if excludeID != 0 && existing.ID == excludeID {
			return candidate, nil
		}
	}

	return "", fmt.Errorf("unable to generate unique code for lead category %q", name)
}

func CreateLeadCategory(c *fiber.Ctx) error {
	var body CreateLeadCategoryRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	name := strings.TrimSpace(body.Name)
	if name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	code := strings.TrimSpace(body.Code)
	if code == "" {
		generated, err := nextLeadCategoryCode(name, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		code = generated
	}

	item := models.LeadCategory{
		Code:        code,
		Name:        name,
		Description: strings.TrimSpace(body.Description),
		Active:      true,
	}

	if body.Active != nil {
		item.Active = *body.Active
	}

	if err := leadCategoryDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(item)
}

func GetLeadCategories(c *fiber.Ctx) error {
	var items []models.LeadCategory

	query := leadCategoryDB.Order("name asc")
	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}

	if err := query.Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(items)
}

func GetLeadCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.LeadCategory

	if err := leadCategoryDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead category not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateLeadCategory(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateLeadCategoryRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var item models.LeadCategory
	if err := leadCategoryDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead category not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		item.Name = strings.TrimSpace(*body.Name)
	}
	if body.Code != nil {
		item.Code = strings.TrimSpace(*body.Code)
	}
	if body.Description != nil {
		item.Description = strings.TrimSpace(*body.Description)
	}
	if body.Active != nil {
		item.Active = *body.Active
	}

	if item.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}
	if item.Code == "" {
		generated, err := nextLeadCategoryCode(item.Name, item.ID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		item.Code = generated
	}

	if err := leadCategoryDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func DeleteLeadCategory(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := leadCategoryDB.Delete(&models.LeadCategory{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Lead category deleted successfully"})
}
