// package handler

// import (
// 	"encoding/json"
// 	"fmt"
// 	"os"
// 	"path/filepath"

// 	"erp.local/backend/models"

// 	"github.com/gofiber/fiber/v2"
// 	"gorm.io/gorm"
// )

// var quotationTableDB *gorm.DB

// // Inject DB
// func SetQuotationTableDB(db *gorm.DB) {
// 	quotationTableDB = db
// }

// // ================================
// // Request Struct
// // ================================
// type QuotationRequest struct {
// 	Quotation      models.QuotationTable        `json:"quotation"`
// 	QuotationItems []models.QuotationTableItems `json:"quotation_items"`
// }

// // ================================
// // Helper: Generate Quotation Number
// // ================================
// func generateQuotationNumber(db *gorm.DB, series *models.Series) (string, error) {
// 	number := series.PrefixNumber
// 	quotationNo := fmt.Sprintf("%s/%05d", series.Prefix, number)

// 	if err := db.Model(series).
// 		Update("prefix_number", gorm.Expr("prefix_number + 1")).Error; err != nil {
// 		return "", err
// 	}
// 	return quotationNo, nil
// }

// // ================================
// // CREATE QUOTATION
// // ================================
// func CreateQuotationTable(c *fiber.Ctx) error {
// 	var req QuotationRequest

// 	// ---------------------------
// 	// Parse Multipart / JSON
// 	// ---------------------------
// 	form, err := c.MultipartForm()
// 	if err != nil {
// 		if err := c.BodyParser(&req); err != nil {
// 			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
// 		}
// 	} else {
// 		if len(form.Value["quotation"]) == 0 {
// 			return c.Status(400).JSON(fiber.Map{"error": "Missing quotation"})
// 		}

// 		if err := json.Unmarshal([]byte(form.Value["quotation"][0]), &req.Quotation); err != nil {
// 			return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation JSON"})
// 		}

// 		if len(form.Value["quotation_items"]) > 0 {
// 			if err := json.Unmarshal([]byte(form.Value["quotation_items"][0]), &req.QuotationItems); err != nil {
// 				return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation_items JSON"})
// 			}
// 		}

// 		if len(form.Value["extra_charges"]) > 0 {
// 			if err := json.Unmarshal([]byte(form.Value["extra_charges"][0]), &req.Quotation.ExtraCharges); err != nil {
// 				return c.Status(400).JSON(fiber.Map{"error": "Invalid extra_charges JSON"})
// 			}
// 		}
// 	}

// 	// ---------------------------
// 	// File Upload
// 	// ---------------------------
// 	file, err := c.FormFile("attachment")
// 	if err == nil {
// 		uploadDir := "./uploads/quotations/"
// 		_ = os.MkdirAll(uploadDir, 0755)

// 		filePath := filepath.Join(uploadDir, file.Filename)
// 		if err := c.SaveFile(file, filePath); err != nil {
// 			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 		}
// 		req.Quotation.AttachmentPath = &filePath
// 	}

// 	// ---------------------------
// 	// TRANSACTION
// 	// ---------------------------
// 	tx := quotationTableDB.Begin()

// 	var series models.Series
// 	if err := tx.First(&series, req.Quotation.SeriesID).Error; err != nil {
// 		tx.Rollback()
// 		return c.Status(400).JSON(fiber.Map{"error": "Invalid series"})
// 	}

// 	qNo, err := generateQuotationNumber(tx, &series)
// 	if err != nil {
// 		tx.Rollback()
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	req.Quotation.QuotationNumber = qNo
// 	req.Quotation.Status = models.Qt_Draft

// 	// Ensure QuotationScpCount is set. If a sales credit person is present,
// 	// compute the next sequential count for that person; otherwise default to 1.
// 	if req.Quotation.SalesCreditPersonID != 0 {
// 		var maxCount uint
// 		if err := tx.
// 			Model(&models.QuotationTable{}).
// 			Where("sales_credit_person_id = ?", req.Quotation.SalesCreditPersonID).
// 			Select("COALESCE(MAX(quotation_scp_count), 0)").
// 			Scan(&maxCount).Error; err != nil {
// 			tx.Rollback()
// 			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 		}
// 		req.Quotation.QuotationScpCount = maxCount + 1
// 	} else {
// 		req.Quotation.QuotationScpCount = 1
// 	}

