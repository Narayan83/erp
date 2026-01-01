package handler

import (
	"fmt"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var quotationDB *gorm.DB

func SetQuotationDB(db *gorm.DB) {
	quotationDB = db
}

// Create Quotation with Items
func CreateQuotation(c *fiber.Ctx) error {
	var input struct {
		Quotation      models.Quotation       `json:"quotation"`
		QuotationItems []models.QuotationItem `json:"quotation_items"`
	}

	// Debug: capture raw body to help diagnose parsing issues
	raw := c.Body()
	if err := c.BodyParser(&input); err != nil {
		// Log error and raw body (trim to reasonable length)
		fmt.Println("Error parsing body:", err)
		if len(raw) > 0 {
			snippet := string(raw)
			if len(snippet) > 2000 {
				snippet = snippet[:2000] + "..."
			}
			fmt.Println("Raw request body (snippet):", snippet)
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "parse_error": err.Error(), "raw_body_snippet": snippet})
		}
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "parse_error": err.Error()})
	}

	// Start DB transaction
	tx := quotationDB.Begin()

	input.Quotation.CreatedAt = time.Now()
	input.Quotation.UpdatedAt = time.Now()

	// Create the main Quotation
	if err := tx.Create(&input.Quotation).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Link quotation ID to each item
	for i := range input.QuotationItems {
		input.QuotationItems[i].QuotationID = input.Quotation.QuotationID
	}

	// Create all quotation items
	if err := tx.Create(&input.QuotationItems).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save quotation items"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{
		"quotation":       input.Quotation,
		"quotation_items": input.QuotationItems,
	})
}

// Get All Quotations
// func GetAllQuotations(c *fiber.Ctx) error {
// 	page := c.QueryInt("page", 1)
// 	limit := c.QueryInt("limit", 10)
// 	if page < 1 {
// 		page = 1
// 	}
// 	if limit < 1 {
// 		limit = 10
// 	}
// 	offset := (page - 1) * limit

// 	var total int64
// 	query := quotationDB.Model(&models.Quotation{})
// 	if err := query.Count(&total).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	var quotations []models.Quotation
// 	if err := quotationDB.
// 		Preload("Customer").
// 		Preload("MarketingPerson").
// 		Preload("QuotationItems").
// 		Offset(offset).
// 		Limit(limit).
// 		Find(&quotations).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	return c.JSON(fiber.Map{
// 		"data":       quotations,
// 		"page":       page,
// 		"limit":      limit,
// 		"total":      total,
// 		"totalPages": (total + int64(limit) - 1) / int64(limit),
// 	})
// }

func GetAllQuotations(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := quotationDB.Model(&models.Quotation{}).Joins("LEFT JOIN users ON users.id = quotations.customer_id")

	// Apply filters
	if qNum := c.Query("quotation_number"); qNum != "" {
		query = query.Where("quotation_number ILIKE ?", "%"+qNum+"%")
	}

	if customer := c.Query("customer"); customer != "" {
		query = query.Where("LOWER(CONCAT(users.firstname, ' ', users.lastname)) LIKE ?", "%"+strings.ToLower(customer)+"%")
	}

	if date := c.Query("quotation_date"); date != "" {
		query = query.Where("DATE(quotation_date) = ?", date)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var quotations []models.Quotation
	if err := query.
		Preload("Customer").
		Preload("Branch").
		Preload("SalesCreditPerson").
		Preload("MarketingPerson").
		Preload("QuotationItems.Product").
		Preload("QuotationItems.ProductVariant").
		Offset(offset).
		Limit(limit).
		Find(&quotations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":       quotations,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// Get Quotation by ID
func GetQuotationByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var quotation models.Quotation
	if err := quotationDB.
		Preload("Customer").
		Preload("Customer.Addresses").
		Preload("Branch").
		Preload("SalesCreditPerson").
		Preload("MarketingPerson").
		Preload("Series").
		Preload("BillingAddress").
		Preload("ShippingAddress").
		Preload("QuotationItems").
		Preload("QuotationItems.Product").
		Preload("QuotationItems.Product.Variants").
		Preload("QuotationItems.Product.Variants.Images").
		Preload("QuotationItems.ProductVariant").
		First(&quotation, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
	}
	return c.JSON(quotation)
}

// Update Quotation
func UpdateQuotation(c *fiber.Ctx) error {
	quotationID := c.Params("id")

	var input struct {
		Quotation      models.Quotation       `json:"quotation"`
		QuotationItems []models.QuotationItem `json:"quotation_items"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	var existingQuotation models.Quotation
	if err := quotationDB.Preload("QuotationItems").First(&existingQuotation, "quotation_id = ?", quotationID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
	}

	// Start a transaction
	tx := quotationDB.Begin()

	// Update the quotation fields
	input.Quotation.UpdatedAt = time.Now()
	if err := tx.Model(&existingQuotation).Updates(input.Quotation).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update quotation"})
	}

	// Track incoming item IDs
	incomingItemIDs := make(map[uint]bool)
	for _, item := range input.QuotationItems {
		if item.ID != 0 {
			incomingItemIDs[item.ID] = true
		}
	}

	// Delete removed items
	for _, oldItem := range existingQuotation.QuotationItems {
		if _, found := incomingItemIDs[oldItem.ID]; !found {
			if err := tx.Delete(&models.QuotationItem{}, oldItem.ID).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "Failed to delete removed quotation item"})
			}
		}
	}

	// Upsert each item
	for _, item := range input.QuotationItems {
		item.QuotationID = existingQuotation.QuotationID
		if item.ID == 0 {
			// New item
			if err := tx.Create(&item).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create new quotation item"})
			}
		} else {
			// Existing item
			if err := tx.Model(&models.QuotationItem{}).Where("id = ?", item.ID).Updates(item).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "Failed to update quotation item"})
			}
		}
	}

	tx.Commit()
	return c.JSON(fiber.Map{
		"message":      "Quotation updated successfully",
		"quotation_id": quotationID,
		"updated_at":   input.Quotation.UpdatedAt,
	})
}
