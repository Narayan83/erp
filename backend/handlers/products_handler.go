package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"sort"

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

	// Assign image paths to corresponding variant
	for i := range variants {
		if paths, ok := imagesMap[variants[i].SKU]; ok {
			variants[i].Images = paths
		}
	}

	// Attach variants to product
	product.Variants = variants
	product.CreatedAt = time.Now()

	if err := productsDB.Create(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
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

	// Sorting
	sortBy := c.Query("sort_by", "")
	sortOrder := c.Query("sort_order", "asc")
	// Only apply DB sorting for non-stock fields
	if sortBy != "" && sortBy != "stock" {
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

	// Add Stock field (sum of variant stocks) to each product
	type ProductWithStock struct {
		models.Product
		Stock int `json:"Stock"`
	}
	productsWithStock := make([]ProductWithStock, 0, len(allProducts))
	for _, p := range allProducts {
		stock := 0
		for _, v := range p.Variants {
			stock += v.Stock
		}
		productsWithStock = append(productsWithStock, ProductWithStock{Product: p, Stock: stock})
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

	// In-memory sort for Stock
	if sortBy == "stock" {
		sort.Slice(productsWithStock, func(i, j int) bool {
			if sortOrder == "desc" {
				return productsWithStock[i].Stock > productsWithStock[j].Stock
			}
			return productsWithStock[i].Stock < productsWithStock[j].Stock
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
		Name          string                  `json:"name"`
		Code          string                  `json:"code"`
		CategoryID    *uint                   `json:"categoryID"`
		SubcategoryID *uint                   `json:"subcategoryID"`
		UnitID        *uint                   `json:"unitID"`
		StoreID       *uint                   `json:"storeID"`
		TaxID         *uint                   `json:"taxID"`
		Importance    string                  `json:"importance"`
		ProductMode   string                  `json:"product_mode"`
		GstPercent    float64                 `json:"gstPercent"`
		HsnSacCode    string                  `json:"hsnSacCode"`
		Description   string                  `json:"description"`
		InternalNotes string                  `json:"internalNotes"`
		MinimumStock  int                     `json:"minimumStock"`
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

	// Update main product fields
	if err := productsDB.Model(&product).Updates(models.Product{
		Name:          req.Name,
		Code:          req.Code,
		CategoryID:    req.CategoryID,
		SubcategoryID: req.SubcategoryID,
		UnitID:        req.UnitID,
		StoreID:       req.StoreID,
		TaxID:         req.TaxID,
		Importance:    req.Importance,
		ProductMode:   req.ProductMode,
		GstPercent:    req.GstPercent,
		HsnSacCode:    req.HsnSacCode,
		Description:   req.Description,
		InternalNotes: req.InternalNotes,
		MinimumStock:  req.MinimumStock,
	}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update product"})
	}

	return c.JSON(product)
}
