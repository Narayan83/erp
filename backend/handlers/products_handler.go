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

// httpError is used to return HTTP status aware errors from DB transaction closures
type httpError struct {
	Status int
	Msg    string
}

func (h *httpError) Error() string { return h.Msg }

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

	// Parse tagIDs from form data
	var tagIDs []uint
	if tagIDsJson := c.FormValue("tagIDs"); tagIDsJson != "" {
		if err := json.Unmarshal([]byte(tagIDsJson), &tagIDs); err != nil {
			fmt.Printf("Warning: Failed to parse tagIDs: %v\n", err)
			// Continue without tags rather than failing the entire request
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

	// Replace temporary SKUs with auto-generated ones and pre-check for duplicates
	var skusToCheck []string
	for i := range variants {
		s := strings.TrimSpace(variants[i].SKU)
		// Check if SKU is temporary (starts with TEMP_SKU_)
		if strings.HasPrefix(s, "TEMP_SKU_") || s == "" {
			// Generate a unique SKU
			variants[i].SKU = fmt.Sprintf("SKU-%d-%d", time.Now().UnixNano(), i)
		} else if s != "" {
			skusToCheck = append(skusToCheck, s)
		}
	}

	// Only check for duplicates if there are user-provided (non-temporary) SKUs
	if len(skusToCheck) > 0 {
		var existingSkus []string
		if err := productsDB.Model(&models.ProductVariant{}).Where("sku IN ?", skusToCheck).Pluck("sku", &existingSkus).Error; err == nil && len(existingSkus) > 0 {
			return c.Status(409).JSON(fiber.Map{"error": "duplicate_skus", "skus": existingSkus})
		}
	}

	if err := productsDB.Create(&product).Error; err != nil {
		// Detect common Postgres duplicate key / sequence-out-of-sync scenarios
		errStr := err.Error()
		fmt.Printf("Product creation error: %s\n", errStr)

		if strings.Contains(errStr, "duplicate key") || strings.Contains(errStr, "SQLSTATE 23505") || strings.Contains(errStr, "products_pkey") {
			fmt.Printf("Detected duplicate key error, attempting automatic sequence fix...\n")

			// Try to fix the sequence issue by resetting it to the max ID + 1
			var maxID uint
			if seqErr := productsDB.Model(&models.Product{}).Select("COALESCE(MAX(id), 0)").Scan(&maxID).Error; seqErr == nil {
				fmt.Printf("Current max product ID: %d\n", maxID)

				// Reset the sequence to max_id + 1
				resetQuery := fmt.Sprintf("SELECT setval('products_id_seq', %d, true)", maxID+1)
				if resetErr := productsDB.Exec(resetQuery).Error; resetErr == nil {
					fmt.Printf("Sequence reset successful, retrying product creation...\n")

					// Try the insert again after fixing the sequence
					if retryErr := productsDB.Create(&product).Error; retryErr == nil {
						fmt.Printf("Product creation successful after sequence fix!\n")
						// Associate tags after successful creation
						if len(tagIDs) > 0 {
							var tags []models.Tag
							if err := productsDB.Where("id IN ?", tagIDs).Find(&tags).Error; err == nil {
								productsDB.Model(&product).Association("Tags").Replace(tags)
							}
						}
						return c.JSON(product)
					} else {
						fmt.Printf("Product creation still failed after sequence fix: %s\n", retryErr.Error())
					}
				} else {
					fmt.Printf("Sequence reset failed: %s\n", resetErr.Error())
				}
			} else {
				fmt.Printf("Failed to get max ID: %s\n", seqErr.Error())
			}
			return c.Status(409).JSON(fiber.Map{"error": "duplicate_key", "message": errStr})
		}
		return c.Status(500).JSON(fiber.Map{"error": errStr})
	}

	// Associate tags with the product after successful creation
	if len(tagIDs) > 0 {
		var tags []models.Tag
		if err := productsDB.Where("id IN ?", tagIDs).Find(&tags).Error; err == nil {
			if err := productsDB.Model(&product).Association("Tags").Replace(tags); err != nil {
				fmt.Printf("Warning: Failed to associate tags: %v\n", err)
			}
		} else {
			fmt.Printf("Warning: Failed to fetch tags: %v\n", err)
		}
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
		MinStock    int    `json:"MinimumStock"`
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
			MinStock:    p.MinimumStock,
			MOQ:         p.Moq,
			LeadTime:    leadTime,
			Note:        p.InternalNotes,
			ProductType: p.ProductType,
		})
	}

	// Global filter: if provided, perform an in-memory OR search across multiple fields
	if globalFilter := c.Query("filter"); globalFilter != "" {
		lf := strings.ToLower(strings.TrimSpace(globalFilter))
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			matched := false

			// Product-level fields
			if strings.Contains(strings.ToLower(p.Name), lf) || strings.Contains(strings.ToLower(p.Code), lf) || strings.Contains(strings.ToLower(p.InternalNotes), lf) {
				matched = true
			}

			// Category/Subcategory/Store names (preloaded may be nil)
			if !matched {
				if p.Category.ID != 0 && strings.Contains(strings.ToLower(p.Category.Name), lf) {
					matched = true
				}
			}
			if !matched {
				if p.Subcategory.ID != 0 && strings.Contains(strings.ToLower(p.Subcategory.Name), lf) {
					matched = true
				}
			}
			if !matched {
				if p.Store.ID != 0 && strings.Contains(strings.ToLower(p.Store.Name), lf) {
					matched = true
				}
			}

			// Tags
			if !matched && len(p.Tags) > 0 {
				for _, t := range p.Tags {
					if strings.Contains(strings.ToLower(t.Name), lf) {
						matched = true
						break
					}
				}
			}

			// Variant-level fields
			if !matched && len(p.Variants) > 0 {
				for _, v := range p.Variants {
					if strings.Contains(strings.ToLower(v.SKU), lf) || strings.Contains(strings.ToLower(v.Barcode), lf) || strings.Contains(strings.ToLower(v.Color), lf) || strings.Contains(strings.ToLower(v.Size), lf) {
						matched = true
						break
					}
				}
			}

			if matched {
				filtered = append(filtered, p)
			}
		}
		productsWithStock = filtered
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

	// Stock filter based on stock vs minimum stock comparison
	if stockFilter := c.Query("stock_filter"); stockFilter != "" {
		filtered := make([]ProductWithStock, 0)
		for _, p := range productsWithStock {
			shouldInclude := false
			switch stockFilter {
			case "less_than_minimum_stock":
				// Stock is less than minimum stock (only include if minimum stock is set)
				if p.MinStock > 0 {
					shouldInclude = p.Stock < p.MinStock
				}
			case "greater_than_minimum_stock":
				// Stock is greater than or equal to minimum stock (only include if minimum stock is set)
				if p.MinStock > 0 {
					shouldInclude = p.Stock >= p.MinStock
				}
			}

			if shouldInclude {
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
		fmt.Printf("UpdateProduct: Failed to parse request body: %v\n", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "details": err.Error()})
	}

	fmt.Printf("UpdateProduct: Received request for product ID %s\n", id)
	fmt.Printf("UpdateProduct: Request data: %+v\n", req)

	var product models.Product
	if err := productsDB.Preload("Variants").Preload("Tags").First(&product, id).Error; err != nil {
		fmt.Printf("UpdateProduct: Product not found: %v\n", err)
		return c.Status(404).JSON(fiber.Map{"error": "Product not found"})
	}

	// Normalize nullable foreign keys: treat zero values as NULL so we don't violate FK constraints.
	// Helper to convert *uint -> interface{} where nil stays nil and 0 becomes nil as well.
	normalizeID := func(p *uint) interface{} {
		if p == nil {
			return nil
		}
		if *p == 0 {
			return nil
		}
		return *p
	}

	// Update main product fields using map to ensure boolean fields like IsActive are updated even when false
	updateData := map[string]interface{}{
		"Name":          req.Name,
		"Code":          req.Code,
		"CategoryID":    normalizeID(req.CategoryID),
		"SubcategoryID": normalizeID(req.SubcategoryID),
		"UnitID":        normalizeID(req.UnitID),
		"StoreID":       normalizeID(req.StoreID),
		"TaxID":         normalizeID(req.TaxID),
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

	fmt.Printf("UpdateProduct: Updating product with data: %+v\n", updateData)
	if err := productsDB.Model(&product).Updates(updateData).Error; err != nil {
		fmt.Printf("UpdateProduct: Database update failed: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update product", "details": err.Error()})
	}
	fmt.Printf("UpdateProduct: Product updated successfully\n")

	// Update tag associations if tagIDs are provided
	if req.TagIDs != nil {
		var tags []models.Tag
		if len(req.TagIDs) > 0 {
			if err := productsDB.Where("id IN ?", req.TagIDs).Find(&tags).Error; err != nil {
				fmt.Printf("Warning: Failed to fetch tags for update: %v\n", err)
			}
		}
		// Replace existing tag associations (empty slice will clear all tags)
		if err := productsDB.Model(&product).Association("Tags").Replace(tags); err != nil {
			fmt.Printf("Warning: Failed to update tag associations: %v\n", err)
		}
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
	fmt.Println("------- IMPORT REQUEST START -------")
	fmt.Println("Raw request body:", string(body)) // Debug log
	fmt.Println("------- IMPORT REQUEST END ---------")

	// Log request headers for debugging
	fmt.Println("Request headers:")
	c.Request().Header.VisitAll(func(key, value []byte) {
		fmt.Printf("  %s: %s\n", string(key), string(value))
	})

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

	// Detailed logging of the parsed data
	fmt.Println("------- PARSED IMPORT DATA START -------")
	for i, row := range importData {
		fmt.Printf("Row %d:\n", i+1)
		for k, v := range row {
			fmt.Printf("  %s: %v (type: %T)\n", k, v, v)
		}
	}
	fmt.Println("------- PARSED IMPORT DATA END ---------")

	// Make a simple copy of first row for debugging
	fmt.Println("First row sample:", importData[0]) // Debug log

	var importedCount int
	var errors []string

	// Process each row with individual transactions
	for i, row := range importData {
		rowNum := i + 1

		fmt.Printf("\n========== Processing Row %d ==========\n", rowNum)

		// Helper function to check if a field exists with flexible naming
		hasField := func(fieldName string) bool {
			// Try various formats
			fieldVariations := []string{
				fieldName,
				fieldName + " *",
				strings.ToLower(fieldName),
				strings.ToLower(fieldName) + " *",
			}
			for _, variation := range fieldVariations {
				if val, ok := row[variation]; ok && val != nil && val != "" {
					return true
				}
			}
			// Also check case-insensitive
			for k, v := range row {
				if strings.EqualFold(strings.ReplaceAll(k, " ", ""), strings.ReplaceAll(fieldName, " ", "")) {
					if v != nil && v != "" {
						return true
					}
				}
			}
			return false
		}

		// Skip empty rows - check more flexibly
		if !hasField("Name") {
			fmt.Printf("Row %d: Skipping - Name field is empty or not found\n", rowNum)
			continue
		}

		fmt.Printf("Row %d: Name field found, continuing with import\n", rowNum)

		// Start a transaction for this row
		tx := productsDB.Begin()

		// Helper function to get value by flexible field name
		getFieldValue := func(baseField string) interface{} {
			fieldVariations := []string{
				baseField,                               // Exact match
				baseField + " *",                        // With asterisk
				strings.ToLower(baseField),              // Lowercase
				strings.ToLower(baseField) + " *",       // Lowercase with asterisk
				strings.ToUpper(baseField),              // Uppercase
				strings.ToUpper(baseField) + " *",       // Uppercase with asterisk
				strings.ReplaceAll(baseField, " ", "_"), // With underscores
				strings.ReplaceAll(baseField, " ", ""),  // Without spaces
			}

			// For special cases like "HSN Code"
			if baseField == "HSN Code" {
				fieldVariations = append(fieldVariations,
					"HSNCode", "hsncode", "Hsn", "HSN", "hsn_code", "HSN_Code")
			}

			// Try each variation
			for _, field := range fieldVariations {
				if val, ok := row[field]; ok && val != nil {
					fmt.Printf("Found value for '%s' using variation '%s'\n", baseField, field)
					return val
				}
			}

			// If not found with direct match, try case-insensitive matching
			baseFieldLower := strings.ToLower(baseField)
			for k, v := range row {
				if strings.ToLower(k) == baseFieldLower ||
					strings.ToLower(strings.ReplaceAll(k, " ", "")) == strings.ToLower(strings.ReplaceAll(baseField, " ", "")) {
					fmt.Printf("Found value for '%s' using fuzzy match '%s'\n", baseField, k)
					return v
				}
			}

			fmt.Printf("No value found for field: '%s'\n", baseField)
			return nil
		}

		// Debug log the row keys
		fmt.Println("Row keys:")
		for k := range row {
			fmt.Printf("  - %s\n", k)
		}

		// Get basic product data
		name := getStringValue(getFieldValue("Name"))
		code := getStringValue(getFieldValue("Code"))
		hsnCode := getStringValue(getFieldValue("HSN Code"))
		importance := getStringValue(getFieldValue("Importance"))
		productType := getStringValue(getFieldValue("Product Type"))
		minStock := getIntValue(getFieldValue("Minimum Stock"))
		categoryName := getStringValue(getFieldValue("Category"))
		subcategoryName := getStringValue(getFieldValue("Subcategory"))
		unitName := getStringValue(getFieldValue("Unit"))
		productMode := getStringValue(getFieldValue("Product Mode"))
		moq := getIntValue(getFieldValue("MOQ"))
		storeName := getStringValue(getFieldValue("Store"))
		taxName := getStringValue(getFieldValue("Tax"))
		gstPercent := getFloatValue(getFieldValue("GST %"))
		description := getStringValue(getFieldValue("Description"))
		internalNotes := getStringValue(getFieldValue("Internal Notes"))
		status := getStringValue(getFieldValue("Status"))

		// Get variant-specific data
		colorCode := getStringValue(getFieldValue("Color Code"))
		size := getStringValue(getFieldValue("Size"))
		sku := getStringValue(getFieldValue("SKU"))
		barcode := getStringValue(getFieldValue("Barcode"))
		purchaseCost := getFloatValue(getFieldValue("Purchase Cost"))
		salesPrice := getFloatValue(getFieldValue("Sales Price"))
		stock := getIntValue(getFieldValue("Stock"))
		leadTime := getIntValue(getFieldValue("Lead Time"))
		imagesStr := getStringValue(getFieldValue("Images"))

		// Debug log the extracted values
		fmt.Printf("\n------ Extracted Field Values for Row %d ------\n", rowNum)
		fmt.Printf("  Name: '%s'\n", name)
		fmt.Printf("  Code: '%s'\n", code)
		fmt.Printf("  HSN Code: '%s'\n", hsnCode)
		fmt.Printf("  Category: '%s'\n", categoryName)
		fmt.Printf("  Subcategory: '%s'\n", subcategoryName)
		fmt.Printf("  Unit: '%s'\n", unitName)
		fmt.Printf("  Store: '%s'\n", storeName)
		fmt.Printf("  Size: '%s'\n", size)
		fmt.Printf("  Product Type: '%s'\n", productType)
		fmt.Printf("  Product Mode: '%s'\n", productMode)
		fmt.Printf("  Importance: '%s'\n", importance)
		fmt.Printf("  Status: '%s'\n", status)
		fmt.Printf("-----------------------------------------------\n\n")

		// Validate required fields
		if name == "" || code == "" {
			fmt.Printf("Row %d: Validation failed - Name or Code is empty: Name='%s', Code='%s'\n", rowNum, name, code)
			errors = append(errors, fmt.Sprintf("Row %d: Name and Code are required", rowNum))
			tx.Rollback() // Rollback this row's transaction
			continue
		}

		// TEMPORARILY making validation less strict for debugging
		fmt.Printf("Row %d: VALIDATION - checking required fields\n", rowNum)
		fmt.Printf("  Name: '%s'\n", name)
		fmt.Printf("  Code: '%s'\n", code)
		fmt.Printf("  Category: '%s'\n", categoryName)
		fmt.Printf("  Unit: '%s'\n", unitName)
		fmt.Printf("  Size: '%s'\n", size)

		// Check for other required fields (with more flexible validation)
		requiredFields := []struct {
			name  string
			value string
			// TEMP: Make only Category required for testing
			required bool
		}{
			{"Category", categoryName, true},
			{"Unit", unitName, false}, // TEMPORARILY optional
			{"Size", size, false},     // TEMPORARILY optional
		}

		missingFields := []string{}
		for _, field := range requiredFields {
			if field.required && field.value == "" {
				missingFields = append(missingFields, field.name)
			}
		}

		if len(missingFields) > 0 {
			fmt.Printf("Row %d: Missing required fields: %s\n", rowNum, strings.Join(missingFields, ", "))
			errors = append(errors, fmt.Sprintf("Row %d: Missing required fields: %s", rowNum, strings.Join(missingFields, ", ")))
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

		// Handle category with case-insensitive lookup - Auto-create if not found
		if categoryName != "" {
			var category models.Category
			// Try case-insensitive match
			if err := tx.Where("LOWER(name) = LOWER(?)", categoryName).First(&category).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Category not found - create it automatically
					fmt.Printf("Row %d: Category '%s' not found, creating automatically\n", rowNum, categoryName)
					category = models.Category{
						Name: categoryName,
					}
					if createErr := tx.Create(&category).Error; createErr != nil {
						fmt.Printf("Row %d: Failed to auto-create category '%s': %v\n", rowNum, categoryName, createErr)
						errors = append(errors, fmt.Sprintf("Row %d: Failed to create category '%s': %v", rowNum, categoryName, createErr))
						tx.Rollback()
						continue
					}
					fmt.Printf("Row %d: Successfully created category '%s' with ID %d\n", rowNum, categoryName, category.ID)
				} else {
					// Database error
					fmt.Printf("Row %d: Category lookup error for '%s': %v\n", rowNum, categoryName, err)
					errors = append(errors, fmt.Sprintf("Row %d: Database error looking up category '%s': %v", rowNum, categoryName, err))
					tx.Rollback()
					continue
				}
			} else {
				fmt.Printf("Row %d: Category '%s' found with ID %d\n", rowNum, categoryName, category.ID)
			}
			product.CategoryID = &category.ID

			// Handle subcategory if category exists - Auto-create if not found
			if subcategoryName != "" {
				var subcategory models.Subcategory
				if err := tx.Where("LOWER(name) = LOWER(?) AND category_id = ?", subcategoryName, category.ID).First(&subcategory).Error; err != nil {
					if err == gorm.ErrRecordNotFound {
						// Subcategory not found - create it automatically
						fmt.Printf("Row %d: Subcategory '%s' not found in category '%s', creating automatically\n", rowNum, subcategoryName, categoryName)
						subcategory = models.Subcategory{
							Name:       subcategoryName,
							CategoryID: category.ID,
						}
						if createErr := tx.Create(&subcategory).Error; createErr != nil {
							fmt.Printf("Row %d: Failed to auto-create subcategory '%s': %v\n", rowNum, subcategoryName, createErr)
							errors = append(errors, fmt.Sprintf("Row %d: Failed to create subcategory '%s' in category '%s': %v", rowNum, subcategoryName, categoryName, createErr))
							tx.Rollback()
							continue
						}
						fmt.Printf("Row %d: Successfully created subcategory '%s' with ID %d in category '%s'\n", rowNum, subcategoryName, subcategory.ID, categoryName)
					} else {
						// Database error
						fmt.Printf("Row %d: Subcategory lookup error for '%s': %v\n", rowNum, subcategoryName, err)
						errors = append(errors, fmt.Sprintf("Row %d: Database error looking up subcategory '%s': %v", rowNum, subcategoryName, err))
						tx.Rollback()
						continue
					}
				} else {
					fmt.Printf("Row %d: Subcategory '%s' found with ID %d\n", rowNum, subcategoryName, subcategory.ID)
				}
				product.SubcategoryID = &subcategory.ID
			}
		}

		// Handle unit with case-insensitive lookup - Auto-create if not found
		if unitName != "" {
			var unit models.Unit
			// Try case-insensitive match
			if err := tx.Where("LOWER(name) = LOWER(?)", unitName).First(&unit).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Unit not found - create it automatically
					fmt.Printf("Row %d: Unit '%s' not found, creating automatically\n", rowNum, unitName)
					unit = models.Unit{
						Name: unitName,
					}
					if createErr := tx.Create(&unit).Error; createErr != nil {
						fmt.Printf("Row %d: Failed to auto-create unit '%s': %v\n", rowNum, unitName, createErr)
						errors = append(errors, fmt.Sprintf("Row %d: Failed to create unit '%s': %v", rowNum, unitName, createErr))
						tx.Rollback()
						continue
					}
					fmt.Printf("Row %d: Successfully created unit '%s' with ID %d\n", rowNum, unitName, unit.ID)
				} else {
					// Database error
					fmt.Printf("Row %d: Unit lookup error for '%s': %v\n", rowNum, unitName, err)
					errors = append(errors, fmt.Sprintf("Row %d: Database error looking up unit '%s': %v", rowNum, unitName, err))
					tx.Rollback()
					continue
				}
			} else {
				fmt.Printf("Row %d: Unit '%s' found with ID %d\n", rowNum, unitName, unit.ID)
			}
			product.UnitID = &unit.ID
		} // Handle store with case-insensitive lookup - Auto-create if not found
		if storeName != "" {
			var store models.Store
			// Try case-insensitive match
			if err := tx.Where("LOWER(name) = LOWER(?)", storeName).First(&store).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Store not found - create it automatically
					fmt.Printf("Row %d: Store '%s' not found, creating automatically\n", rowNum, storeName)
					store = models.Store{
						Name: storeName,
					}
					if createErr := tx.Create(&store).Error; createErr != nil {
						fmt.Printf("Row %d: Failed to auto-create store '%s': %v\n", rowNum, storeName, createErr)
						errors = append(errors, fmt.Sprintf("Row %d: Failed to create store '%s': %v", rowNum, storeName, createErr))
						tx.Rollback()
						continue
					}
					fmt.Printf("Row %d: Successfully created store '%s' with ID %d\n", rowNum, storeName, store.ID)
				} else {
					// Database error
					fmt.Printf("Row %d: Store lookup error for '%s': %v\n", rowNum, storeName, err)
					errors = append(errors, fmt.Sprintf("Row %d: Database error looking up store '%s': %v", rowNum, storeName, err))
					tx.Rollback()
					continue
				}
			} else {
				fmt.Printf("Row %d: Store '%s' found with ID %d\n", rowNum, storeName, store.ID)
			}
			product.StoreID = &store.ID
		} // Handle tax with case-insensitive lookup - Auto-create if not found
		if taxName != "" {
			var tax models.Tax
			if err := tx.Where("name = ?", taxName).First(&tax).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Tax not found - create it automatically
					fmt.Printf("Row %d: Tax '%s' not found, creating automatically\n", rowNum, taxName)

					// Use the GST % value if provided, otherwise default to 0
					taxPercentage := gstPercent
					if taxPercentage == 0 {
						fmt.Printf("Row %d: GST %% not provided or zero, using 0%% for tax '%s'\n", rowNum, taxName)
					}

					tax = models.Tax{
						Name:       taxName,
						Percentage: taxPercentage,
					}
					if createErr := tx.Create(&tax).Error; createErr != nil {
						fmt.Printf("Row %d: Failed to auto-create tax '%s': %v\n", rowNum, taxName, createErr)
						errors = append(errors, fmt.Sprintf("Row %d: Failed to create tax '%s': %v", rowNum, taxName, createErr))
						tx.Rollback()
						continue
					}
					fmt.Printf("Row %d: Successfully created tax '%s' with percentage %.2f%%\n", rowNum, taxName, taxPercentage)
				} else {
					// Database error
					fmt.Printf("Row %d: Tax lookup error for '%s': %v\n", rowNum, taxName, err)
					errors = append(errors, fmt.Sprintf("Row %d: Database error looking up tax '%s': %v", rowNum, taxName, err))
					tx.Rollback()
					continue
				}
			} else {
				fmt.Printf("Row %d: Tax '%s' found with ID %d\n", rowNum, taxName, tax.ID)
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

		// Handle size with case-insensitive lookup - Auto-create in Size master if not found
		if size != "" {
			var sizeModel models.Size
			// Try case-insensitive match on CODE field (since imported size goes to Code)
			if err := tx.Where("LOWER(code) = LOWER(?)", size).First(&sizeModel).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Size not found in master table - create it automatically
					fmt.Printf("Row %d: Size '%s' not found in master table, creating automatically\n", rowNum, size)

					// The imported value IS the code
					sizeCode := size

					// Check if code already exists (case-insensitive)
					var existingSize models.Size
					if tx.Where("LOWER(code) = LOWER(?)", sizeCode).First(&existingSize).Error == nil {
						// This should not happen since we just checked above, but be safe
						fmt.Printf("Row %d: Size code '%s' already exists after check\n", rowNum, sizeCode)
						errors = append(errors, fmt.Sprintf("Row %d: Size code '%s' already exists", rowNum, sizeCode))
						tx.Rollback()
						continue
					}

					// Create Size with the imported value as Code
					// Name and Description can be the same as Code, or set to a readable format
					sizeModel = models.Size{
						Name:        size, // Use the code as name as well
						Code:        size, // This is the main field - the imported value
						Description: size, // Use the code as description
					}
					if createErr := tx.Create(&sizeModel).Error; createErr != nil {
						fmt.Printf("Row %d: Failed to auto-create size '%s': %v\n", rowNum, size, createErr)
						errors = append(errors, fmt.Sprintf("Row %d: Failed to create size '%s': %v", rowNum, size, createErr))
						tx.Rollback()
						continue
					}
					fmt.Printf("Row %d: Successfully created size with code '%s' (ID: %d) in master table\n", rowNum, size, sizeModel.ID)
				} else {
					// Database error
					fmt.Printf("Row %d: Size lookup error for '%s': %v\n", rowNum, size, err)
					errors = append(errors, fmt.Sprintf("Row %d: Database error looking up size '%s': %v", rowNum, size, err))
					tx.Rollback()
					continue
				}
			} else {
				fmt.Printf("Row %d: Size code '%s' found in master table with ID %d\n", rowNum, size, sizeModel.ID)
			}
		}

		// Create product variant with additional validation
		if size == "" {
			fmt.Printf("Row %d: Size is required for variant creation\n", rowNum)
			// TEMPORARILY set a default size value to allow the import to continue for debugging
			size = "Default"
			fmt.Printf("Row %d: WARNING - Using default size value for debugging: %s\n", rowNum, size)
			// Don't fail the import for size issues temporarily
			//errors = append(errors, fmt.Sprintf("Row %d: Size is required for variant creation", rowNum))
			//tx.Rollback()
			//continue
		}

		// Generate a default SKU if not provided
		if sku == "" {
			sku = fmt.Sprintf("%s-%s", code, size)
			fmt.Printf("Row %d: Generated default SKU: %s\n", rowNum, sku)
		}

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

		// Debug log variant details
		fmt.Printf("Row %d: Creating variant: Size=%s, SKU=%s, Color=%s\n",
			rowNum, variant.Size, variant.SKU, variant.Color)

		// Create the variant
		if err := tx.Create(&variant).Error; err != nil {
			fmt.Printf("Row %d: Failed to create variant: %v\n", rowNum, err)
			errors = append(errors, fmt.Sprintf("Row %d: Failed to create product variant: %v", rowNum, err))
			tx.Rollback()
			continue
		}

		fmt.Printf("Row %d: Successfully created variant with ID %d\n", rowNum, variant.ID)

		// Commit this row's transaction
		if err := tx.Commit().Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to commit transaction: %v", rowNum, err))
			continue
		}

		importedCount++
	}

	fmt.Printf("Import complete: %d products imported, %d errors\n", importedCount, len(errors))

	if len(errors) > 0 {
		fmt.Println("Import errors:")
		for _, err := range errors {
			fmt.Printf("  - %s\n", err)
		}
	}

	// Create appropriate message based on import count
	var message string
	if importedCount > 0 {
		message = fmt.Sprintf("%d products imported successfully", importedCount)
	} else {
		message = "No products were imported"
	}

	return c.Status(200).JSON(fiber.Map{
		"message":  message,
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

// FixProductSequence manually resets the products sequence to fix duplicate key issues
func FixProductSequence(c *fiber.Ctx) error {
	// Get the maximum ID from the products table
	var maxID uint
	if err := productsDB.Model(&models.Product{}).Select("COALESCE(MAX(id), 0)").Scan(&maxID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get max product ID", "details": err.Error()})
	}

	// Reset the sequence to max_id + 1
	resetQuery := fmt.Sprintf("SELECT setval('products_id_seq', %d, true)", maxID+1)
	if err := productsDB.Exec(resetQuery).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to reset sequence", "details": err.Error()})
	}

	// Also reset product_variants sequence while we're at it
	var maxVariantID uint
	if err := productsDB.Model(&models.ProductVariant{}).Select("COALESCE(MAX(id), 0)").Scan(&maxVariantID).Error; err == nil {
		variantResetQuery := fmt.Sprintf("SELECT setval('product_variants_id_seq', %d, true)", maxVariantID+1)
		productsDB.Exec(variantResetQuery)
	}

	return c.JSON(fiber.Map{
		"message": "Sequences reset successfully",
		"details": map[string]interface{}{
			"products_max_id":     maxID,
			"products_next_value": maxID + 1,
			"variants_max_id":     maxVariantID,
			"variants_next_value": maxVariantID + 1,
		},
	})
}

func DeleteProduct(c *fiber.Ctx) error {
	id := c.Params("id")

	// Perform deletion in a transaction for safety
	txErr := productsDB.Transaction(func(tx *gorm.DB) error {
		// Pre-check: if product is referenced by transactional items, block deletion with a clear message
		var cnt int64
		if err := tx.Table("quotation_items").Where("product_id = ?", id).Count(&cnt).Error; err == nil && cnt > 0 {
			return &httpError{Status: 409, Msg: "This product is used in quotations. Please remove it from those quotations before deleting."}
		}
		cnt = 0
		if err := tx.Table("sales_order_items").Where("product_id = ?", id).Count(&cnt).Error; err == nil && cnt > 0 {
			return &httpError{Status: 409, Msg: "This product is used in sales orders. Please remove it from those sales orders before deleting."}
		}
		cnt = 0
		if err := tx.Table("purchase_order_items").Where("product_id = ?", id).Count(&cnt).Error; err == nil && cnt > 0 {
			return &httpError{Status: 409, Msg: "This product is used in purchase orders. Please remove it from those purchase orders before deleting."}
		}
		cnt = 0
		if err := tx.Table("leads").Where("product_id = ?", id).Count(&cnt).Error; err == nil && cnt > 0 {
			return &httpError{Status: 409, Msg: "This product is linked to leads. Please remove the product reference from those leads before deleting."}
		}

		// 1) Load variants to remove associated image files
		var variants []models.ProductVariant
		if err := tx.Where("product_id = ?", id).Find(&variants).Error; err != nil {
			return err
		}

		// 2) Delete image files for each variant if present
		for _, v := range variants {
			// v.Images stored as JSON array of paths
			for _, img := range v.Images {
				if strings.TrimSpace(img) == "" {
					continue
				}
				// Normalize backslashes and ensure local path
				p := strings.ReplaceAll(img, "\\", "/")
				// Only delete if file exists locally under uploads/
				if !strings.HasPrefix(strings.ToLower(p), "http://") && !strings.HasPrefix(strings.ToLower(p), "https://") && !strings.HasPrefix(strings.ToLower(p), "data:") {
					if _, err := os.Stat(p); err == nil {
						_ = os.Remove(p)
					} else {
						// Also try prefixed with ./ in case stored as relative without leading folder
						joined := filepath.Join("uploads", filepath.Base(p))
						if _, err2 := os.Stat(joined); err2 == nil {
							_ = os.Remove(joined)
						}
					}
				}
			}
			if v.MainImage != "" {
				p := strings.ReplaceAll(v.MainImage, "\\", "/")
				if !strings.HasPrefix(strings.ToLower(p), "http://") && !strings.HasPrefix(strings.ToLower(p), "https://") && !strings.HasPrefix(strings.ToLower(p), "data:") {
					if _, err := os.Stat(p); err == nil {
						_ = os.Remove(p)
					}
				}
			}
		}

		// 3) Explicitly delete variants (hard delete) and join table rows before deleting product
		if err := tx.Unscoped().Where("product_id = ?", id).Delete(&models.ProductVariant{}).Error; err != nil {
			return err
		}
		if err := tx.Exec("DELETE FROM product_tags WHERE product_id = ?", id).Error; err != nil {
			return err
		}

		// 4) Finally, hard delete the product
		if err := tx.Unscoped().Delete(&models.Product{}, id).Error; err != nil {
			return err
		}

		return nil
	})

	if txErr != nil {
		if he, ok := txErr.(*httpError); ok {
			return c.Status(he.Status).JSON(fiber.Map{"error": he.Msg})
		}
		return c.Status(500).JSON(fiber.Map{"error": txErr.Error()})
	}

	return c.JSON(fiber.Map{"message": "Product deleted successfully"})
}
