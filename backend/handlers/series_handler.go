package handler

import (
	"encoding/json"
	"fmt"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var seriesDB *gorm.DB

func SetSeriesDB(db *gorm.DB) {
	seriesDB = db
}

type CreateSeriesRequest struct {
	DocumentType     string `json:"document_type"`
	Name             string `json:"name"`
	Prefix           string `json:"prefix"`
	Postfix          string `json:"postfix"`
	Remarks          string `json:"remarks"`
	CompanyID        *uint  `json:"company_id"`
	CompanyBranchID  *uint  `json:"company_branch_id"`
	CompanyBranchIDs []uint `json:"company_branch_ids"`
	IsActive         bool   `json:"is_active"`
}

type UpdateSeriesRequest struct {
	DocumentType     *string `json:"document_type"`
	Name             *string `json:"name"`
	Prefix           *string `json:"prefix"`
	Postfix          *string `json:"postfix"`
	Remarks          *string `json:"remarks"`
	CompanyID        *uint   `json:"company_id"`
	CompanyBranchID  *uint   `json:"company_branch_id"`
	CompanyBranchIDs *[]uint `json:"company_branch_ids"`
	IsActive         *bool   `json:"is_active"`
}

func CreateSeries(c *fiber.Ctx) error {
	var body CreateSeriesRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	series := models.Series{
		DocumentType:    body.DocumentType,
		Name:            body.Name,
		Prefix:          body.Prefix,
		Postfix:         body.Postfix,
		Remarks:         body.Remarks,
		CompanyID:       body.CompanyID,
		CompanyBranchID: body.CompanyBranchID,
		IsActive:        body.IsActive,
	}

	// Persist company_branch_ids as JSONB
	if len(body.CompanyBranchIDs) > 0 {
		b, _ := json.Marshal(body.CompanyBranchIDs)
		series.CompanyBranchIDs = datatypes.JSON(b)
		// ensure primary company_branch_id is set to the first id if not provided
		if series.CompanyBranchID == nil {
			first := body.CompanyBranchIDs[0]
			series.CompanyBranchID = &first
		}
	}

	if err := seriesDB.Create(&series).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(series)
}
func GetSeriesList(c *fiber.Ctx) error {
	var series []models.Series
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")
	companyID := c.Query("company_id")
	branchID := c.Query("company_branch_id")

	offset := (page - 1) * limit

	query := seriesDB.Model(&models.Series{})

	if companyID != "" {
		query = query.Where("company_id = ?", companyID)
	}
	if branchID != "" {
		// Support native company_branch_id and JSONB company_branch_ids that contain the branch
		query = query.Where("company_branch_id = ? OR company_branch_ids @> ?", branchID, fmt.Sprintf("[%s]", branchID))
	}
	if search != "" {
		query = query.Where("prefix ILIKE ? OR remarks ILIKE ?",
			"%"+search+"%", "%"+search+"%",
		)
	}

	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("id desc").Find(&series)

	return c.JSON(fiber.Map{
		"data":  series,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
func GetSeries(c *fiber.Ctx) error {
	id := c.Params("id")

	var series models.Series
	if err := seriesDB.First(&series, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Series not found"})
	}

	return c.JSON(series)
}
func UpdateSeries(c *fiber.Ctx) error {
	id := c.Params("id")

	var series models.Series
	if err := seriesDB.First(&series, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Series not found"})
	}

	var body UpdateSeriesRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	updates := map[string]interface{}{}

	if body.DocumentType != nil {
		updates["document_type"] = *body.DocumentType
	}
	if body.Name != nil {
		updates["name"] = *body.Name
	}
	if body.Prefix != nil {
		updates["prefix"] = *body.Prefix
	}
	if body.Postfix != nil {
		updates["postfix"] = *body.Postfix
	}
	if body.Remarks != nil {
		updates["remarks"] = *body.Remarks
	}
	if body.CompanyID != nil {
		updates["company_id"] = body.CompanyID
	}
	if body.CompanyBranchID != nil {
		updates["company_branch_id"] = body.CompanyBranchID
	}
	if body.CompanyBranchIDs != nil {
		// marshal and set JSONB
		b, _ := json.Marshal(*body.CompanyBranchIDs)
		updates["company_branch_ids"] = datatypes.JSON(b)
		if len(*body.CompanyBranchIDs) > 0 {
			updates["company_branch_id"] = (*body.CompanyBranchIDs)[0]
		} else {
			updates["company_branch_id"] = nil
		}
	}
	if body.IsActive != nil {
		updates["is_active"] = *body.IsActive
	}

	seriesDB.Model(&series).Updates(updates)

	return c.JSON(series)
}
func DeleteSeries(c *fiber.Ctx) error {
	id := c.Params("id")

	// Prevent deletion if any quotation_tables reference this series
	var refCount int64
	seriesDB.Model(&models.QuotationTable{}).Where("series_id = ?", id).Count(&refCount)
	if refCount > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot delete series: referenced by existing quotations", "references": refCount})
	}

	if err := seriesDB.Delete(&models.Series{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Series deleted successfully"})
}
