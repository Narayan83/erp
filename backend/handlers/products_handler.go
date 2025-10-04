package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var productsDB *gorm.DB

func SetproductsDB(db *gorm.DB) {
	{
		productsDB = db
	}
}

// Handler: Create Product with Variants & Uploaded Images
func CreateProduct(c *fiber.Ctx) error {
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid multipart form"})
	}

	// Parse JSON fields
	productJson := c.FormValue("product")
	var product models.Product
	if err := json.Unmarshal([]byte(productJson), &product); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid product JSON"})
	}

	variantsJson := c.FormValue("variants")
	var variants []models.ProductVariant
	if err := json.Unmarshal([]byte(variantsJson), &variants); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid variants JSON"})
	}

	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		err := os.Mkdir(uploadDir, os.ModePerm)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload directory"})
		}
	}

	// Collect any pre-existing image references sent from the client (as strings)
	// Client appends many 'variant_images' JSON blobs like { sku, image }
	// We'll gather them into a map and merge below with uploaded files.
	existingImagesMap := make(map[string][]string) // map[variantSKU][]imagePath
	for key, vals := range form.Value {
		if key == "variant_images" {
			for _, raw := range vals {
				var vi struct {
					SKU   string `json:"sku"`
					Image string `json:"image"`
				}
				if err := json.Unmarshal([]byte(raw), &vi); err == nil {
					if vi.SKU != "" && vi.Image != "" {
						existingImagesMap[vi.SKU] = append(existingImagesMap[vi.SKU], vi.Image)
					}
				}
			}
		}
	}

	// Process uploaded images for each variant
	imagesMap := make(map[string][]string) // map[variantSKU][]imagePath
	for key, files := range form.File {
		if len(files) > 0 && len(key) > 7 && key[:7] == "images_" {
			variantKey := key[7:] // e.g. sku
			for _, file := range files {
				savePath := filepath.Join("uploads", fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename))
				if err := c.SaveFile(file, savePath); err != nil {
					return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
				}
				imagesMap[variantKey] = append(imagesMap[variantKey], savePath)
			}
		}
	}

	// Assign image paths to corresponding variant (merge existing + newly uploaded)
	for i := range variants {
		sku := variants[i].SKU
		var merged []string
		if ex, ok := existingImagesMap[sku]; ok {
			merged = append(merged, ex...)
		}
		if up, ok := imagesMap[sku]; ok {
			merged = append(merged, up...)
		}
		if len(merged) > 0 {
			variants[i].Images = merged
		}
	}

	// Attach variants to product
	product.Variants = variants
	product.CreatedAt = time.Now()

	// Defensive: ensure any client-supplied IDs are cleared so DB can assign them.
	// This prevents INSERTs that try to use explicit primary key values which
	// can lead to duplicate key violations if sequences are out of sync.
	product.ID = 0
	for i := range product.Variants {
		product.Variants[i].ID = 0
		product.Variants[i].ProductID = 0
	}

	// Pre-check SKUs to avoid unique constraint DB errors
	var skusToCheck []string
	for _, v := range variants {
		s := strings.TrimSpace(v.SKU)
		if s != "" {
			skusToCheck = append(skusToCheck, s)
		}
	}
	if len(skusToCheck) > 0 {
		var existingSkus []string
		if err := productsDB.Model(&models.ProductVariant{}).Where("sku IN ?", skusToCheck).Pluck("sku", &existingSkus).Error; err == nil && len(existingSkus) > 0 {
			return c.Status(409).JSON(fiber.Map{"error": "duplicate_skus", "skus": existingSkus})
		}
	}

	if err := productsDB.Create(&product).Error; err != nil {
		// Detect common Postgres duplicate key / sequence-out-of-sync scenarios
		errStr := err.Error()
		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "SQLSTATE 23505") || strings.Contains(errStr, "products_pkey") {
			return c.Status(409).JSON(fiber.Map{"error": "duplicate_key", "message": errStr})
		}
		return c.Status(500).JSON(fiber.Map{"error": errStr})
	}

	return c.JSON(product)
}

