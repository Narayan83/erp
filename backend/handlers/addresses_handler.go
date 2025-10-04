package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var addressesDB *gorm.DB

// Inject DB
func SetAddressesDB(db *gorm.DB) {
	addressesDB = db
}

// Get all addresses with pagination & filter
func GetAllAddresses(c *fiber.Ctx) error {
	var addresses []models.Addresses
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := addressesDB.Model(&models.Addresses{})
	if filter != "" {
		query = query.Where("address_title ILIKE ?", "%"+filter+"%")
	}

	// Count with filter
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error counting addresses"})
	}

	// Fetch results
	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&addresses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  addresses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// Get one by ID
func GetAddressByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var addr models.Addresses
	if err := addressesDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(addr)
}

// Create new address
func CreateAddress(c *fiber.Ctx) error {
	var addr models.Addresses
	if err := c.BodyParser(&addr); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := addressesDB.Create(&addr).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(addr)
}

// Update existing address
func UpdateAddress(c *fiber.Ctx) error {
	id := c.Params("id")
	var addr models.Addresses
	if err := addressesDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}

	if err := c.BodyParser(&addr); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if err := addressesDB.Save(&addr).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(addr)
}

// Delete address
func DeleteAddress(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := addressesDB.Delete(&models.Addresses{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

// Search addresses (autocomplete style)
func SearchAddresses(c *fiber.Ctx) error {
	search := c.Query("search")
	var addresses []models.Addresses

	query := addressesDB.Model(&models.Addresses{})
	if search != "" {
		query = query.Where("address_title ILIKE ? OR city ILIKE ? OR state ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Limit(20).Find(&addresses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": addresses,
	})
}
