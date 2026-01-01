package handler

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var product_variantsDB *gorm.DB

func Setproduct_variantsDB(db *gorm.DB) {
	{
		product_variantsDB = db
	}
}

func GetAllProduct_variant(c *fiber.Ctx) error {
	{
		var items []models.ProductVariant
		if err := product_variantsDB.Find(&items).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(items)
	}
}

func GetProduct_variantByID(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.ProductVariant
		if err := product_variantsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		return c.JSON(item)
	}
}

func CreateProduct_variant(c *fiber.Ctx) error {
	// Support both JSON and multipart (with files)
	// If multipart, expect field 'variant' containing JSON and file(s) under 'images'
	form, _ := c.MultipartForm()
	var item models.ProductVariant
	if form != nil {
		// Multipart path
		raw := c.FormValue("variant")
		if raw == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Missing variant payload"})
		}
		if err := json.Unmarshal([]byte(raw), &item); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid variant JSON"})
		}
		// Save any uploaded files
		uploadDir := "uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.Mkdir(uploadDir, os.ModePerm); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload directory"})
			}
		}
		files := form.File["images"]
		for _, f := range files {
			savePath := filepath.Join("uploads", fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename))
			if err := c.SaveFile(f, savePath); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
			}
			item.Images = append(item.Images, savePath)
		}
	} else {
		// JSON body
		if err := c.BodyParser(&item); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}
	}
	// Normalize paths (ensure forward slashes)
	for i := range item.Images {
		item.Images[i] = filepath.ToSlash(item.Images[i])
	}
	if err := product_variantsDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(item)
}

func UpdateProduct_variant(c *fiber.Ctx) error {
	id := c.Params("id")
	var existing models.ProductVariant
	if err := product_variantsDB.First(&existing, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}

	form, _ := c.MultipartForm()
	if form != nil {
		// Multipart update
		raw := c.FormValue("variant")
		if raw == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Missing variant payload"})
		}
		var payload models.ProductVariant
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid variant JSON"})
		}

		// Merge fields from payload into existing
		existing.Color = payload.Color
		existing.Size = payload.Size
		existing.SKU = payload.SKU
		existing.Barcode = payload.Barcode
		existing.PurchaseCost = payload.PurchaseCost
		existing.StdSalesPrice = payload.StdSalesPrice
		existing.Stock = payload.Stock
		existing.LeadTime = payload.LeadTime
		existing.IsActive = payload.IsActive
		// Merge images: keep provided string paths (payload.Images), then add uploaded
		merged := make([]string, 0, len(payload.Images))
		merged = append(merged, payload.Images...)

		// Save any uploaded files
		uploadDir := "uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			if err := os.Mkdir(uploadDir, os.ModePerm); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload directory"})
			}
		}
		files := form.File["images"]
		for _, f := range files {
			savePath := filepath.Join("uploads", fmt.Sprintf("%d_%s", time.Now().UnixNano(), f.Filename))
			if err := c.SaveFile(f, savePath); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to save image"})
			}
			merged = append(merged, savePath)
		}
		// Normalize slashes
		for i := range merged {
			merged[i] = filepath.ToSlash(merged[i])
		}
		existing.Images = merged

		// Update main image metadata if provided
		existing.MainImage = payload.MainImage
		existing.MainImageIndex = payload.MainImageIndex

		if err := product_variantsDB.Save(&existing).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(existing)
	}

	// JSON update (no file upload)
	var payload models.ProductVariant
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	existing.Color = payload.Color
	existing.Size = payload.Size
	existing.SKU = payload.SKU
	existing.Barcode = payload.Barcode
	existing.PurchaseCost = payload.PurchaseCost
	existing.StdSalesPrice = payload.StdSalesPrice
	existing.Stock = payload.Stock
	existing.LeadTime = payload.LeadTime
	existing.IsActive = payload.IsActive
	// Replace Images if provided
	if payload.Images != nil {
		existing.Images = payload.Images
	}
	existing.MainImage = payload.MainImage
	existing.MainImageIndex = payload.MainImageIndex

	if err := product_variantsDB.Save(&existing).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(existing)
}

func DeleteProduct_variant(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		if err := product_variantsDB.Delete(&models.ProductVariant{}, id).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.SendStatus(204)
	}
}
