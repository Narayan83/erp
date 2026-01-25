package handler

import (
	"fmt"
	"time"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var quotationTemplatesDB *gorm.DB

// SetQuotationTemplatesDB injects the database connection
func SetQuotationTemplatesDB(db *gorm.DB) {
	quotationTemplatesDB = db
}

// TemplateRequest defines the structure for creating a quotation template
type TemplateRequest struct {
	TemplateName   string                       `json:"template_name"`
	Quotation      models.QuotationTable        `json:"quotation"`
	QuotationItems []models.QuotationTableItems `json:"quotation_items"`
}

// CreateQuotationTemplate creates a new quotation template in the database
func CreateQuotationTemplate(c *fiber.Ctx) error {
	var req TemplateRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.TemplateName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Template name is required"})
	}

	tx := quotationTemplatesDB.Begin()

	// 1. Create the QuotationTable entry
	// Generate a unique QuotationNumber for the template reference
	tplQNo := fmt.Sprintf("TPL-%s-%d", req.TemplateName, time.Now().Unix())

	req.Quotation.QuotationNumber = tplQNo
	req.Quotation.Status = models.Qt_Draft

	if err := tx.Create(&req.Quotation).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create quotation for template: " + err.Error()})
	}

	// 2. Create QuotationItems
	for i := range req.QuotationItems {
		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
	}
	if len(req.QuotationItems) > 0 {
		if err := tx.Create(&req.QuotationItems).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create items for template: " + err.Error()})
		}
	}

	// 3. Create the QuotationTemplates entry
	template := models.QutationTemplates{
		QutationTemplateName: req.TemplateName,
		TemplateQuotationID:  req.Quotation.QuotationID,
		TemplateStatus:       "Active",
	}

	if err := tx.Create(&template).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create template entry: " + err.Error()})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message":  "Template saved successfully",
		"template": template,
	})
}

// GetAllQuotationTemplates retrieves all quotation templates from the database
func GetAllQuotationTemplates(c *fiber.Ctx) error {
	var templates []models.QutationTemplates
	if err := quotationTemplatesDB.
		Preload("QuotationTable.QuotationTableItems").
		Preload("QuotationTable.Customer").
		Preload("QuotationTable.BillingAddress").
		Preload("QuotationTable.ShippingAddress").
		Find(&templates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(templates)
}

// GetQuotationTemplateByID retrieves a specific quotation template by ID
func GetQuotationTemplateByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var template models.QutationTemplates
	if err := quotationTemplatesDB.
		Preload("QuotationTable.QuotationTableItems").
		Preload("QuotationTable.Customer").
		Preload("QuotationTable.BillingAddress").
		Preload("QuotationTable.ShippingAddress").
		First(&template, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Template not found"})
	}
	return c.JSON(template)
}

// DeleteQuotationTemplate deletes a quotation template by ID
func DeleteQuotationTemplate(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := quotationTemplatesDB.Delete(&models.QutationTemplates{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Template deleted successfully"})
}
