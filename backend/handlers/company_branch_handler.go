package handler

import (
	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var companyBranchDB *gorm.DB

func SetCompanyBranchDB(db *gorm.DB) {
	companyBranchDB = db
}

/* ================= REQUEST DTOs ================= */

type CreateCompanyBranchRequest struct {
	CompanyID    uint   `json:"company_id"`
	Code         string `json:"code"`
	Name         string `json:"name"`
	GSTNumber    string `json:"gst_number"`
	Address      string `json:"address"`
	City         string `json:"city"`
	State        string `json:"state"`
	Pincode      string `json:"pincode"`
	IsHeadOffice bool   `json:"is_head_office"`
}

type UpdateCompanyBranchRequest struct {
	Code         *string `json:"code"`
	Name         *string `json:"name"`
	GSTNumber    *string `json:"gst_number"`
	Address      *string `json:"address"`
	City         *string `json:"city"`
	State        *string `json:"state"`
	Pincode      *string `json:"pincode"`
	IsHeadOffice *bool   `json:"is_head_office"`
}

func CreateCompanyBranch(c *fiber.Ctx) error {
	var body CreateCompanyBranchRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	branch := models.CompanyBranch{
		CompanyID:    body.CompanyID,
		Code:         body.Code,
		Name:         body.Name,
		GSTNumber:    body.GSTNumber,
		Address:      body.Address,
		City:         body.City,
		State:        body.State,
		Pincode:      body.Pincode,
		IsHeadOffice: body.IsHeadOffice,
	}

	if err := companyBranchDB.Create(&branch).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(branch)
}

func GetCompanyBranches(c *fiber.Ctx) error {
	var branches []models.CompanyBranch
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")
	companyID := c.Query("company_id")

	offset := (page - 1) * limit
	query := companyBranchDB.Model(&models.CompanyBranch{})

	if companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}

	if search != "" {
		query = query.Where(
			"name ILIKE ? OR code ILIKE ? OR city ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%",
		)
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").Find(&branches)

	return c.JSON(fiber.Map{
		"data":  branches,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetCompanyBranch(c *fiber.Ctx) error {
	id := c.Params("id")
	var branch models.CompanyBranch

	if err := companyBranchDB.Preload("Banks").First(&branch, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Branch not found"})
	}

	return c.JSON(branch)
}

func UpdateCompanyBranch(c *fiber.Ctx) error {
	id := c.Params("id")

	var branch models.CompanyBranch
	if err := companyBranchDB.First(&branch, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Branch not found"})
	}

	var body UpdateCompanyBranchRequest
	c.BodyParser(&body)

	updates := map[string]interface{}{}

	if body.Code != nil {
		updates["code"] = *body.Code
	}
	if body.Name != nil {
		updates["name"] = *body.Name
	}
	if body.GSTNumber != nil {
		updates["gst_number"] = *body.GSTNumber
	}
	if body.Address != nil {
		updates["address"] = *body.Address
	}
	if body.City != nil {
		updates["city"] = *body.City
	}
	if body.State != nil {
		updates["state"] = *body.State
	}
	if body.Pincode != nil {
		updates["pincode"] = *body.Pincode
	}
	if body.IsHeadOffice != nil {
		updates["is_head_office"] = *body.IsHeadOffice
	}

	if err := companyBranchDB.Model(&branch).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(branch)
}

func DeleteCompanyBranch(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := companyBranchDB.Delete(&models.CompanyBranch{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Company branch deleted"})
}
