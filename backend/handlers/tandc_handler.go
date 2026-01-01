package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var tandcDB *gorm.DB

// Set DB
func SetTandcDB(db *gorm.DB) {
	tandcDB = db
}

// Create TandC
func CreateTandc(c *fiber.Ctx) error {
	var tandc models.TandC
	if err := c.BodyParser(&tandc); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tandcDB.Create(&tandc).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(tandc)
}

// Get All TandCs with optional filter + pagination
func GetAllTandc(c *fiber.Ctx) error {
	var tandcs []models.TandC
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter", "")

	offset := (page - 1) * limit
	query := tandcDB.Model(&models.TandC{})

	if filter != "" {
		query = query.Where("tandc_name LIKE ? OR tandc_type LIKE ?", "%"+filter+"%", "%"+filter+"%")
	}

	if err := query.Offset(offset).Limit(limit).Find(&tandcs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  tandcs,
		"page":  page,
		"limit": limit,
	})
}

// Get One TandC by ID
func GetTandc(c *fiber.Ctx) error {
	id := c.Params("id")
	var tandc models.TandC
	if err := tandcDB.First(&tandc, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "T&C not found"})
	}
	return c.JSON(tandc)
}

// Update TandC
func UpdateTandc(c *fiber.Ctx) error {
	id := c.Params("id")
	var tandc models.TandC

	if err := tandcDB.First(&tandc, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "T&C not found"})
	}

	if err := c.BodyParser(&tandc); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := tandcDB.Save(&tandc).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(tandc)
}

// Delete TandC
func DeleteTandc(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := tandcDB.Delete(&models.TandC{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "T&C deleted successfully"})
}
