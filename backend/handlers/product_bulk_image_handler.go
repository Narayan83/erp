package handler

import (
	"strconv"
	"strings"

	"erp.local/backend/cloudinaryutil"
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
)

// GetProductCodes returns all product codes (for bulk image pre-validation).
func GetProductCodes(c *fiber.Ctx) error {
	var codes []string
	if err := productsDB.Model(&models.Product{}).Pluck("code", &codes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"codes": codes})
}

// BulkUploadProductImage accepts one image per request.
// Naming: {product_code}.jpg → main_image; {product_code}_1.jpg, _2, … → images (gallery) on all variants.
func BulkUploadProductImage(c *fiber.Ctx) error {
	productCode := strings.TrimSpace(c.FormValue("product_code"))
	if productCode == "" {
		return c.Status(400).JSON(fiber.Map{"error": "product_code is required"})
	}

	imageRole := strings.ToLower(strings.TrimSpace(c.FormValue("image_role")))
	if imageRole == "" {
		imageRole = "main"
	}
	if imageRole != "main" && imageRole != "gallery" {
		return c.Status(400).JSON(fiber.Map{"error": "image_role must be main or gallery"})
	}

	galleryIndex := -1
	if imageRole == "gallery" {
		if idxStr := strings.TrimSpace(c.FormValue("gallery_index")); idxStr != "" {
			idx, err := strconv.Atoi(idxStr)
			if err != nil || idx < 1 {
				return c.Status(400).JSON(fiber.Map{"error": "gallery_index must be a positive integer (e.g. 1 for _1)"})
			}
			galleryIndex = idx
		}
	}

	var product models.Product
	if err := productsDB.Where("code = ?", productCode).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":        "product_not_found",
			"product_code": productCode,
		})
	}
	productID := product.ID

	file, err := c.FormFile("image")
	if err != nil || file == nil {
		return c.Status(400).JSON(fiber.Map{"error": "image file is required"})
	}

	ext := strings.ToLower(cloudinaryutil.ResourceTypeForFile(file.Filename))
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
		_ = cloudinaryutil.DeleteFile(upResult.PublicID, "image")
		return c.Status(404).JSON(fiber.Map{
			"error":        "no_variants",
			"product_id":   productID,
			"product_code": productCode,
			"message":      "Product exists but has no variants",
		})
	}

	updated := 0
	for i := range variants {
		if imageRole == "main" {
			if variants[i].MainImage != "" && variants[i].MainImage != imageURL {
				cloudinaryutil.DeleteByURL(variants[i].MainImage)
			}
			variants[i].MainImage = imageURL
			mainIdx := 0
			variants[i].MainImageIndex = &mainIdx
		} else {
			imgs := append([]string(nil), variants[i].Images...)
			if galleryIndex >= 1 {
				slot := galleryIndex - 1
				if slot < len(imgs) {
					if imgs[slot] != "" && imgs[slot] != imageURL {
						cloudinaryutil.DeleteByURL(imgs[slot])
					}
					imgs[slot] = imageURL
				} else if slot == len(imgs) {
					imgs = append(imgs, imageURL)
				} else {
					// _N uploaded before lower slots: append (folder scan should order _1, _2, …)
					imgs = append(imgs, imageURL)
				}
			} else {
				imgs = append(imgs, imageURL)
			}
			variants[i].Images = models.StringArray(imgs)
		}

		if err := productsDB.Save(&variants[i]).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		updated++
	}

	return c.JSON(fiber.Map{
		"product_id":       productID,
		"product_code":     productCode,
		"image_role":       imageRole,
		"gallery_index":    galleryIndex,
		"image_path":       imageURL,
		"variants_updated": updated,
	})
}
