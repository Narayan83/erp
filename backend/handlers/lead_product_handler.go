package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadProductDB *gorm.DB

func SetLeadProductDB(db *gorm.DB) {
	leadProductDB = db
}

type CreateLeadProductRequest struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Active *bool  `json:"active"`
}

type UpdateLeadProductRequest struct {
	Code   *string `json:"code"`
	Name   *string `json:"name"`
	Active *bool   `json:"active"`
}

func sanitizeLeadProductCode(name string) string {
	upper := strings.ToUpper(strings.TrimSpace(name))
	if upper == "" {
		return "LP"
	}
	upper = strings.ReplaceAll(upper, " ", "_")
	upper = strings.ReplaceAll(upper, "-", "_")
	if len(upper) > 20 {
		upper = upper[:20]
	}
	return fmt.Sprintf("LP_%s", upper)
}

func nextLeadProductCode(name string, excludeID uint) (string, error) {
	baseCode := sanitizeLeadProductCode(name)
	if leadProductDB == nil {
		return baseCode, fmt.Errorf("lead product database not initialized")
	}

	for attempt := 0; attempt < 1000; attempt++ {
		candidate := baseCode
		if attempt > 0 {
			candidate = fmt.Sprintf("%s_%d", baseCode, attempt+1)
		}

		var existing models.LeadProduct
		err := leadProductDB.Where("code = ?", candidate).First(&existing).Error
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

	return "", fmt.Errorf("unable to generate unique code for lead product %q", name)
}

func EnsureLeadProductByName(name string) (*models.LeadProduct, error) {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return nil, nil
	}
	if leadProductDB == nil {
		return nil, fmt.Errorf("lead product database not initialized")
	}

	var existing models.LeadProduct
	if err := leadProductDB.Where("LOWER(name) = ?", strings.ToLower(trimmed)).First(&existing).Error; err == nil {
		if !existing.Active {
			existing.Active = true
			if saveErr := leadProductDB.Save(&existing).Error; saveErr != nil {
				return nil, saveErr
			}
		}
		return &existing, nil
	} else if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	code, err := nextLeadProductCode(trimmed, 0)
	if err != nil {
		return nil, err
	}

	newItem := models.LeadProduct{
		Code:   code,
		Name:   trimmed,
		Active: true,
	}
	if err := leadProductDB.Create(&newItem).Error; err != nil {
		var retryExisting models.LeadProduct
		if findErr := leadProductDB.Where("LOWER(name) = ?", strings.ToLower(trimmed)).First(&retryExisting).Error; findErr == nil {
			return &retryExisting, nil
		}
		return nil, err
	}
	return &newItem, nil
}

func CreateLeadProduct(c *fiber.Ctx) error {
	var body CreateLeadProductRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	name := strings.TrimSpace(body.Name)
	if name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	code := strings.TrimSpace(body.Code)
	if code == "" {
		generated, err := nextLeadProductCode(name, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		code = generated
	}

	item := models.LeadProduct{
		Code:   code,
		Name:   name,
		Active: true,
	}
	if body.Active != nil {
		item.Active = *body.Active
	}

	if err := leadProductDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(item)
}

func GetLeadProducts(c *fiber.Ctx) error {
	var items []models.LeadProduct
	query := leadProductDB.Order("name asc")
	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}
	if err := query.Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(items)
}

func GetLeadProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.LeadProduct
	if err := leadProductDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead product not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(item)
}

func UpdateLeadProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateLeadProductRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var item models.LeadProduct
	if err := leadProductDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead product not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		trimmed := strings.TrimSpace(*body.Name)
		if trimmed == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Name cannot be empty"})
		}
		item.Name = trimmed
		if body.Code == nil && strings.TrimSpace(item.Code) == "" {
			code, err := nextLeadProductCode(trimmed, item.ID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
			item.Code = code
		}
	}
	if body.Code != nil {
		item.Code = strings.TrimSpace(*body.Code)
		if item.Code == "" {
			code, err := nextLeadProductCode(item.Name, item.ID)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
			item.Code = code
		}
	}
	if body.Active != nil {
		item.Active = *body.Active
	}

	if err := leadProductDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func DeleteLeadProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := leadProductDB.Delete(&models.LeadProduct{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Lead product deleted successfully"})
}
