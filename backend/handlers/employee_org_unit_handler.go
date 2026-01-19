package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var empOrgUnitDB *gorm.DB

func SetEmployeeOrgUnitDB(db *gorm.DB) {
	empOrgUnitDB = db
}

/* DTO */

type CreateEmployeeOrgUnitRequest struct {
	EmployeeID uint `json:"employee_id"`
	UnitID     uint `json:"unit_id"`
}

type UpdateEmployeeOrgUnitRequest struct {
	EmployeeID *uint `json:"employee_id"`
	UnitID     *uint `json:"unit_id"`
}

/* HANDLERS */

func CreateEmployeeOrgUnit(c *fiber.Ctx) error {
	var body CreateEmployeeOrgUnitRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	item := models.EmployeeOrganizationUnit{
		EmployeeID: body.EmployeeID,
		UnitID:     body.UnitID,
	}

	if err := empOrgUnitDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	empOrgUnitDB.Preload("Employee").Preload("Unit").First(&item, item.ID)

	return c.Status(201).JSON(item)
}

func GetEmployeeOrgUnits(c *fiber.Ctx) error {
	var items []models.EmployeeOrganizationUnit
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)

	offset := (page - 1) * limit

	query := empOrgUnitDB.Model(&models.EmployeeOrganizationUnit{})

	query.Count(&total)

	query.Offset(offset).Limit(limit).Order("id desc").
		Preload("Employee").
		Preload("Unit").
		Find(&items)

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetEmployeeOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.EmployeeOrganizationUnit

	if err := empOrgUnitDB.
		Preload("Employee").
		Preload("Unit").
		First(&item, id).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Mapping not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateEmployeeOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateEmployeeOrgUnitRequest
	var item models.EmployeeOrganizationUnit

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := empOrgUnitDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Mapping not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.EmployeeID != nil {
		item.EmployeeID = *body.EmployeeID
	}
	if body.UnitID != nil {
		item.UnitID = *body.UnitID
	}

	if err := empOrgUnitDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	empOrgUnitDB.Preload("Employee").Preload("Unit").First(&item, id)

	return c.JSON(item)
}

func DeleteEmployeeOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.EmployeeOrganizationUnit

	if err := empOrgUnitDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := empOrgUnitDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Employee-Unit mapping deleted successfully"})
}