// 	if err := tx.Create(&req.Quotation).Error; err != nil {
// 		tx.Rollback()
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	for i := range req.QuotationItems {
// 		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
// 	}

// 	if len(req.QuotationItems) > 0 {
// 		if err := tx.Create(&req.QuotationItems).Error; err != nil {
// 			tx.Rollback()
// 			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 		}
// 	}

// 	tx.Commit()

// 	return c.Status(201).JSON(fiber.Map{
// 		"quotation":       req.Quotation,
// 		"quotation_items": req.QuotationItems,
// 	})
// }

// // ================================
// // GET ALL QUOTATIONS
// // ================================
// func GetAllQuotationsTable(c *fiber.Ctx) error {
// 	var quotations []models.QuotationTable

// 	page := c.QueryInt("page", 1)
// 	limit := c.QueryInt("limit", 10)
// 	offset := (page - 1) * limit

// 	if err := quotationTableDB.
// 		Preload("Series").
// 		Preload("CompanyBranch").
// 		Preload("CompanyBranchBank").
// 		Preload("Customer").
// 		Preload("SalesCreditPerson").
// 		Preload("BillingAddress").
// 		Preload("ShippingAddress").
// 		Preload("QuotationTableItems.Product").
// 		Order("created_at desc").
// 		Offset(offset).
// 		Limit(limit).
// 		Find(&quotations).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	return c.JSON(fiber.Map{
// 		"data":  quotations,
// 		"page":  page,
// 		"limit": limit,
// 	})
// }

// // ================================
// // GET SINGLE QUOTATION
// // ================================
// func GetQuotationTable(c *fiber.Ctx) error {
// 	id := c.Params("id")

// 	var quotation models.QuotationTable
// 	if err := quotationTableDB.
// 		Preload("Series").
// 		Preload("CompanyBranch").
// 		Preload("CompanyBranchBank").
// 		Preload("Customer").
// 		Preload("SalesCreditPerson").
// 		Preload("BillingAddress").
// 		Preload("ShippingAddress").
// 		Preload("QuotationTableItems.Product").
// 		First(&quotation, id).Error; err != nil {
// 		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
// 	}

// 	return c.JSON(quotation)
// }

// // ================================
// // DELETE QUOTATION
// // ================================
// func DeleteQuotationTable(c *fiber.Ctx) error {
// 	id := c.Params("id")

// 	if err := quotationTableDB.
// 		Where("quotation_id = ?", id).
// 		Delete(&models.QuotationTableItems{}).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	if err := quotationTableDB.Delete(&models.QuotationTable{}, id).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	return c.JSON(fiber.Map{"message": "Quotation deleted successfully"})
// }

// // ================================
// // SCP COUNT
// // ================================
// func GetMaxQuotationScpCount(c *fiber.Ctx) error {
// 	salesPersonID := c.Params("sales_credit_person_id")

// 	var maxCount uint
// 	err := quotationTableDB.
// 		Model(&models.QuotationTable{}).
// 		Where("sales_credit_person_id = ?", salesPersonID).
// 		Select("COALESCE(MAX(quotation_scp_count), 0)").
// 		Scan(&maxCount).Error

// 	if err != nil {
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	return c.JSON(fiber.Map{
// 		"sales_credit_person_id":  salesPersonID,
// 		"max_quotation_scp_count": maxCount,
// 	})
// }

// // ================================
// // UPDATE QUOTATION
// // ================================
// func UpdateQuotationTable(c *fiber.Ctx) error {
// 	id := c.Params("id")

// 	var req QuotationRequest
// 	if err := c.BodyParser(&req); err != nil {
// 		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
// 	}

// 	tx := quotationTableDB.Begin()

// 	var existing models.QuotationTable
// 	if err := tx.First(&existing, id).Error; err != nil {
// 		tx.Rollback()
// 		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
// 	}

// 	// Update main quotation fields (avoid changing primary key)
// 	if err := tx.Model(&existing).Updates(req.Quotation).Error; err != nil {
// 		tx.Rollback()
// 		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 	}

// 	// Replace quotation items if provided
// 	if len(req.QuotationItems) > 0 {
// 		if err := tx.Where("quotation_id = ?", existing.QuotationID).Delete(&models.QuotationTableItems{}).Error; err != nil {
// 			tx.Rollback()
// 			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 		}

// 		for i := range req.QuotationItems {
// 			req.QuotationItems[i].QuotationID = existing.QuotationID
// 		}

// 		if err := tx.Create(&req.QuotationItems).Error; err != nil {
// 			tx.Rollback()
// 			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
// 		}
// 	}

// 	tx.Commit()

// 	return c.JSON(fiber.Map{"message": "Quotation updated successfully"})
// }

package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var quotationTableDB *gorm.DB

// ================================
// Inject DB
// ================================
func SetQuotationTableDB(db *gorm.DB) {
	quotationTableDB = db
}

// ================================
// Request Struct
// ================================
type QuotationRequest struct {
	Quotation      models.QuotationTable        `json:"quotation"`
	QuotationItems []models.QuotationTableItems `json:"quotation_items"`
}

// ================================
// Helper: Generate Quotation Number
// PREFIX + QUOTATION_ID + POSTFIX
// ================================
func generateQuotationNumber(series *models.Series, quotationID uint) string {
	return fmt.Sprintf("%s%d%s", series.Prefix, quotationID, series.Postfix)
}

// ================================
// CREATE QUOTATION
// ================================
func CreateQuotationTable(c *fiber.Ctx) error {
	var req QuotationRequest

	// ---------------------------
	// Parse Multipart or JSON
	// ---------------------------
	form, err := c.MultipartForm()
	if err != nil {
		if err := c.BodyParser(&req); err != nil {
			// Log parse error and a snippet of the raw body to aid debugging
			raw := c.Body()
			snippet := ""
			if len(raw) > 0 {
				snippet = string(raw)
				if len(snippet) > 2000 {
					snippet = snippet[:2000] + "..."
				}
			}
			fmt.Println("Failed to parse JSON in CreateQuotationTable:", err)
			if snippet != "" {
				fmt.Println("Raw request body snippet:", snippet)
			}
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body", "parse_error": err.Error(), "raw_body_snippet": snippet})
		}
	} else {
		if len(form.Value["quotation"]) == 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Missing quotation"})
		}

		if err := json.Unmarshal([]byte(form.Value["quotation"][0]), &req.Quotation); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation JSON"})
		}

		if len(form.Value["quotation_items"]) > 0 {
			if err := json.Unmarshal([]byte(form.Value["quotation_items"][0]), &req.QuotationItems); err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation_items JSON"})
			}
		}

		if len(form.Value["extra_charges"]) > 0 {
			if err := json.Unmarshal([]byte(form.Value["extra_charges"][0]), &req.Quotation.ExtraCharges); err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid extra_charges JSON"})
			}
		}
	}

	// ---------------------------
	// File Upload
	// ---------------------------
	file, err := c.FormFile("attachment")
	if err == nil {
		uploadDir := "./uploads/quotations/"
		_ = os.MkdirAll(uploadDir, 0755)

		filePath := filepath.Join(uploadDir, file.Filename)
		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		req.Quotation.AttachmentPath = &filePath
	}

	// ---------------------------
	// TRANSACTION START
	// ---------------------------
	tx := quotationTableDB.Begin()

	// Validate Series (optional)
	var series models.Series
	if req.Quotation.SeriesID != nil {
		if err := tx.First(&series, *req.Quotation.SeriesID).Error; err != nil {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{"error": "Invalid series"})
		}
	}

	// Set defaults
	req.Quotation.Status = models.Qt_Open

	// If client provided a quotation number, validate uniqueness and use it.
	providedQNo := strings.TrimSpace(req.Quotation.QuotationNumber)
	if providedQNo != "" {
		// ensure uniqueness
		var exists int64
		if err := tx.Model(&models.QuotationTable{}).Where("quotation_number = ?", providedQNo).Count(&exists).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		if exists > 0 {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{"error": "quotation_number already exists"})
		}

		// Keep the provided quotation number and create the record
		if err := tx.Create(&req.Quotation).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	} else {
		// No quotation number provided — generate one based on series and created ID
		req.Quotation.QuotationNumber = "" // temporary
		if err := tx.Create(&req.Quotation).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		quotationNo := generateQuotationNumber(&series, req.Quotation.QuotationID)
		if err := tx.Model(&req.Quotation).
			Update("quotation_number", quotationNo).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	// STEP 4: Insert quotation items
	for i := range req.QuotationItems {
		req.QuotationItems[i].QuotationID = req.Quotation.QuotationID
	}

	if len(req.QuotationItems) > 0 {
		if err := tx.Create(&req.QuotationItems).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"quotation":       req.Quotation,
		"quotation_items": req.QuotationItems,
	})
}

