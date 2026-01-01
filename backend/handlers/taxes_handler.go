package handler

import (
	"fmt"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var taxesDB *gorm.DB

func SettaxesDB(db *gorm.DB) {
	{
		taxesDB = db
	}
}

func GetAllTaxes(c *fiber.Ctx) error {
	var taxes []models.Tax
	var total int64

	// Pagination params
	page := c.QueryInt("page", 1)    // default: page 1
	limit := c.QueryInt("limit", 10) // default: 10 items
	filter := c.Query("filter", "")  // optional filter by name
	offset := (page - 1) * limit

	query := taxesDB.Model(&models.Tax{})

	if filter != "" {
		query = query.Where("name ILIKE ?", "%"+filter+"%")
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	// Apply pagination and fetch records
	if err := query.Offset(offset).Limit(limit).Find(&taxes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  taxes,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetTaxByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Tax
		if err := taxesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateTax(c *fiber.Ctx) error {
	{
		var item models.Tax
		body := c.Body()
		fmt.Println("Incoming JSON:", string(body))
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := taxesDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateTax(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.Tax
		if err := taxesDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := taxesDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func DeleteTax(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := taxesDB.Delete(&models.Tax{}, id).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.SendStatus(204)
	}
}
