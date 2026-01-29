package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var companyDB *gorm.DB

func SetCompanyDB(db *gorm.DB) {
	companyDB = db
}

/* ================= REQUEST DTOs ================= */

type CreateCompanyRequest struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type UpdateCompanyRequest struct {
	Code *string `json:"code"`
	Name *string `json:"name"`
}

/* ================= HANDLERS ================= */

func CreateCompany(c *fiber.Ctx) error {
	var body CreateCompanyRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Code == "" || body.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code and Name are required"})
	}

	company := models.Company{
		Code: body.Code,
		Name: body.Name,
	}

	if err := companyDB.Create(&company).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(company)
}

func GetCompanies(c *fiber.Ctx) error {
	var companies []models.Company
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := companyDB.Model(&models.Company{})

	if search != "" {
		query = query.Where(
			"name ILIKE ? OR code ILIKE ?",
			"%"+search+"%", "%"+search+"%",
		)
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").Find(&companies)

	return c.JSON(fiber.Map{
		"data":  companies,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetCompany(c *fiber.Ctx) error {
	id := c.Params("id")
	var company models.Company

	if err := companyDB.First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Company not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(company)
}

func UpdateCompany(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateCompanyRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var company models.Company
	if err := companyDB.First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Company not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Code != nil {
		company.Code = *body.Code
	}
	if body.Name != nil {
		company.Name = *body.Name
	}

	if err := companyDB.Save(&company).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(company)
}

func DeleteCompany(c *fiber.Ctx) error {
	id := c.Params("id")

	var company models.Company
	if err := companyDB.First(&company, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Company not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := companyDB.Delete(&company).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Company deleted successfully"})
}
