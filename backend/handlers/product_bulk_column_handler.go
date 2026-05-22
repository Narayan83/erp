package handler

import (
	"fmt"
	"strconv"
	"strings"

	"erp.local/backend/auditlog"
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func recordBulkColumnAudit(c *fiber.Ctx, table string, productID uint, code, column string, oldVal, newVal interface{}) {
	auditlog.RecordUpdate(productsDB, c, table, strconv.FormatUint(uint64(productID), 10), fiber.Map{
		"code":   code,
		"column": column,
		"old":    oldVal,
	}, fiber.Map{
		"code":   code,
		"column": column,
		"new":    newVal,
	})
}

type bulkColumnMeta struct {
	Name        string `json:"name"`
	Label       string `json:"label"`
	Table       string `json:"table"`
	Type        string `json:"type"`
	Description string `json:"description,omitempty"`
}

type bulkColumnUpdateRow struct {
	Code  string `json:"code"`
	Value string `json:"value"`
}

type bulkColumnUpdateRequest struct {
	Column string                `json:"column"`
	Rows   []bulkColumnUpdateRow `json:"rows"`
}

type bulkChangeDetail struct {
	Old interface{} `json:"old"`
	New interface{} `json:"new"`
}

type bulkUpdateLogEntry struct {
	Row     int                        `json:"row"`
	Code    string                     `json:"code"`
	Status  string                     `json:"status"` // success | error | skipped
	Column  string                     `json:"column,omitempty"`
	Table   string                     `json:"table,omitempty"`
	Message string                     `json:"message,omitempty"`
	Changes map[string]bulkChangeDetail `json:"changes,omitempty"`
}

// productBulkColumnDefs — updatable DB columns (snake_case) for products / product_variants.
var productBulkColumnDefs = []bulkColumnMeta{
	// products
	{Name: "name", Label: "Name", Table: "products", Type: "string"},
	{Name: "category_id", Label: "Category ID", Table: "products", Type: "uint"},
	{Name: "subcategory_id", Label: "Subcategory ID", Table: "products", Type: "uint"},
	{Name: "unit_id", Label: "Unit ID", Table: "products", Type: "uint"},
	{Name: "store_id", Label: "Store ID", Table: "products", Type: "uint"},
	{Name: "tax_id", Label: "Tax ID", Table: "products", Type: "uint"},
	{Name: "tag_id", Label: "Tag ID", Table: "products", Type: "uint"},
	{Name: "importance", Label: "Importance", Table: "products", Type: "string"},
	{Name: "hsn_sac_code", Label: "HSN/SAC Code", Table: "products", Type: "string"},
	{Name: "product_mode", Label: "Product Mode", Table: "products", Type: "string"},
	{Name: "gst_percent", Label: "GST %", Table: "products", Type: "float"},
	{Name: "description", Label: "Description", Table: "products", Type: "string"},
	{Name: "internal_notes", Label: "Internal Notes", Table: "products", Type: "string"},
	{Name: "std_code", Label: "Std Code", Table: "products", Type: "string"},
	{Name: "minimum_stock", Label: "Minimum Stock", Table: "products", Type: "int"},
	{Name: "moq", Label: "MOQ", Table: "products", Type: "int"},
	{Name: "product_type", Label: "Product Type", Table: "products", Type: "string"},
	{Name: "is_active", Label: "Is Active", Table: "products", Type: "bool"},
	// product_variants
	{Name: "color", Label: "Color", Table: "product_variants", Type: "string"},
	{Name: "size", Label: "Size", Table: "product_variants", Type: "string"},
	{Name: "sku", Label: "SKU", Table: "product_variants", Type: "string"},
	{Name: "barcode", Label: "Barcode", Table: "product_variants", Type: "string"},
	{Name: "purchase_cost", Label: "Purchase Cost", Table: "product_variants", Type: "float"},
	{Name: "std_sales_price", Label: "Std Sales Price", Table: "product_variants", Type: "float"},
	{Name: "stock", Label: "Stock", Table: "product_variants", Type: "int"},
	{Name: "lead_time", Label: "Lead Time", Table: "product_variants", Type: "int"},
	{Name: "is_active", Label: "Variant Is Active", Table: "product_variants", Type: "bool", Description: "Updates variant active flag"},
}

func normalizeBulkColumnName(raw string) string {
	s := strings.TrimSpace(strings.ToLower(raw))
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "-", "_")
	return s
}

