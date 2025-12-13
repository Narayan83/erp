package handler

import (
	"encoding/json"
	"os"
	"path/filepath"

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

// func CreateQuotationTable(c *fiber.Ctx) error {
// 	var req QuotationRequest

// 	// Parse JSON body
// 	if err := c.BodyParser(&req); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	// Debug: print parsed input
// 	fmt.Println("Input Quotation:", req.Quotation)
// 	fmt.Println("Input Quotation Items:", req.QuotationItems)

// 	// Save Quotation first
// 	if err := quotationTableDB.Create(&req.Quotation).Error; err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	// Assign QuotationID to each item
// 	for i := range req.QuotationItems {
// 		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
// 	}

// 	// Save Quotation Items
// 	if len(req.QuotationItems) > 0 {
// 		if err := quotationTableDB.Create(&req.QuotationItems).Error; err != nil {
// 			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
// 		}
// 	}

// 	// Return response
// 	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
// 		"quotation":       req.Quotation,
// 		"quotation_items": req.QuotationItems,
// 	})
// }

func CreateQuotationTable(c *fiber.Ctx) error {
	var req QuotationRequest

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		// If it's not multipart, try plain JSON body
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
		}
	} else {
		// Parse quotation JSON
		quotationJSON := form.Value["quotation"]
		itemsJSON := form.Value["quotation_items"]

		if len(quotationJSON) == 0 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing quotation data"})
		}

		if err := json.Unmarshal([]byte(quotationJSON[0]), &req.Quotation); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quotation JSON"})
		}

		if len(itemsJSON) > 0 {
			if err := json.Unmarshal([]byte(itemsJSON[0]), &req.QuotationItems); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quotation_items JSON"})
			}
		}

	}

	// Handle file upload
	file, err := c.FormFile("attachment")
	if err == nil {
		uploadDir := "./uploads/quotations/"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		filePath := filepath.Join(uploadDir, file.Filename)
		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		req.Quotation.AttachmentPath = &filePath
	}

	// Save quotation first
	if err := quotationTableDB.Create(&req.Quotation).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Assign QuotationID to each item
	for i := range req.QuotationItems {
		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
	}

	// Save quotation items
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
		Preload("BillingAddress").
		Preload("ShippingAddress").
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
		Preload("BillingAddress").
		Preload("ShippingAddress").
		Preload("QuotationTableItems.Product").
		First(&quotation, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Quotation not found"})
	}
	return c.JSON(quotation)
}

// Update Quotation (with items)
func UpdateQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")
	var existingQuotation models.QuotationTable
	if err := quotationTableDB.Preload("QuotationTableItems").First(&existingQuotation, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Quotation not found"})
	}

	var req QuotationRequest

	form, err := c.MultipartForm()
	if err != nil {
		// Handle plain JSON request
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
		}
	} else {
		quotationJSON := form.Value["quotation"]
		itemsJSON := form.Value["quotation_items"]
		extraChargesJSON := form.Value["extra_charges"]

		if len(quotationJSON) > 0 {
			if err := json.Unmarshal([]byte(quotationJSON[0]), &req.Quotation); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quotation JSON"})
			}
		}
		if len(itemsJSON) > 0 {
			if err := json.Unmarshal([]byte(itemsJSON[0]), &req.QuotationItems); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid quotation_items JSON"})
			}
		}
		if len(extraChargesJSON) > 0 {
			if err := json.Unmarshal([]byte(extraChargesJSON[0]), &req.Quotation.ExtraCharges); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid extra_charges JSON"})
			}
		}
	}

	// Handle new file upload if provided
	file, err := c.FormFile("attachment")
	if err == nil {
		uploadDir := "./uploads/quotations/"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		filePath := filepath.Join(uploadDir, file.Filename)
		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		req.Quotation.AttachmentPath = &filePath

		// Delete old file if exists
		if existingQuotation.AttachmentPath != nil {
			os.Remove(*existingQuotation.AttachmentPath)
		}
	} else {
		// Keep the old attachment if not replaced
		req.Quotation.AttachmentPath = existingQuotation.AttachmentPath
	}

	// Ensure we're updating the same record
	req.Quotation.QuotationID = existingQuotation.QuotationID

	// Update the main quotation record
	if err := quotationTableDB.Model(&existingQuotation).Updates(req.Quotation).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// -----------------------------
	// Handle Quotation Items Update
	// -----------------------------

	// Collect all item IDs in the request
	var requestItemIDs []uint
	for _, item := range req.QuotationItems {
		if item.ID != 0 {
			requestItemIDs = append(requestItemIDs, item.ID)
		}
	}

	// Delete items that are no longer in the request
	for _, oldItem := range existingQuotation.QuotationTableItems {
		if !contains(requestItemIDs, oldItem.ID) {
			quotationTableDB.Delete(&oldItem)
		}
	}

	// Upsert each item
	for _, item := range req.QuotationItems {
		item.QuotationID = existingQuotation.QuotationID
		if item.ID != 0 {
			// Update existing
			if err := quotationTableDB.Model(&models.QuotationItem{}).
				Where("quotation_item_id = ?", item.ID).
				Updates(item).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
		} else {
			// Insert new
			if err := quotationTableDB.Create(&item).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
		}
	}

	// Fetch updated data
	var updatedQuotation models.QuotationTable
	if err := quotationTableDB.Preload("QuotationTableItems").First(&updatedQuotation, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":         "Quotation updated successfully",
		"quotation":       updatedQuotation,
		"quotation_items": updatedQuotation.QuotationTableItems,
	})
}

// Helper: Check if slice contains an ID
func contains(arr []uint, id uint) bool {
	for _, v := range arr {
		if v == id {
			return true
		}
	}
	return false
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

func GetMaxQuotationScpCount(c *fiber.Ctx) error {
	salesPersonID := c.Params("sales_credit_person_id")

	var maxCount uint
	err := quotationTableDB.
		Model(&models.QuotationTable{}).
		Where("sales_credit_person_id = ?", salesPersonID).
		Select("COALESCE(MAX(qutation_scp_count), 0)"). // return 0 if no record
		Scan(&maxCount).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"sales_credit_person_id": salesPersonID,
		"max_qutation_scp_count": maxCount,
	})
}
