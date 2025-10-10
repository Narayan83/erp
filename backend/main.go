package main

import (
	"fmt"
	"log"

	handler "erp.local/backend/handlers"
	"erp.local/backend/initializers"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func init() {

	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()

}

// func welcome(c *fiber.Ctx) error {
// 	return c.SendString("Welcome to app")
// }

func main() {
	fmt.Println("Hello welcome, main is runnings")

	// Set DB in handlers
	handler.SetcategoriesDB(initializers.DB)
	handler.SetsubcategoriesDB(initializers.DB)
	handler.SettagsDB(initializers.DB)
	handler.SetunitsDB(initializers.DB)
	handler.SettaxesDB(initializers.DB)
	handler.SetstoresDB(initializers.DB)
	handler.SetbanksDB(initializers.DB)
	handler.SetproductsDB(initializers.DB)
	handler.Setproduct_variantsDB(initializers.DB)
	handler.SetUsersDB(initializers.DB)
	handler.SetQuotationDB(initializers.DB)
	handler.SetHSNDB(initializers.DB)
	handler.SetSizeDB(initializers.DB)
	handler.SetLeadsDB(initializers.DB)
	handler.SetRolesDB(initializers.DB)
	// Initialize role-management DB used by role permission handlers
	handler.SetRolesManagementDB(initializers.DB)
	handler.SetMenusDB(initializers.DB)
	handler.SetQuotationTableDB(initializers.DB)
	handler.SetAddressesDB(initializers.DB)
	handler.SetTandcDB(initializers.DB)

	// set up fiber
	app := fiber.New()

	// Enable CORS
	app.Use(cors.New())

	//ADDING STATIC LINKING TO IMAGE
	app.Static("/uploads", "./uploads")

	// setup all routes
	app.Get("/api", func(c *fiber.Ctx) error {
		return c.SendString("Welcome to the ERP API!")
	})

	// Routes for all tables

	// Categories
	api := app.Group("/api")
	api.Get("/categories", handler.GetAllCategorie)
	api.Get("/categories/:id", handler.GetCategorieByID)
	api.Post("/categories", handler.CreateCategorie)
	api.Put("/categories/:id", handler.UpdateCategorie)
	api.Delete("/categories/:id", handler.DeleteCategorie)
	api.Get("/categories-search/search", handler.SearchCategories)

	// sub category
	api.Get("/subcategories", handler.GetAllSubcategorie)
	api.Get("/subcategories/:id", handler.GetSubcategorieByID)
	api.Post("/subcategories", handler.CreateSubcategorie)
	api.Put("/subcategories/:id", handler.UpdateSubcategorie)
	api.Delete("/subcategories/:id", handler.DeleteSubcategorie)

	// Tags
	api.Get("/tags", handler.GetAllTag)
	api.Get("/tags/:id", handler.GetTagByID)
	api.Post("/tags", handler.CreateTag)
	api.Put("/tags/:id", handler.UpdateTag)
	api.Delete("/tags/:id", handler.DeleteTag)

	// units
	api.Get("/units", handler.GetAllUnit)
	api.Get("/units/:id", handler.GetUnitByID)
	api.Post("/units", handler.CreateUnit)
	api.Put("/units/:id", handler.UpdateUnit)
	api.Delete("/units/:id", handler.DeleteUnit)

	// Taxes
	api.Get("/taxes", handler.GetAllTaxes)
	api.Get("/taxes/:id", handler.GetTaxByID)
	api.Post("/taxes", handler.CreateTax)
	api.Put("/taxes/:id", handler.UpdateTax)
	api.Delete("/taxes/:id", handler.DeleteTax)

	// Stores
	api.Get("/stores", handler.GetAllStore)
	api.Get("/stores/:id", handler.GetStoreByID)
	api.Post("/stores", handler.CreateStore)
	api.Put("/stores/:id", handler.UpdateStore)
	api.Delete("/stores/:id", handler.DeleteStore)

	// Banks (bank master)
	api.Get("/banks/from-users", handler.GetBanksFromUsers)
	api.Get("/banks", handler.GetAllBanks)
	api.Get("/banks/:id", handler.GetBankByID)
	api.Post("/banks", handler.CreateBank)
	api.Put("/banks/:id", handler.UpdateBank)
	api.Delete("/banks/:id", handler.DeleteBank)

	// Products
	api.Post("/products", handler.CreateProduct)
	api.Get("/products", handler.GetAllProducts)
	api.Get("/products/:id", handler.GetProductByID)
	api.Put("/products/:id", handler.UpdateProduct)
	api.Get("/products/autocomplete", handler.GetProductAutocomplete)
	api.Post("/products/import", handler.ImportProducts)

	api.Get("/products/stats", handler.GetProductStats)

	// Product Variants
	api.Get("/product_variants", handler.GetAllProduct_variant)
	api.Get("/product_variants/:id", handler.GetProduct_variantByID)
	api.Post("/product_variants", handler.CreateProduct_variant)
	api.Put("/product_variants/:id", handler.UpdateProduct_variant)
	api.Delete("/product_variants/:id", handler.DeleteProduct_variant)

	// Users

	//users search
	api.Get("/users/roles/:role", handler.GetUsersByType)

	api.Get("/users", handler.GetAllUsers)
	api.Get("/users/:id", handler.GetUserByID)
	api.Post("/users", handler.CreateUser)
	api.Put("/users/:id", handler.UpdateUser)
	api.Delete("/users/:id", handler.DeleteUser)

	// Quotations
	// api.Get("/quotations", handler.GetAllQuotations)
	// api.Get("/quotations/:id", handler.GetQuotationByID)
	// api.Post("/quotations", handler.CreateQuotation)
	// api.Put("/quotations/:id", handler.UpdateQuotation)

	app.Post("/api/quotations", handler.CreateQuotationTable)
	app.Get("/api/quotations", handler.GetAllQuotationsTable)
	app.Get("/api/quotations/:id", handler.GetQuotationTable)
	app.Put("/api/quotations/:id", handler.UpdateQuotationTable)
	app.Delete("/api/quotations/:id", handler.DeleteQuotationTable)

	app.Get("/api/quotations/max-scp-count/:sales_credit_person_id", handler.GetMaxQuotationScpCount)

	//HsnCode

	api.Get("/hsncode", handler.GetAllHsnCode)
	api.Get("/hsncode/:id", handler.GetHsnCodeByID)
	api.Post("/hsncode", handler.CreateHsnCode)
	api.Put("/hsncode/:id", handler.UpdateHsnCode)
	api.Delete("/hsncode/:id", handler.DeleteHsnCode)
	api.Get("/hsncode-search", handler.SearchHsnCodes)

	// SIZES

	api.Get("/sizes", handler.GetAllSizes)
	api.Get("/sizes/:id", handler.GetSizeByID)
	api.Post("/sizes", handler.CreateSize)
	api.Put("/sizes/:id", handler.UpdateSize)
	api.Delete("/sizes/:id", handler.DeleteSize)
	api.Get("/sizes-search", handler.SearchSizes)

	//leads
	api.Get("/leads", handler.GetAllLeads)
	api.Get("/leads/:id", handler.GetLeadByID)
	api.Post("/leads", handler.CreateLead)
	api.Put("/leads/:id", handler.UpdateLead)
	api.Delete("/leads/:id", handler.DeleteLead)

	// menu
	api.Get("/loadMenus", handler.GetAllMenus)
	api.Get("/menus/:id", handler.GetMenuByID)
	api.Post("/menus", handler.CreateMenu)
	api.Put("/menus/:id", handler.UpdateMenu)
	api.Delete("/menus/:id", handler.DeleteMenu)
	// Additional menu routes (if needed)
	api.Get("/menus/tree", handler.GetMenuTree)
	api.Patch("/menus/reorder", handler.ReorderMenus)

	// role
	api.Get("/roles", handler.GetAllRoles)
	api.Get("/roles/:id", handler.GetRoleByID)
	api.Post("/roles", handler.CreateRole)
	api.Put("/roles/:id", handler.UpdateRole)
	api.Delete("/roles/:id", handler.DeleteRole)

	// Role permission management routes
	api.Get("/roles/:id/permissions", handler.GetRolePermissions)
	api.Get("/roles/:id/permissions/menu-tree", handler.GetRoleMenuTreeWithPermissions)
	api.Put("/roles/:id/permissions", handler.UpdateRolePermissions)
	api.Delete("/roles/:id/permissions", handler.ResetRolePermissions)

	api.Get("/user/:user_id", handler.GetUserRoles)
	api.Post("/user/:user_id/role/:role_id", handler.AssignRoleToUser)
	api.Delete("/user/:user_id/role/:role_id", handler.RemoveRoleFromUser)
	api.Get("/role/:role_id/users", handler.GetUsersByRole)
	api.Put("/user/:user_id", handler.UpdateUserRoles)

	// terms and conditions

	api.Get("/tandc", handler.GetAllTandc)
	api.Get("/tandc/:id", handler.GetTagByID)
	api.Post("/tandc", handler.CreateTandc)
	api.Put("/tandc/:id", handler.UpdateTandc)
	api.Delete("/tandc/:id", handler.DeleteTandc)

	// start server
	log.Fatal(app.Listen(":8000"))

}