// ================================
// GET ALL QUOTATIONS
// ================================
func GetAllQuotationsTable(c *fiber.Ctx) error {
	var quotations []models.QuotationTable

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	offset := (page - 1) * limit

	if err := quotationTableDB.
		// Exclude quotations that are saved as templates
		Where("quotation_id NOT IN (SELECT template_quotation_id FROM qutation_templates)").
		Preload("Series").
		Preload("CompanyBranch").
		Preload("CompanyBranchBank").
		Preload("Customer").
		Preload("SalesCreditPerson").
		Preload("BillingAddress").
		Preload("ShippingAddress").
		Preload("QuotationTableItems.Product.Variants").
		Preload("QuotationTableItems.Product").
		Order("created_at desc").
		Offset(offset).
		Limit(limit).
		Find(&quotations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  quotations,
		"page":  page,
		"limit": limit,
	})
}

// ================================
// GET SINGLE QUOTATION
// ================================
func GetQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")

	var quotation models.QuotationTable
	if err := quotationTableDB.
		Preload("Series").
		Preload("CompanyBranch").
		Preload("CompanyBranchBank").
		Preload("Customer").
		Preload("SalesCreditPerson").
		Preload("BillingAddress").
		Preload("ShippingAddress").
		Preload("QuotationTableItems.Product.Variants").
		Preload("QuotationTableItems.Product").
		First(&quotation, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
	}

	return c.JSON(quotation)
}

