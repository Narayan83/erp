package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var hsnDB *gorm.DB

func SetHSNDB(db *gorm.DB) {
	hsnDB = db
}

func GetAllHsnCode(c *fiber.Ctx) error {
	var hsns []models.HsnCode
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := hsnDB.Model(&models.HsnCode{}).Preload("Tax")
	if filter != "" {
		query = query.Where("code ILIKE ?", "%"+filter+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error counting records"})
	}

	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&hsns).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  hsns,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetHsnCodeByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var hsn models.HsnCode
	if err := hsnDB.Preload("Tax").First(&hsn, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "HSN not found"})
	}
	return c.JSON(hsn)
}

func CreateHsnCode(c *fiber.Ctx) error {
	var hsn models.HsnCode
	if err := c.BodyParser(&hsn); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := hsnDB.Create(&hsn).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(hsn)
}

func UpdateHsnCode(c *fiber.Ctx) error {
	id := c.Params("id")
	var hsn models.HsnCode

	if err := hsnDB.First(&hsn, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "HSN not found"})
	}
	if err := c.BodyParser(&hsn); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := hsnDB.Save(&hsn).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(hsn)
}

func DeleteHsnCode(c *fiber.Ctx) error {
	id := c.Params("id")

	// Ensure HSN exists
	var hsn models.HsnCode
	if err := hsnDB.First(&hsn, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "HSN not found"})
	}

	code := hsn.Code

	// Check references in products (Product.HsnSacCode) and quotation items (QuotationTableItems.HsnCode)
	var prodCount int64
	if err := hsnDB.Model(&models.Product{}).Where("hsn_sac_code = ?", code).Count(&prodCount).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var quoteCount int64
	if err := hsnDB.Model(&models.QuotationTableItems{}).Where("hsn_code = ?", code).Count(&quoteCount).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if prodCount > 0 || quoteCount > 0 {
		msg := "Cannot delete HSN: it is used"
		details := []string{}
		if prodCount > 0 {
			details = append(details, fmt.Sprintf("%d product(s)", prodCount))
		}
		if quoteCount > 0 {
			details = append(details, fmt.Sprintf("%d quotation item(s)", quoteCount))
		}
		if len(details) > 0 {
			msg = msg + " in " + strings.Join(details, " and ")
		}
		return c.Status(400).JSON(fiber.Map{"error": msg})
	}

	if err := hsnDB.Delete(&models.HsnCode{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

func SearchHsnCodes(c *fiber.Ctx) error {
	search := c.Query("search")
	var hsns []models.HsnCode

	query := hsnDB.Model(&models.HsnCode{})
	if search != "" {
		query = query.Where("code ILIKE ?", "%"+search+"%")
	}
	if err := query.Limit(20).Preload("Tax").Find(&hsns).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"data": hsns,
	})
}
