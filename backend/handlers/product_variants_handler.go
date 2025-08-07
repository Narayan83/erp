package handler

import (
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
	{
		var item models.ProductVariant
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := product_variantsDB.Create(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
}

func UpdateProduct_variant(c *fiber.Ctx) error {
	{
		id := c.Params("id")
		var item models.ProductVariant
		if err := product_variantsDB.First(&item, id).Error; err != nil {
			{
				return c.Status(404).JSON(fiber.Map{"error": "Not found"})
			}
		}
		if err := c.BodyParser(&item); err != nil {
			{
				return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
			}
		}
		if err := product_variantsDB.Save(&item).Error; err != nil {
			{
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}
		return c.JSON(item)
	}
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