func findBulkColumnDef(name string) (bulkColumnMeta, bool) {
	raw := strings.TrimSpace(name)
	if strings.Contains(raw, ".") {
		parts := strings.SplitN(raw, ".", 2)
		table := normalizeBulkColumnName(parts[0])
		col := normalizeBulkColumnName(parts[1])
		if table == "product" {
			table = "products"
		}
		if table == "product_variant" {
			table = "product_variants"
		}
		for _, d := range productBulkColumnDefs {
			if d.Table == table && d.Name == col {
				return d, true
			}
		}
		return bulkColumnMeta{}, false
	}

	n := normalizeBulkColumnName(raw)
	var productMatch, variantMatch *bulkColumnMeta
	for i := range productBulkColumnDefs {
		d := productBulkColumnDefs[i]
		if d.Name != n {
			continue
		}
		if d.Table == "products" {
			cp := d
			productMatch = &cp
		} else {
			cp := d
			variantMatch = &cp
		}
	}
	if variantMatch != nil && productMatch == nil {
		return *variantMatch, true
	}
	if productMatch != nil && variantMatch == nil {
		return *productMatch, true
	}
	if variantMatch != nil && productMatch != nil {
		// Ambiguous (e.g. is_active): prefer product_variants for bulk price/stock style updates
		variantPreferred := map[string]bool{
			"is_active": true, "stock": true, "purchase_cost": true, "std_sales_price": true,
			"lead_time": true, "sku": true, "barcode": true, "color": true, "size": true,
		}
		if variantPreferred[n] {
			return *variantMatch, true
		}
		return *productMatch, true
	}
	return bulkColumnMeta{}, false
}

// GetProductBulkUpdateColumns lists updatable columns for bulk Excel upload reference.
func GetProductBulkUpdateColumns(c *fiber.Ctx) error {
	products := make([]bulkColumnMeta, 0)
	variants := make([]bulkColumnMeta, 0)
	for _, d := range productBulkColumnDefs {
		if d.Table == "products" {
			products = append(products, d)
		} else {
			variants = append(variants, d)
		}
	}
	return c.JSON(fiber.Map{
		"products":          products,
		"product_variants":  variants,
		"default_column":    "std_sales_price",
		"excel_format_note": "Row 1: code | <column_name>. Row 2+: product code | new value.",
	})
}

func parseBulkColumnValue(def bulkColumnMeta, raw string) (interface{}, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, fmt.Errorf("empty value")
	}
	switch def.Type {
	case "string":
		return raw, nil
	case "int":
		v, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid integer: %s", raw)
		}
		return int(v), nil
	case "float":
		v, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid number: %s", raw)
		}
		return v, nil
	case "uint":
		v, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || v == 0 {
			return nil, fmt.Errorf("invalid id: %s", raw)
		}
		return uint(v), nil
	case "bool":
		lower := strings.ToLower(raw)
		switch lower {
		case "true", "1", "yes", "active", "y":
			return true, nil
		case "false", "0", "no", "inactive", "n":
			return false, nil
		default:
			return nil, fmt.Errorf("invalid boolean (use true/false or yes/no): %s", raw)
		}
	default:
		return raw, nil
	}
}

func interfaceToJSONValue(v interface{}) interface{} {
	if v == nil {
		return nil
	}
	switch x := v.(type) {
	case *uint:
		if x == nil {
			return nil
		}
		return *x
	default:
		return v
	}
}

