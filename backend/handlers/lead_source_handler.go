package handler

import (
	"fmt"
	"strings"

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

func sanitizeLeadSourceCode(name string) string {
	upper := strings.ToUpper(strings.TrimSpace(name))
	if upper == "" {
		return "LS"
	}
	upper = strings.ReplaceAll(upper, " ", "_")
	upper = strings.ReplaceAll(upper, "-", "_")
	if len(upper) > 20 {
		upper = upper[:20]
	}
	return fmt.Sprintf("LS_%s", upper)
}

func nextLeadSourceCode(name string, excludeID uint) (string, error) {
	baseCode := sanitizeLeadSourceCode(name)
	if leadSourceDB == nil {
		return baseCode, fmt.Errorf("lead source database not initialized")
	}

	for attempt := 0; attempt < 1000; attempt++ {
		candidate := baseCode
		if attempt > 0 {
			candidate = fmt.Sprintf("%s_%d", baseCode, attempt+1)
		}

		var existing models.LeadSource
		err := leadSourceDB.Where("code = ?", candidate).First(&existing).Error
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

	return "", fmt.Errorf("unable to generate unique code for lead source %q", name)
}

func EnsureLeadSourceByName(name string) (*models.LeadSource, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, nil
	}
	if leadSourceDB == nil {
		return nil, fmt.Errorf("lead source database not initialized")
	}

	var existing models.LeadSource
	if err := leadSourceDB.Where("LOWER(name) = ?", strings.ToLower(trimmed)).First(&existing).Error; err == nil {
		if !existing.Active {
			existing.Active = true
			if saveErr := leadSourceDB.Save(&existing).Error; saveErr != nil {
				return nil, saveErr
			}
		}
		return &existing, nil
	} else if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	code, err := nextLeadSourceCode(trimmed, 0)
	if err != nil {
		return nil, err
	}

	newItem := models.LeadSource{
		Code:   code,
		Name:   trimmed,
		Active: true,
	}
	if err := leadSourceDB.Create(&newItem).Error; err != nil {
		var retryExisting models.LeadSource
		if findErr := leadSourceDB.Where("LOWER(name) = ?", strings.ToLower(trimmed)).First(&retryExisting).Error; findErr == nil {
			return &retryExisting, nil
		}
		return nil, err
	}
	return &newItem, nil
}

/* ========== HANDLERS ========== */

func CreateLeadSource(c *fiber.Ctx) error {
	var body CreateLeadSourceRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	name := strings.TrimSpace(body.Name)
	if name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	code := strings.TrimSpace(body.Code)
	if code == "" {
		generated, err := nextLeadSourceCode(name, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		code = generated
	}

	source := models.LeadSource{
		Code:        code,
		Name:        name,
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
