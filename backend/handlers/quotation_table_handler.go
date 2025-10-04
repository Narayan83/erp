package handler

import (
	"fmt"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var quotationTableDB *gorm.DB

// Inject DB
func SetQuotationTableDB(db *gorm.DB) {

	quotationTableDB = db
}

type QuotationRequest struct {
	Quotation      models.QuotationTable        `json:"quotation"`
	QuotationItems []models.QuotationTableItems `json:"quotation_items"`
}

// Create Quotation (with items)
// func CreateQuotationTable(c *fiber.Ctx) error {
// 	var quotation models.QuotationTable
// 	if err := c.BodyParser(&quotation); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	if err := quotationTableDB.Create(&quotation).Error; err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	return c.Status(fiber.StatusCreated).JSON(quotation)
// }

func CreateQuotationTable(c *fiber.Ctx) error {
	var req QuotationRequest

	// Parse JSON body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Debug: print parsed input
	fmt.Println("Input Quotation:", req.Quotation)
	fmt.Println("Input Quotation Items:", req.QuotationItems)

	// Save Quotation first
	if err := quotationTableDB.Create(&req.Quotation).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Assign QuotationID to each item
	for i := range req.QuotationItems {
		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
	}

	// Save Quotation Items
	if len(req.QuotationItems) > 0 {
		if err := quotationTableDB.Create(&req.QuotationItems).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	// Return response
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"quotation":       req.Quotation,
		"quotation_items": req.QuotationItems,
	})
}

func GetAllQuotationsTable(c *fiber.Ctx) error {
	var quotations []models.QuotationTable
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter", "")

	offset := (page - 1) * limit
	query := quotationTableDB.Preload("Customer").
		Preload("SalesCreditPerson").
		Preload("BillingAddress"). // <-- fixed typo
		Preload("ShippingAddress").
		Preload("TermsAndCondtions").
		Preload("QuotationTableItems.Product").
		Model(&models.QuotationTable{})

	if filter != "" {
		query = query.Where("quotation_number LIKE ?", "%"+filter+"%").
			Or("status LIKE ?", "%"+filter+"%")
	}

	if err := query.Offset(offset).Limit(limit).Order("created_at desc").Find(&quotations).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  quotations,
		"page":  page,
		"limit": limit,
	})
}

// Get Single Quotation by ID
func GetQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")
	var quotation models.QuotationTable
	if err := quotationTableDB.Preload("Customer").
		Preload("SalesCreditPerson").
		Preload("BiilingAddress").
		Preload("ShippingAddress").
		Preload("TermsAndCondtions").
		Preload("QuotationTableItems.Product").
		First(&quotation, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Quotation not found"})
	}
	return c.JSON(quotation)
}

// Update Quotation (with items)
func UpdateQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")
	var existing models.QuotationTable

	if err := quotationTableDB.Preload("QuotationTableItems").First(&existing, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Quotation not found"})
	}

	var updated models.QuotationTable
	if err := c.BodyParser(&updated); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// ✅ Update Quotation header
	if err := quotationTableDB.Model(&existing).Updates(updated).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// ✅ Remove old items
	if err := quotationTableDB.Where("quotation_id = ?", existing.QuotationID).Delete(&models.QuotationTableItems{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// ✅ Insert new items
	for _, item := range updated.QuotationTableItems {
		item.QuotationID = existing.QuotationID
		if err := quotationTableDB.Create(&item).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.JSON(updated)
}

// Delete Quotation (and items)
func DeleteQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")

	// Delete items first
	if err := quotationTableDB.Where("quotation_id = ?", id).Delete(&models.QuotationTableItems{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Delete quotation
	if err := quotationTableDB.Delete(&models.QuotationTable{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Quotation deleted successfully"})
}