func getProductFieldOld(p *models.Product, col string) interface{} {
	switch col {
	case "name":
		return p.Name
	case "category_id":
		return p.CategoryID
	case "subcategory_id":
		return p.SubcategoryID
	case "unit_id":
		return p.UnitID
	case "store_id":
		return p.StoreID
	case "tax_id":
		return p.TaxID
	case "tag_id":
		return p.TagID
	case "importance":
		return p.Importance
	case "hsn_sac_code":
		return p.HsnSacCode
	case "product_mode":
		return p.ProductMode
	case "gst_percent":
		return p.GstPercent
	case "description":
		return p.Description
	case "internal_notes":
		return p.InternalNotes
	case "std_code":
		return p.StdCode
	case "minimum_stock":
		return p.MinimumStock
	case "moq":
		return p.Moq
	case "product_type":
		return p.ProductType
	case "is_active":
		return p.IsActive
	default:
		return nil
	}
}

func getVariantFieldOld(v *models.ProductVariant, col string) interface{} {
	switch col {
	case "color":
		return v.Color
	case "size":
		return v.Size
	case "sku":
		return v.SKU
	case "barcode":
		return v.Barcode
	case "purchase_cost":
		return v.PurchaseCost
	case "std_sales_price":
		return v.StdSalesPrice
	case "stock":
		return v.Stock
	case "lead_time":
		return v.LeadTime
	case "is_active":
		return v.IsActive
	default:
		return nil
	}
}

func setProductField(p *models.Product, col string, val interface{}) {
	switch col {
	case "name":
		p.Name = val.(string)
	case "category_id":
		if val == nil {
			p.CategoryID = nil
		} else {
			u := val.(uint)
			p.CategoryID = &u
		}
	case "subcategory_id":
		if val == nil {
			p.SubcategoryID = nil
		} else {
			u := val.(uint)
			p.SubcategoryID = &u
		}
	case "unit_id":
		if val == nil {
			p.UnitID = nil
		} else {
			u := val.(uint)
			p.UnitID = &u
		}
	case "store_id":
		if val == nil {
			p.StoreID = nil
		} else {
			u := val.(uint)
			p.StoreID = &u
		}
	case "tax_id":
		if val == nil {
			p.TaxID = nil
		} else {
			u := val.(uint)
			p.TaxID = &u
		}
	case "tag_id":
		if val == nil {
			p.TagID = nil
		} else {
			u := val.(uint)
			p.TagID = &u
		}
	case "importance":
		p.Importance = val.(string)
	case "hsn_sac_code":
		p.HsnSacCode = val.(string)
	case "product_mode":
		p.ProductMode = val.(string)
	case "gst_percent":
		p.GstPercent = val.(float64)
	case "description":
		p.Description = val.(string)
	case "internal_notes":
		p.InternalNotes = val.(string)
	case "std_code":
		p.StdCode = val.(string)
	case "minimum_stock":
		p.MinimumStock = val.(int)
	case "moq":
		p.Moq = val.(int)
	case "product_type":
		p.ProductType = val.(string)
	case "is_active":
		p.IsActive = val.(bool)
	}
}

func setVariantField(v *models.ProductVariant, col string, val interface{}) {
	switch col {
	case "color":
		v.Color = val.(string)
	case "size":
		v.Size = val.(string)
	case "sku":
		v.SKU = val.(string)
	case "barcode":
		v.Barcode = val.(string)
	case "purchase_cost":
		v.PurchaseCost = val.(float64)
	case "std_sales_price":
		v.StdSalesPrice = val.(float64)
	case "stock":
		v.Stock = val.(int)
	case "lead_time":
		v.LeadTime = val.(int)
	case "is_active":
		v.IsActive = val.(bool)
	}
}