// ================================
// DELETE QUOTATION
// ================================
func DeleteQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := quotationTableDB.
		Where("quotation_id = ?", id).
		Delete(&models.QuotationTableItems{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := quotationTableDB.Delete(&models.QuotationTable{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Quotation deleted successfully"})
}

// ================================
// SCP COUNT
// ================================
func GetMaxQuotationScpCount(c *fiber.Ctx) error {
	salesPersonID := c.Params("sales_credit_person_id")

	var maxCount uint
	err := quotationTableDB.
		Model(&models.QuotationTable{}).
		Where("sales_credit_person_id = ?", salesPersonID).
		Select("COALESCE(MAX(quotation_scp_count), 0)").
		Scan(&maxCount).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"sales_credit_person_id":  salesPersonID,
		"max_quotation_scp_count": maxCount,
	})
}

// ================================
// UPDATE QUOTATION
// ================================
func UpdateQuotationTable(c *fiber.Ctx) error {
	id := c.Params("id")

	var req QuotationRequest

	// ---------------------------
	// Parse Multipart or JSON
	// ---------------------------
	form, err := c.MultipartForm()
	if err != nil {
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body", "details": err.Error()})
		}
	} else {
		if len(form.Value["quotation"]) > 0 {
			if err := json.Unmarshal([]byte(form.Value["quotation"][0]), &req.Quotation); err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation JSON"})
			}
		}

		if len(form.Value["quotation_items"]) > 0 {
			if err := json.Unmarshal([]byte(form.Value["quotation_items"][0]), &req.QuotationItems); err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid quotation_items JSON"})
			}
		}
	}

	// ---------------------------
	// File Upload (Update Attachment)
	// ---------------------------
	file, err := c.FormFile("attachment")
	if err == nil {
		uploadDir := "./uploads/quotations/"
		_ = os.MkdirAll(uploadDir, 0755)

		filePath := filepath.Join(uploadDir, file.Filename)
		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		req.Quotation.AttachmentPath = &filePath
	}

	tx := quotationTableDB.Begin()

	var existing models.QuotationTable
	if err := tx.First(&existing, id).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"error": "Quotation not found"})
	}

	// Update main quotation fields (avoid changing primary key)
	if err := tx.Model(&existing).Updates(req.Quotation).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Replace quotation items if provided
	if len(req.QuotationItems) > 0 {
		if err := tx.Where("quotation_id = ?", existing.QuotationID).Delete(&models.QuotationTableItems{}).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		for i := range req.QuotationItems {
			req.QuotationItems[i].QuotationID = existing.QuotationID
		}

		if err := tx.Create(&req.QuotationItems).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	tx.Commit()

	return c.JSON(fiber.Map{"message": "Quotation updated successfully"})
}

// ================================
// SCP COUNT BY SERIES
// ================================
func GetScpCountBySeriesID(c *fiber.Ctx) error {
	seriesID := c.Params("series_id")

	var maxScpCount uint

	err := quotationTableDB.
		Model(&models.QuotationTable{}).
		Where("series_id = ?", seriesID).
		Select("COALESCE(MAX(quotation_scp_count), 0)").
		Scan(&maxScpCount).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"series_id":               seriesID,
		"max_quotation_scp_count": maxScpCount,
	})
}
