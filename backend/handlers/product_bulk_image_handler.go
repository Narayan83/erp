package handler

import (
	"strconv"
	"strings"

	"erp.local/backend/cloudinaryutil"
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
)

// GetProductIDs returns all product primary keys (for bulk image pre-validation).
func GetProductIDs(c *fiber.Ctx) error {
	var ids []uint
	if err := productsDB.Model(&models.Product{}).Pluck("id", &ids).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"ids": ids})
}

// BulkUploadProductImage accepts one image file named by product id (e.g. 1.jpg -> product_id=1).
// Updates all variants for that product with the saved image path.
func BulkUploadProductImage(c *fiber.Ctx) error {
	productIDStr := strings.TrimSpace(c.FormValue("product_id"))
	if productIDStr == "" {
		return c.Status(400).JSON(fiber.Map{"error": "product_id is required"})
	}
	productID64, err := strconv.ParseUint(productIDStr, 10, 64)
	if err != nil || productID64 == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "invalid product_id"})
	}
	productID := uint(productID64)

	var product models.Product
	if err := productsDB.First(&product, productID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":      "product_not_found",
			"product_id": productID,
		})
	}

	file, err := c.FormFile("image")
	if err != nil || file == nil {
		return c.Status(400).JSON(fiber.Map{"error": "image file is required"})
	}

	ext := strings.ToLower(cloudinaryutil.ResourceTypeForFile(file.Filename))
	// Only allow image files
	if ext != "image" {
		return c.Status(400).JSON(fiber.Map{"error": "unsupported image type"})
	}

	upResult, err := cloudinaryutil.UploadFile(file, "products", "image")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to upload image: " + err.Error()})
	}
	imageURL := upResult.SecureURL

	var variants []models.ProductVariant
	if err := productsDB.Where("product_id = ?", productID).Find(&variants).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if len(variants) == 0 {
		// Cleanup the uploaded image since there are no variants to assign it to
		_ = cloudinaryutil.DeleteFile(upResult.PublicID, "image")
		return c.Status(404).JSON(fiber.Map{
			"error":      "no_variants",
			"product_id": productID,
			"message":    "Product exists but has no variants",
		})
	}

	mainIdx := 0
	for i := range variants {
		// Delete old images from Cloudinary before replacing
		for _, oldURL := range variants[i].Images {
			cloudinaryutil.DeleteByURL(oldURL)
		}
		if variants[i].MainImage != "" {
			cloudinaryutil.DeleteByURL(variants[i].MainImage)
		}

		variants[i].Images = models.StringArray{imageURL}
		variants[i].MainImage = imageURL
		variants[i].MainImageIndex = &mainIdx
		if err := productsDB.Save(&variants[i]).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.JSON(fiber.Map{
		"product_id":       productID,
		"image_path":       imageURL,
		"variants_updated": len(variants),
	})
}
