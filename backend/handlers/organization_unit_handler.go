package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var orgUnitDB *gorm.DB

func SetOrgUnitDB(db *gorm.DB) {
	orgUnitDB = db
}

/* DTOs */

type CreateOrgUnitRequest struct {
	Name     string `json:"name"`
	ParentID *uint  `json:"parent_id,omitempty"`
}

type UpdateOrgUnitRequest struct {
	Name     *string `json:"name"`
	ParentID *uint   `json:"parent_id"`
}

/* HANDLERS */

func CreateOrgUnit(c *fiber.Ctx) error {
	var body CreateOrgUnitRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	if body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Name is required"})
	}

	item := models.OrganizationUnit{
		Name:     body.Name,
		ParentID: body.ParentID,
	}

	if err := orgUnitDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	orgUnitDB.Preload("Parent").First(&item, item.ID)

	return c.Status(201).JSON(item)
}

func GetOrgUnits(c *fiber.Ctx) error {
	var items []models.OrganizationUnit
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")

	offset := (page - 1) * limit

	query := orgUnitDB.Model(&models.OrganizationUnit{})

	if search != "" {
		query = query.Where("name ILIKE ?", "%"+search+"%")
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").
		Preload("Parent").Find(&items)

	return c.JSON(fiber.Map{
		"data":  items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.OrganizationUnit

	if err := orgUnitDB.Preload("Parent").First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Organization unit not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateOrgUnitRequest
	var item models.OrganizationUnit

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := orgUnitDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Organization unit not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Name != nil {
		item.Name = *body.Name
	}
	if body.ParentID != nil {
		item.ParentID = body.ParentID
	}

	if err := orgUnitDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	orgUnitDB.Preload("Parent").First(&item, id)

	return c.JSON(item)
}

func DeleteOrgUnit(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.OrganizationUnit

	if err := orgUnitDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := orgUnitDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Organization unit deleted successfully"})
}
