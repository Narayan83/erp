package main

import (
	"log"

	"erp.local/backend/initializers"
	"erp.local/backend/models"
)

func init() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
}

func main() {

	// Categories
	cat := models.Category{Name: "Electronics"}
	initializers.DB.Create(&cat)

	// Subcategories
	subcat := models.Subcategory{Name: "Mobile Phones", CategoryID: cat.ID}
	initializers.DB.Create(&subcat)

	// Units
	unit := models.Unit{Name: "Piece"}
	initializers.DB.Create(&unit)

	// Stores
	store := models.Store{Name: "Main Warehouse"}
	initializers.DB.Create(&store)

	// Taxes
	tax := models.Tax{Name: "GST 18%", Percentage: 18.0}
	initializers.DB.Create(&tax)

	// Tags
	tag1 := models.Tag{Name: "New Arrival"}
	tag2 := models.Tag{Name: "Popular"}
	initializers.DB.Create(&tag1)
	initializers.DB.Create(&tag2)

	// Products
	product := models.Product{
		Name:          "iPhone 15",
		Code:          "IP15-2025",
		CategoryID:    &cat.ID,
		SubcategoryID: &subcat.ID,
		UnitID:        &unit.ID,
		StoreID:       &store.ID,
		TaxID:         &tax.ID,
		Importance:    "High",
		HsnSacCode:    "8517",
		GstPercent:    18.0,
		Description:   "Latest iPhone 15 with A18 chip",
		InternalNotes: "High demand, priority stock",
		StdCode:       "IP15",
		MinimumStock:  10,
		Tags:          []models.Tag{tag1, tag2}, // Many-to-many
	}
	initializers.DB.Create(&product)

	variant1 := models.ProductVariant{
		ProductID:     product.ID,
		Color:         "Black",
		Size:          "128GB",
		SKU:           "IP15-BLK-128",
		Barcode:       "1111111111",
		PurchaseCost:  60000.00,
		StdSalesPrice: 79999.00,
		Stock:         50,
		LeadTime:      3,
		Images:        models.StringArray{"ip15_black_1.png", "ip15_black_2.png"},
	}
	variant2 := models.ProductVariant{
		ProductID:     product.ID,
		Color:         "Silver",
		Size:          "256GB",
		SKU:           "IP15-SLV-256",
		Barcode:       "2222222222",
		PurchaseCost:  65000.00,
		StdSalesPrice: 84999.00,
		Stock:         30,
		LeadTime:      5,
		Images:        models.StringArray{"ip15_black_1.png", "ip15_black_2.png"},
	}

	initializers.DB.Create(&variant1)
	initializers.DB.Create(&variant2)

	log.Println("✅ Seed data inserted successfully.")

}
