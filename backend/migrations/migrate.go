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
	err := initializers.DB.AutoMigrate(
		&models.Category{},
		&models.Subcategory{},
		&models.Unit{},
		&models.Store{},
		&models.Tax{},
		&models.Tag{},
		&models.Product{},
		&models.ProductVariant{},
		&models.User{},
		&models.Quotation{},
		&models.QuotationItem{},
		&models.HsnCode{},
		&models.Size{},
		&models.Lead{},
		&models.EmployeeCustomer{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}
}
