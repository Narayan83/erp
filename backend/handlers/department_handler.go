package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var departmentDB *gorm.DB

func SetDepartmentDB(db *gorm.DB) {
	departmentDB = db
}

/* ================= DTOs ================= */

type CreateDepartmentRequest struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type UpdateDepartmentRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

/* ================= HANDLERS ================= */

func CreateDepartment(c *fiber.Ctx) error {
	var body CreateDepartmentRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	dept := models.Department{
		Name:        body.Name,
		Description: body.Description,
	}

	if err := departmentDB.Create(&dept).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(dept)
}

func GetDepartments(c *fiber.Ctx) error {
	var items []models.Department
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := departmentDB.Model(&models.Department{})

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").Find(&items)

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	var dept models.Department

	if err := departmentDB.First(&dept, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Department not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dept)
}

func UpdateDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateDepartmentRequest
	var dept models.Department

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := departmentDB.First(&dept, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Department not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		dept.Name = *body.Name
	}
	if body.Description != nil {
		dept.Description = *body.Description
	}

	if err := departmentDB.Save(&dept).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dept)
}

func DeleteDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	var dept models.Department

	if err := departmentDB.First(&dept, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Department not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := departmentDB.Delete(&dept).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Department deleted successfully"})
}
