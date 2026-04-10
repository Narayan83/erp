package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var serviceItemDB *gorm.DB

func SetServiceItemDB(db *gorm.DB) {
	serviceItemDB = db
}

/* ========= DTOs ========= */

type CreateServiceItemRequest struct {
	ItemName    string  `json:"item_name"`
	Description string  `json:"description"`
	Rate        float64 `json:"rate"`
	Unit        string  `json:"unit"`
	Nos         int     `json:"nos"`
	HSNSAC      string  `json:"hsn_sac"`
	GST         float64 `json:"gst"`
	Active      *bool   `json:"active"`
}

type UpdateServiceItemRequest struct {
	ItemName    *string  `json:"item_name"`
	Description *string  `json:"description"`
	Rate        *float64 `json:"rate"`
	Unit        *string  `json:"unit"`
	Nos         *int     `json:"nos"`
	HSNSAC      *string  `json:"hsn_sac"`
	GST         *float64 `json:"gst"`
	Active      *bool    `json:"active"`
}

/* ========= HANDLERS ========= */

func CreateServiceItem(c *fiber.Ctx) error {
	var body CreateServiceItemRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.ItemName == "" || body.Rate <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Item Name and Rate are required"})
	}

	item := models.ServiceItem{
		ItemName:    body.ItemName,
		Description: body.Description,
		Rate:        body.Rate,
		Unit:        body.Unit,
		Nos:         body.Nos,
		HSNSAC:      body.HSNSAC,
		GST:         body.GST,
		Active:      true,
	}

	if body.Active != nil {
		item.Active = *body.Active
	}

	if err := serviceItemDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(item)
}

func GetServiceItems(c *fiber.Ctx) error {
	var items []models.ServiceItem

	query := serviceItemDB.Order("item_name asc")

	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}

	if err := query.Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(items)
}

func GetServiceItem(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.ServiceItem

	if err := serviceItemDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Service item not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateServiceItem(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateServiceItemRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var item models.ServiceItem
	if err := serviceItemDB.First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Service item not found"})
	}

	if body.ItemName != nil {
		item.ItemName = *body.ItemName
	}
	if body.Description != nil {
		item.Description = *body.Description
	}
	if body.Rate != nil {
		item.Rate = *body.Rate
	}
	if body.Unit != nil {
		item.Unit = *body.Unit
	}
	if body.Nos != nil {
		item.Nos = *body.Nos
	}
	if body.HSNSAC != nil {
		item.HSNSAC = *body.HSNSAC
	}
	if body.GST != nil {
		item.GST = *body.GST
	}
	if body.Active != nil {
		item.Active = *body.Active
	}

	if err := serviceItemDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func DeleteServiceItem(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := serviceItemDB.Delete(&models.ServiceItem{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Service item deleted successfully"})
}
