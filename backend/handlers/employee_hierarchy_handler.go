package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var empHierarchyDB *gorm.DB

func SetEmployeeHierarchyDB(db *gorm.DB) {
	empHierarchyDB = db
}

/* DTOs */

type CreateEmployeeHierarchyRequest struct {
	ManagerID    uint   `json:"manager_id"`
	EmployeeID   uint   `json:"employee_id"`
	RelationType string `json:"relation_type"`
}

type UpdateEmployeeHierarchyRequest struct {
	ManagerID    *uint   `json:"manager_id"`
	EmployeeID   *uint   `json:"employee_id"`
	RelationType *string `json:"relation_type"`
}

/* HANDLERS */

func CreateEmployeeHierarchy(c *fiber.Ctx) error {
	var body CreateEmployeeHierarchyRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	item := models.EmployeeHierarchy{
		ManagerID:    body.ManagerID,
		EmployeeID:   body.EmployeeID,
		RelationType: body.RelationType,
	}

	if err := empHierarchyDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	empHierarchyDB.Preload("Manager").Preload("Employee").First(&item, item.ID)

	return c.Status(201).JSON(item)
}

func GetEmployeeHierarchies(c *fiber.Ctx) error {
	var items []models.EmployeeHierarchy
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)

	offset := (page - 1) * limit

	query := empHierarchyDB.Model(&models.EmployeeHierarchy{})

	query.Count(&total)

	query.Offset(offset).Limit(limit).Order("id desc").
		Preload("Manager").
		Preload("Manager.User").
		Preload("Employee").
		Preload("Employee.User").
		Find(&items)

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetEmployeeHierarchy(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.EmployeeHierarchy

	if err := empHierarchyDB.
		Preload("Manager").
		Preload("Employee").
		First(&item, id).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Hierarchy entry not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateEmployeeHierarchy(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateEmployeeHierarchyRequest
	var item models.EmployeeHierarchy

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if err := empHierarchyDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.ManagerID != nil {
		item.ManagerID = *body.ManagerID
	}
	if body.EmployeeID != nil {
		item.EmployeeID = *body.EmployeeID
	}
	if body.RelationType != nil {
		item.RelationType = *body.RelationType
	}

	if err := empHierarchyDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	empHierarchyDB.Preload("Manager").Preload("Employee").First(&item, id)

	return c.JSON(item)
}

func DeleteEmployeeHierarchy(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.EmployeeHierarchy

	if err := empHierarchyDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := empHierarchyDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Hierarchy deleted successfully"})
}