// Get All
func GetAllProducts(c *fiber.Ctx) error {
	// Pagination params
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Filters
	query := productsDB.
		Preload("Category").Preload("Subcategory").Preload("Unit").Preload("Store").
		Preload("Tax").Preload("Tags").Preload("Variants")

	fmt.Printf("GetAllProducts called with filters: name=%s, category_id=%s, subcategory_id=%s, store_id=%s, code=%s\n",
		c.Query("name"), c.Query("category_id"), c.Query("subcategory_id"), c.Query("store_id"), c.Query("code"))

	if name := c.Query("name"); name != "" {
		query = query.Where("name ILIKE ?", "%"+name+"%")
	}
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if SubcategoryID := c.Query("subcategory_id"); SubcategoryID != "" {
		query = query.Where("subcategory_id = ?", SubcategoryID)
	}
	if storeID := c.Query("store_id"); storeID != "" {
		query = query.Where("store_id = ?", storeID)
	}
	if code := c.Query("code"); code != "" {
		query = query.Where("code ILIKE ?", "%"+code+"%")
	}
	if moq := c.Query("moq"); moq != "" {
		query = query.Where("moq = ?", moq)
	}
	if note := c.Query("note"); note != "" {
		query = query.Where("internal_notes ILIKE ?", "%"+note+"%")
	}
	if productType := c.Query("product_type"); productType != "" {
		query = query.Where("product_type ILIKE ?", "%"+productType+"%")
	}
	if productMode := c.Query("product_mode"); productMode != "" {
		query = query.Where("product_mode ILIKE ?", "%"+productMode+"%")
	}
	if status := c.Query("status"); status != "" {
		if status == "true" {
			query = query.Where("is_active = ?", true)
		} else if status == "false" {
			query = query.Where("is_active = ?", false)
		}
	}
	if importance := c.Query("importance"); importance != "" {
		query = query.Where("importance = ?", importance)
	}

	// Sorting
	sortBy := c.Query("sort_by", "")
	sortOrder := c.Query("sort_order", "asc")
	// Only apply DB sorting for non-in-memory fields
	if sortBy != "" && sortBy != "stock" && sortBy != "leadTime" && sortBy != "note" && sortBy != "purchaseCost" && sortBy != "salesPrice" {
		orderStr := sortBy
		if sortOrder == "desc" {
			orderStr += " desc"
		} else {
			orderStr += " asc"
		}
		query = query.Order(orderStr)
	}

	// Fetch ALL products matching DB filters first, without pagination
	var allProducts []models.Product
	if err := query.Find(&allProducts).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	fmt.Printf("GetAllProducts: Found %d products in database\n", len(allProducts))

	// Calculate total cost from all variants
	totalCost := 0.0
	for _, p := range allProducts {
		for _, v := range p.Variants {
			totalCost += v.PurchaseCost * float64(v.Stock)
		}
	}

	// Add Stock field (sum of variant stocks) to each product
	type ProductWithStock struct {
		models.Product
		Stock       int    `json:"Stock"`
		MOQ         int    `json:"MOQ"`
		LeadTime    int    `json:"LeadTime"`
		Note        string `json:"Note"`
		ProductType string `json:"ProductType"`
	}
	productsWithStock := make([]ProductWithStock, 0, len(allProducts))
	for _, p := range allProducts {
		stock := 0
		leadTime := 0
		if len(p.Variants) > 0 {
			leadTime = p.Variants[0].LeadTime // take from first variant
		}
		for _, v := range p.Variants {
			stock += v.Stock
		}
		productsWithStock = append(productsWithStock, ProductWithStock{
			Product:     p,
			Stock:       stock,
			MOQ:         p.Moq,
			LeadTime:    leadTime,
			Note:        p.InternalNotes,
			ProductType: p.ProductType,
		})
	}

	// In-memory filtering for stock
	if stockQuery := c.Query("stock"); stockQuery != "" {
		stockFilterVal, err := strconv.Atoi(stockQuery)
		if err == nil {
			filtered := make([]ProductWithStock, 0)
			for _, p := range productsWithStock {
				if p.Stock == stockFilterVal {
					filtered = append(filtered, p)
				}
			}
			productsWithStock = filtered
		}
	}

	// In-memory filtering for moq
	if moqQuery := c.Query("moq"); moqQuery != "" {
		moqFilterVal, err := strconv.Atoi(moqQuery)
		if err == nil {
			filtered := make([]ProductWithStock, 0)
			for _, p := range productsWithStock {
				if p.MOQ == moqFilterVal {
					filtered = append(filtered, p)
				}
			}
			productsWithStock = filtered
		}
	}

	// In-memory filtering for lead_time
	if leadTimeQuery := c.Query("lead_time"); leadTimeQuery != "" {
		leadTimeFilterVal, err := strconv.Atoi(leadTimeQuery)
		if err == nil {
			filtered := make([]ProductWithStock, 0)
			for _, p := range productsWithStock {
				if p.LeadTime == leadTimeFilterVal {
					filtered = append(filtered, p)
				}
			}
			productsWithStock = filtered
		}
	}

	// In-memory filtering for note
	if noteQuery := c.Query("note"); noteQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			if strings.Contains(strings.ToLower(p.Note), strings.ToLower(noteQuery)) {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}
	// In-memory filtering for product_type
	if productTypeQuery := c.Query("product_type"); productTypeQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			if strings.Contains(strings.ToLower(p.ProductType), strings.ToLower(productTypeQuery)) {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}

	// In-memory filtering for variant fields
	if colorQuery := c.Query("color"); colorQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			hasMatch := false
			for _, v := range p.Variants {
				if strings.Contains(strings.ToLower(v.Color), strings.ToLower(colorQuery)) {
					hasMatch = true
					break
				}
			}
			if hasMatch {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}

	if sizeQuery := c.Query("size"); sizeQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			hasMatch := false
			for _, v := range p.Variants {
				if strings.Contains(strings.ToLower(v.Size), strings.ToLower(sizeQuery)) {
					hasMatch = true
					break
				}
			}
			if hasMatch {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}

	if skuQuery := c.Query("sku"); skuQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			hasMatch := false
			for _, v := range p.Variants {
				if strings.Contains(strings.ToLower(v.SKU), strings.ToLower(skuQuery)) {
					hasMatch = true
					break
				}
			}
			if hasMatch {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}

	if barcodeQuery := c.Query("barcode"); barcodeQuery != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			hasMatch := false
			for _, v := range p.Variants {
				if strings.Contains(strings.ToLower(v.Barcode), strings.ToLower(barcodeQuery)) {
					hasMatch = true
					break
				}
			}
			if hasMatch {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
	}

	if purchaseCostQuery := c.Query("purchase_cost"); purchaseCostQuery != "" {
		purchaseCostFilterVal, err := strconv.ParseFloat(purchaseCostQuery, 64)
		if err == nil {
			filtered := make([]ProductWithStock, 0)
			for _, p := range productsWithStock {
				hasMatch := false
				for _, v := range p.Variants {
					if v.PurchaseCost == purchaseCostFilterVal {
						hasMatch = true
						break
					}
				}
				if hasMatch {
					filtered = append(filtered, p)
				}
			}
			productsWithStock = filtered
		}
	}

	if salesPriceQuery := c.Query("sales_price"); salesPriceQuery != "" {
		salesPriceFilterVal, err := strconv.ParseFloat(salesPriceQuery, 64)
		if err == nil {
			filtered := make([]ProductWithStock, 0)
			for _, p := range productsWithStock {
				hasMatch := false
				for _, v := range p.Variants {
					if v.StdSalesPrice == salesPriceFilterVal {
						hasMatch = true
						break
					}
				}
				if hasMatch {
					filtered = append(filtered, p)
				}
			}
			productsWithStock = filtered
		}
	}

	// In-memory sort for Stock
	if sortBy == "stock" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			if sortOrder == "desc" {
				return productsWithStock[i].Stock > productsWithStock[j].Stock
			}
			return productsWithStock[i].Stock < productsWithStock[j].Stock
		})
	}

	// In-memory sort for LeadTime
	if sortBy == "leadTime" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			if sortOrder == "desc" {
				return productsWithStock[i].LeadTime > productsWithStock[j].LeadTime
			}
			return productsWithStock[i].LeadTime < productsWithStock[j].LeadTime
		})
	}

	// In-memory sort for Note
	if sortBy == "note" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			if sortOrder == "desc" {
				return productsWithStock[i].Note > productsWithStock[j].Note
			}
			return productsWithStock[i].Note < productsWithStock[j].Note
		})
	}
	// In-memory sort for ProductType
	if sortBy == "productType" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			if sortOrder == "desc" {
				return productsWithStock[i].ProductType > productsWithStock[j].ProductType
			}
			return productsWithStock[i].ProductType < productsWithStock[j].ProductType
		})
	}

	// In-memory sort for PurchaseCost (use minimum purchase cost from variants)
	if sortBy == "purchaseCost" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			// Get minimum purchase cost from variants for product i
			minCostI := 0.0
			if len(productsWithStock[i].Variants) > 0 {
				minCostI = productsWithStock[i].Variants[0].PurchaseCost
				for _, v := range productsWithStock[i].Variants {
					if v.PurchaseCost < minCostI {
						minCostI = v.PurchaseCost
					}
				}
			}

			// Get minimum purchase cost from variants for product j
			minCostJ := 0.0
			if len(productsWithStock[j].Variants) > 0 {
				minCostJ = productsWithStock[j].Variants[0].PurchaseCost
				for _, v := range productsWithStock[j].Variants {
					if v.PurchaseCost < minCostJ {
						minCostJ = v.PurchaseCost
					}
				}
			}

			if sortOrder == "desc" {
				return minCostI > minCostJ
			}
			return minCostI < minCostJ
		})
	}

	// In-memory sort for SalesPrice (use minimum sales price from variants)
	if sortBy == "salesPrice" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			// Get minimum sales price from variants for product i
			minPriceI := 0.0
			if len(productsWithStock[i].Variants) > 0 {
				minPriceI = productsWithStock[i].Variants[0].StdSalesPrice
				for _, v := range productsWithStock[i].Variants {
					if v.StdSalesPrice < minPriceI {
						minPriceI = v.StdSalesPrice
					}
				}
			}

			// Get minimum sales price from variants for product j
			minPriceJ := 0.0
			if len(productsWithStock[j].Variants) > 0 {
				minPriceJ = productsWithStock[j].Variants[0].StdSalesPrice
				for _, v := range productsWithStock[j].Variants {
					if v.StdSalesPrice < minPriceJ {
						minPriceJ = v.StdSalesPrice
					}
				}
			}

			if sortOrder == "desc" {
				return minPriceI > minPriceJ
			}
			return minPriceI < minPriceJ
		})
	}

	// Now apply pagination
	total := int64(len(productsWithStock))
	end := offset + limit
	if end > int(total) {
		end = int(total)
	}

	var paginatedProducts []ProductWithStock
	if offset < int(total) {
		paginatedProducts = productsWithStock[offset:end]
	}

	return c.JSON(fiber.Map{
		"data":       paginatedProducts,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
		"totalCost":  totalCost,
	})
}