// BulkUpdateProductColumn updates one column for many products identified by code.
func BulkUpdateProductColumn(c *fiber.Ctx) error {
	var req bulkColumnUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON body"})
	}
	colName := normalizeBulkColumnName(req.Column)
	if colName == "" {
		return c.Status(400).JSON(fiber.Map{"error": "column is required"})
	}
	if colName == "code" {
		return c.Status(400).JSON(fiber.Map{"error": "cannot bulk-update code column (use code to identify rows)"})
	}
	def, ok := findBulkColumnDef(colName)
	if !ok {
		return c.Status(400).JSON(fiber.Map{"error": "column not allowed for bulk update", "column": colName})
	}
	if len(req.Rows) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "no rows to process"})
	}

	logs := make([]bulkUpdateLogEntry, 0, len(req.Rows))
	successCount := 0
	errorCount := 0

	for i, row := range req.Rows {
		rowNum := i + 2 // Excel row (1-based header + data)
		code := strings.TrimSpace(row.Code)
		if code == "" {
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: "code is required",
			})
			continue
		}

		parsed, err := parseBulkColumnValue(def, row.Value)
		if err != nil {
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: err.Error(),
			})
			continue
		}

		var product models.Product
		if err := productsDB.Where("code = ?", code).First(&product).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				errorCount++
				logs = append(logs, bulkUpdateLogEntry{
					Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
					Message: "product code not found",
				})
				continue
			}
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: err.Error(),
			})
			continue
		}

		if def.Table == "products" {
			oldVal := getProductFieldOld(&product, colName)
			setProductField(&product, colName, parsed)
			if err := productsDB.Save(&product).Error; err != nil {
				errorCount++
				logs = append(logs, bulkUpdateLogEntry{
					Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
					Message: err.Error(),
				})
				continue
			}
			successCount++
			recordBulkColumnAudit(c, def.Table, product.ID, code, colName, interfaceToJSONValue(oldVal), parsed)
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "success", Column: colName, Table: def.Table,
				Changes: map[string]bulkChangeDetail{
					colName: {Old: interfaceToJSONValue(oldVal), New: parsed},
				},
			})
			continue
		}

		// product_variants — update all variants for this product
		var variants []models.ProductVariant
		if err := productsDB.Where("product_id = ?", product.ID).Find(&variants).Error; err != nil {
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: err.Error(),
			})
			continue
		}
		if len(variants) == 0 {
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: "product has no variants",
			})
			continue
		}

		oldVal := getVariantFieldOld(&variants[0], colName)
		saveErr := ""
		for j := range variants {
			setVariantField(&variants[j], colName, parsed)
			if err := productsDB.Save(&variants[j]).Error; err != nil {
				saveErr = err.Error()
				break
			}
		}
		if saveErr != "" {
			errorCount++
			logs = append(logs, bulkUpdateLogEntry{
				Row: rowNum, Code: code, Status: "error", Column: colName, Table: def.Table,
				Message: saveErr,
			})
			continue
		}
		successCount++
		recordBulkColumnAudit(c, def.Table, product.ID, code, colName, interfaceToJSONValue(oldVal), parsed)
		logs = append(logs, bulkUpdateLogEntry{
			Row: rowNum, Code: code, Status: "success", Column: colName, Table: def.Table,
			Message: fmt.Sprintf("updated %d variant(s)", len(variants)),
			Changes: map[string]bulkChangeDetail{
				colName: {Old: interfaceToJSONValue(oldVal), New: parsed},
			},
		})
	}

	report := fiber.Map{
		"type":         "bulk_column_update",
		"column":       colName,
		"table":        def.Table,
		"totalRows":    len(req.Rows),
		"successCount": successCount,
		"errorCount":   errorCount,
		"logs":         logs,
	}
	// Also expose errors/successes arrays for existing import report UI compatibility
	errors := make([]fiber.Map, 0)
	successes := make([]fiber.Map, 0)
	for _, e := range logs {
		if e.Status == "success" {
			successes = append(successes, fiber.Map{
				"row": e.Row, "code": e.Code, "action": fmt.Sprintf("Updated %s", e.Column),
				"changes": e.Changes,
			})
		} else if e.Status == "error" {
			errors = append(errors, fiber.Map{
				"row": e.Row, "code": e.Code,
				"errors": []string{e.Message},
			})
		}
	}
	report["errors"] = errors
	report["successes"] = successes

	return c.JSON(report)
}
