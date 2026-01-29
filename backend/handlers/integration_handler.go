package handler

import (
	"encoding/json"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var integrationDB *gorm.DB

func SetIntegrationDB(db *gorm.DB) {
	integrationDB = db
}

/* ================= REQUEST DTO ================= */

type CreateIntegrationRequest struct {
	Name     string      `json:"name"`
	Type     string      `json:"type"`
	Provider string      `json:"provider"`
	Config   interface{} `json:"config"`
	IsActive *bool       `json:"is_active"`
}

type UpdateIntegrationRequest struct {
	Name     *string     `json:"name"`
	Type     *string     `json:"type"`
	Provider *string     `json:"provider"`
	Config   interface{} `json:"config"`
	IsActive *bool       `json:"is_active"`
}

/* ================= HANDLERS ================= */

func CreateIntegration(c *fiber.Ctx) error {
	var body CreateIntegrationRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Name == "" || body.Type == "" || body.Provider == "" {
		return c.Status(400).JSON(fiber.Map{"error": "name, type, provider required"})
	}

	configBytes, err := json.Marshal(body.Config)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid config"})
	}

	active := true
	if body.IsActive != nil {
		active = *body.IsActive
	}

	integration := models.Integration{
		Name:     body.Name,
		Type:     body.Type,
		Provider: body.Provider,
		Config:   configBytes,
		IsActive: active,
	}

	if err := integrationDB.Create(&integration).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(integration)
}

func GetIntegrations(c *fiber.Ctx) error {
	var list []models.Integration

	query := integrationDB.Model(&models.Integration{})

	if t := c.Query("type"); t != "" {
		query = query.Where("type = ?", t)
	}
	if p := c.Query("provider"); p != "" {
		query = query.Where("provider = ?", p)
	}
	if a := c.Query("active"); a == "true" {
		query = query.Where("is_active = true")
	}

	query.Order("id desc").Find(&list)

	return c.JSON(list)
}

func GetIntegration(c *fiber.Ctx) error {
	id := c.Params("id")

	var integration models.Integration
	if err := integrationDB.First(&integration, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(integration)
}

func UpdateIntegration(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateIntegrationRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var integration models.Integration
	if err := integrationDB.First(&integration, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		integration.Name = *body.Name
	}
	if body.Type != nil {
		integration.Type = *body.Type
	}
	if body.Provider != nil {
		integration.Provider = *body.Provider
	}
	if body.Config != nil {
		configBytes, err := json.Marshal(body.Config)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid config"})
		}
		integration.Config = configBytes
	}
	if body.IsActive != nil {
		integration.IsActive = *body.IsActive
	}

	if err := integrationDB.Save(&integration).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(integration)
}

func DeleteIntegration(c *fiber.Ctx) error {
	id := c.Params("id")

	var integration models.Integration
	if err := integrationDB.First(&integration, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := integrationDB.Delete(&integration).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Integration deleted"})
}