// Handler: Get autocomplete suggestions for product fields
func GetProductAutocomplete(c *fiber.Ctx) error {
	field := c.Query("field")
	query := c.Query("query")
	limit := c.QueryInt("limit", 10)

	if field == "" || query == "" {
		return c.Status(400).JSON(fiber.Map{"error": "field and query parameters are required"})
	}

	if limit < 1 || limit > 50 {
		limit = 10
	}

	var results []string

	switch field {
	case "names":
		var products []models.Product
		if err := productsDB.Select("DISTINCT name").
			Where("name ILIKE ?", "%"+query+"%").
			Limit(limit).
			Find(&products).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, p := range products {
			if p.Name != "" {
				results = append(results, p.Name)
			}
		}

	case "codes":
		var products []models.Product
		if err := productsDB.Select("DISTINCT code").
			Where("code ILIKE ?", "%"+query+"%").
			Limit(limit).
			Find(&products).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, p := range products {
			if p.Code != "" {
				results = append(results, p.Code)
			}
		}

	case "stocks":
		var distinctStocks []int
		if err := productsDB.Table("product_variants").
			Select("DISTINCT stock").
			Where("stock::text ILIKE ?", "%"+query+"%").
			Limit(limit).
			Pluck("stock", &distinctStocks).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, stock := range distinctStocks {
			results = append(results, strconv.Itoa(stock))
		}

	case "moqs":
		var distinctMoqs []int
		if err := productsDB.Select("DISTINCT moq").
			Where("moq::text ILIKE ?", "%"+query+"%").
			Limit(limit).
			Pluck("moq", &distinctMoqs).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, moq := range distinctMoqs {
			results = append(results, strconv.Itoa(moq))
		}

	case "leadTimes":
		var distinctLeadTimes []int
		if err := productsDB.Table("product_variants").
			Select("DISTINCT lead_time").
			Where("lead_time::text ILIKE ?", "%"+query+"%").
			Limit(limit).
			Pluck("lead_time", &distinctLeadTimes).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, leadTime := range distinctLeadTimes {
			results = append(results, strconv.Itoa(leadTime))
		}

	case "notes":
		var products []models.Product
		if err := productsDB.Select("DISTINCT internal_notes").
			Where("internal_notes ILIKE ?", "%"+query+"%").
			Limit(limit).
			Find(&products).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		for _, p := range products {
			if p.InternalNotes != "" {
				results = append(results, p.InternalNotes)
			}
		}

	default:
		return c.Status(400).JSON(fiber.Map{"error": "Invalid field parameter"})
	}

	return c.JSON(fiber.Map{
		"data": results,
	})
}

