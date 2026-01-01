package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var hierarchicalUserDB *gorm.DB

// Set DB connection
func SetHierarchicalUserDB(db *gorm.DB) {
	hierarchicalUserDB = db
}

// Get all hierarchical users
func GetAllHierarchicalUsers(c *fiber.Ctx) error {
	var users []models.HierarchicalUser
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	offset := (page - 1) * limit

	query := hierarchicalUserDB.Preload("User").Preload("Parent").Preload("Sub")

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := query.Limit(limit).Offset(offset).Order("id DESC").Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// Get hierarchical user by ID
func GetHierarchicalUserByID(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.HierarchicalUser
	if err := hierarchicalUserDB.Preload("User").Preload("Parent").Preload("Sub").First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Hierarchical user not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(user)
}

// Create hierarchical user
func CreateHierarchicalUser(c *fiber.Ctx) error {
	var data models.HierarchicalUser

	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request", "details": err.Error()})
	}

	if data.UserID == 0 || data.UserType == "" {
		return c.Status(400).JSON(fiber.Map{"error": "UserID and UserType are required"})
	}

	if err := hierarchicalUserDB.Create(&data).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create", "details": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Hierarchical user created successfully",
		"data":    data,
	})
}

// Update hierarchical user
func UpdateHierarchicalUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var existing models.HierarchicalUser

	if err := hierarchicalUserDB.First(&existing, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Record not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var data models.HierarchicalUser
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request", "details": err.Error()})
	}

	data.ID = existing.ID
	if err := hierarchicalUserDB.Save(&data).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update", "details": err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "Hierarchical user updated successfully",
		"data":    data,
	})
}

// Delete hierarchical user
func DeleteHierarchicalUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := hierarchicalUserDB.Delete(&models.HierarchicalUser{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(204)
}