// Get One
func GetProductByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	err := productsDB.Preload("Category").Preload("Subcategory").Preload("Unit").Preload("Store").
		Preload("Tax").Preload("Tags").Preload("Variants").First(&product, id).Error
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}

	return c.JSON(product)
}

// Update Product
func UpdateProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	type Request struct {
		Name          string                  `json:"Name"`
		Code          string                  `json:"Code"`
		CategoryID    *uint                   `json:"CategoryID"`
		SubcategoryID *uint                   `json:"SubcategoryID"`
		UnitID        *uint                   `json:"UnitID"`
		StoreID       *uint                   `json:"StoreID"`
		TaxID         *uint                   `json:"TaxID"`
		Importance    string                  `json:"Importance"`
		ProductMode   string                  `json:"ProductMode"`
		ProductType   string                  `json:"ProductType"`
		IsActive      bool                    `json:"IsActive"`
		GstPercent    float64                 `json:"GstPercent"`
		HsnSacCode    string                  `json:"HsnSacCode"`
		Description   string                  `json:"Description"`
		InternalNotes string                  `json:"InternalNotes"`
		MinimumStock  int                     `json:"MinimumStock"`
		Moq           int                     `json:"moq"`
		TagIDs        []uint                  `json:"tagIDs"`
		Variants      []models.ProductVariant `json:"variants"`
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	var product models.Product
	if err := productsDB.Preload("Variants").Preload("Tags").First(&product, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	// Update main product fields using map to ensure boolean fields like IsActive are updated even when false
	updateData := map[string]interface{}{
		"Name":          req.Name,
		"Code":          req.Code,
		"CategoryID":    req.CategoryID,
		"SubcategoryID": req.SubcategoryID,
		"UnitID":        req.UnitID,
		"StoreID":       req.StoreID,
		"TaxID":         req.TaxID,
		"Importance":    req.Importance,
		"ProductMode":   req.ProductMode,
		"ProductType":   req.ProductType,
		"IsActive":      req.IsActive,
		"GstPercent":    req.GstPercent,
		"HsnSacCode":    req.HsnSacCode,
		"Description":   req.Description,
		"InternalNotes": req.InternalNotes,
		"MinimumStock":  req.MinimumStock,
		"Moq":           req.Moq,
	}

	if err := productsDB.Model(&product).Updates(updateData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update product"})
	}

	// Fetch the updated product to return
	var updatedProduct models.Product
	if err := productsDB.Preload("Variants").Preload("Tags").First(&updatedProduct, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch updated product"})
	}

	return c.JSON(updatedProduct)

}

// Stats

// Get stats: total products and total cost
func GetProductStats(c *fiber.Ctx) error {
	var totalProducts int64
	var totalCost float64

	// Count products
	if err := productsDB.Model(&models.Product{}).Count(&totalProducts).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Calculate total cost (sum of PurchaseCost * Stock from all variants)
	if err := productsDB.Model(&models.ProductVariant{}).
		Select("COALESCE(SUM(purchase_cost * stock), 0)").
		Scan(&totalCost).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"total_products": totalProducts,
		"total_cost":     totalCost,
	})
}

// Handler: Import Products from Excel
func ImportProducts(c *fiber.Ctx) error {
	body := c.Body()
	fmt.Println("Raw request body:", string(body)) // Debug log

	var importData []map[string]interface{}

	// Try to parse as JSON first (from request body)
	if err := c.BodyParser(&importData); err != nil {
		fmt.Println("BodyParser error:", err) // Debug log
		// If that fails, try form data (legacy support)
		jsonDataStr := c.FormValue("jsonData")
		fmt.Println("Received jsonDataStr:", jsonDataStr) // Debug log

		if jsonDataStr == "" {
			return c.Status(400).JSON(fiber.Map{"error": "No JSON data provided"})
		}

		if err := json.Unmarshal([]byte(jsonDataStr), &importData); err != nil {
			fmt.Println("JSON unmarshal error:", err) // Debug log
			return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON data: " + err.Error()})
		}
	} else {
		fmt.Println("Successfully parsed JSON from body") // Debug log
	}

	fmt.Println("Parsed import data length:", len(importData)) // Debug log
	if len(importData) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No data to import"})
	}

	fmt.Println("First row sample:", importData[0]) // Debug log

	var importedCount int
	var errors []string

	// Process each row with individual transactions
	for i, row := range importData {
		rowNum := i + 1

		// Skip empty rows
		if row["Name"] == nil || row["Name"] == "" {
			continue
		}

		fmt.Printf("Processing row %d: Name=%s, Code=%s\n", rowNum, getStringValue(row["Name"]), getStringValue(row["Code"]))

		// Start a transaction for this row
		tx := productsDB.Begin()

		// Get basic product data
		name := getStringValue(row["Name"])
		code := getStringValue(row["Code"])
		hsnCode := getStringValue(row["HSN Code"])
		importance := getStringValue(row["Importance"])
		productType := getStringValue(row["Product Type"])
		minStock := getIntValue(row["Minimum Stock"])
		categoryName := getStringValue(row["Category"])
		subcategoryName := getStringValue(row["Subcategory"])
		unitName := getStringValue(row["Unit"])
		productMode := getStringValue(row["Product Mode"])
		moq := getIntValue(row["MOQ"])
		storeName := getStringValue(row["Store"])
		taxName := getStringValue(row["Tax"])
		gstPercent := getFloatValue(row["GST %"])
		description := getStringValue(row["Description"])
		internalNotes := getStringValue(row["Internal Notes"])
		status := getStringValue(row["Status"])

		// Get variant-specific data
		colorCode := getStringValue(row["Color Code"])
		size := getStringValue(row["Size"])
		sku := getStringValue(row["SKU"])
		barcode := getStringValue(row["Barcode"])
		purchaseCost := getFloatValue(row["Purchase Cost"])
		salesPrice := getFloatValue(row["Sales Price"])
		stock := getIntValue(row["Stock"])
		leadTime := getIntValue(row["Lead Time"])
		imagesStr := getStringValue(row["Images"])

		// Validate required fields
		if name == "" || code == "" {
			errors = append(errors, fmt.Sprintf("Row %d: Name and Code are required", rowNum))
			tx.Rollback() // Rollback this row's transaction
			continue
		}

		// Check if product with same code already exists
		var productExists models.Product
		if result := tx.Where("code = ?", code).First(&productExists); result.RowsAffected > 0 {
			errors = append(errors, fmt.Sprintf("Row %d: Product with code %s already exists", rowNum, code))
			tx.Rollback() // Rollback this row's transaction
			continue
		}

		// Create product with default values
		product := models.Product{
			Name:          name,
			Code:          code,
			HsnSacCode:    hsnCode,
			Importance:    importance,
			ProductType:   productType,
			MinimumStock:  minStock,
			ProductMode:   productMode,
			Moq:           moq,
			GstPercent:    gstPercent,
			Description:   description,
			InternalNotes: internalNotes,
			IsActive:      strings.ToLower(status) == "active" || status == "",
		}

		// Set default values
		if product.Importance == "" {
			product.Importance = "Normal"
		}
		if product.ProductType == "" {
			product.ProductType = "Single"
		}
		if product.ProductMode == "" {
			product.ProductMode = "Physical"
		}

		// Handle category
		if categoryName != "" {
			var category models.Category
			if err := tx.Where("name = ?", categoryName).First(&category).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					errors = append(errors, fmt.Sprintf("Row %d: Category '%s' not found", rowNum, categoryName))
					tx.Rollback()
					continue
				} else {
					errors = append(errors, fmt.Sprintf("Row %d: Error finding category %s: %v", rowNum, categoryName, err))
					tx.Rollback()
					continue
				}
			}
			product.CategoryID = &category.ID

			// Handle subcategory if category exists
			if subcategoryName != "" {
				var subcategory models.Subcategory
				if err := tx.Where("name = ? AND category_id = ?", subcategoryName, category.ID).First(&subcategory).Error; err != nil {
					if err == gorm.ErrRecordNotFound {
						errors = append(errors, fmt.Sprintf("Row %d: Subcategory '%s' not found in category '%s'", rowNum, subcategoryName, categoryName))
						tx.Rollback()
						continue
					} else {
						errors = append(errors, fmt.Sprintf("Row %d: Error finding subcategory %s: %v", rowNum, subcategoryName, err))
						tx.Rollback()
						continue
					}
				}
				product.SubcategoryID = &subcategory.ID
			}
		}

		// Handle unit
		if unitName != "" {
			var unit models.Unit
			if err := tx.Where("name = ?", unitName).First(&unit).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					errors = append(errors, fmt.Sprintf("Row %d: Unit '%s' not found", rowNum, unitName))
					tx.Rollback()
					continue
				} else {
					errors = append(errors, fmt.Sprintf("Row %d: Error finding unit %s: %v", rowNum, unitName, err))
					tx.Rollback()
					continue
				}
			}
			product.UnitID = &unit.ID
		}

		// Handle store
		if storeName != "" {
			var store models.Store
			if err := tx.Where("name = ?", storeName).First(&store).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					errors = append(errors, fmt.Sprintf("Row %d: Store '%s' not found", rowNum, storeName))
					tx.Rollback()
					continue
				} else {
					errors = append(errors, fmt.Sprintf("Row %d: Error finding store %s: %v", rowNum, storeName, err))
					tx.Rollback()
					continue
				}
			}
			product.StoreID = &store.ID
		}

		// Handle tax
		if taxName != "" {
			var tax models.Tax
			if err := tx.Where("name = ?", taxName).First(&tax).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					errors = append(errors, fmt.Sprintf("Row %d: Tax '%s' not found", rowNum, taxName))
					tx.Rollback()
					continue
				} else {
					errors = append(errors, fmt.Sprintf("Row %d: Error finding tax %s: %v", rowNum, taxName, err))
					tx.Rollback()
					continue
				}
			}
			product.TaxID = &tax.ID
		}

		// Create the product
		if err := tx.Create(&product).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to create product: %v", rowNum, err))
			tx.Rollback()
			continue
		}

		// Parse images if provided
		var images models.StringArray
		if imagesStr != "" {
			for _, img := range strings.Split(imagesStr, ";") {
				if img = strings.TrimSpace(img); img != "" {
					images = append(images, img)
				}
			}
		}

		// Create product variant
		variant := models.ProductVariant{
			ProductID:     product.ID,
			Color:         colorCode,
			Size:          size,
			SKU:           sku,
			Barcode:       barcode,
			PurchaseCost:  purchaseCost,
			StdSalesPrice: salesPrice,
			Stock:         stock,
			LeadTime:      leadTime,
			Images:        images,
			IsActive:      product.IsActive,
		}

		// Create the variant
		if err := tx.Create(&variant).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to create product variant: %v", rowNum, err))
			tx.Rollback()
			continue
		}

		// Commit this row's transaction
		if err := tx.Commit().Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to commit transaction: %v", rowNum, err))
			continue
		}

		importedCount++
	}

	return c.Status(200).JSON(fiber.Map{
		"message":  "Products imported successfully",
		"imported": importedCount,
		"errors":   errors,
	})
}

func getStringValue(val interface{}) string {
	if val == nil {
		return ""
	}
	if str, ok := val.(string); ok {
		return str
	}
	return ""
}

func getIntValue(val interface{}) int {
	if val == nil {
		return 0
	}
	if num, ok := val.(int); ok {
		return num
	}
	if num, ok := val.(float64); ok {
		return int(num)
	}
	if str, ok := val.(string); ok {
		if str == "" {
			return 0
		}
		if num, err := strconv.Atoi(str); err == nil {
			return num
		}
	}
	return 0
}

func getFloatValue(val interface{}) float64 {
	if val == nil {
		return 0.0
	}
	if num, ok := val.(float64); ok {
		return num
	}
	if str, ok := val.(string); ok {
		if str == "" {
			return 0.0
		}
		if num, err := strconv.ParseFloat(str, 64); err == nil {
			return num
		}
	}
	return 0.0
}

func getBoolValue(val interface{}) bool {
	if val == nil {
		return true
	}
	if b, ok := val.(bool); ok {
		return b
	}
	if str, ok := val.(string); ok {
		return strings.ToLower(str) == "active"
	}
	return true
}
