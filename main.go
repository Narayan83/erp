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
	handler.SetUserBankDB(initializers.DB)
	handler.SetUserAddressDB(initializers.DB)
	handler.SetUserDocumentDB(initializers.DB)
	handler.SetproductsDB(initializers.DB)
	handler.Setproduct_variantsDB(initializers.DB)
	handler.SetUserDB(initializers.DB)
	handler.SetQuotationDB(initializers.DB)
	handler.SetHSNDB(initializers.DB)
	handler.SetSizeDB(initializers.DB)
	handler.SetLeadsDB(initializers.DB)
	handler.SetRolesDB(initializers.DB)
	// Initialize role-management DB used by role permission handlers
	handler.SetRolesManagementDB(initializers.DB)
	handler.SetMenusDB(initializers.DB)
	handler.SetQuotationTableDB(initializers.DB)

	handler.SetTandcDB(initializers.DB)
	handler.SetUserRelationDB(initializers.DB)
	handler.SetDepartmentDB(initializers.DB)
	handler.SetDepartmentRelationDB(initializers.DB)
	handler.SetEmployeeDB(initializers.DB)
	handler.SetEmployeeUserDB(initializers.DB)

	// set up fiber
	app := fiber.New()

	// Enable CORS
	app.Use(cors.New())

	//ADDING STATIC LINKING TO IMAGE
	app.Static("/uploads", "./uploads")

	// route registration flags for debug
	var routeStatus = struct {
		Login    bool `json:"/login_registered"`
		APILogin bool `json:"/api/login_registered"`
	}{}

	// Authentication (use debug wrapper to log incoming requests)
	//app.Post("/login", handler.LoginDebug)
	//routeStatus.Login = true

	// setup all routes
	app.Get("/api", func(c *fiber.Ctx) error {
		return c.SendString("Welcome to the ERP API!")
	})

	// Routes for all tables

	// Categories
	api := app.Group("/api")
	// Expose login under /api/login as well to match frontend calls
	// api.Post("/login", handler.LoginDebug)
	// routeStatus.APILogin = true

	// Simple GET test for /api/login to verify route is reachable
	api.Get("/login", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true, "message": "api login endpoint reachable"})
	})

	// Categories
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
	// api.Get("/banks/from-users", handler.GetBanksFromUsers)
	// api.Get("/banks", handler.GetAllBanks)
	// api.Get("/banks/:id", handler.GetBankByID)
	// api.Post("/banks", handler.CreateBank)
	// api.Put("/banks/:id", handler.UpdateBank)
	// api.Delete("/banks/:id", handler.DeleteBank)

	// Products
	api.Post("/products", handler.CreateProduct)
	api.Get("/products", handler.GetAllProducts)
	api.Get("/products/:id", handler.GetProductByID)
	// Soft delete (and restore) route for products
	api.Delete("/products/:id", handler.DeleteProduct)
	api.Put("/products/:id", handler.UpdateProduct)
	api.Get("/products/autocomplete", handler.GetProductAutocomplete)
	api.Post("/products/import", handler.ImportProducts)
	api.Post("/users/import", handler.ImportUsers)
	api.Post("/products/fix-sequence", handler.FixProductSequence)

	api.Get("/products/stats", handler.GetProductStats)

	// Product Variants
	api.Get("/product_variants", handler.GetAllProduct_variant)
	api.Get("/product_variants/:id", handler.GetProduct_variantByID)
	api.Post("/product_variants", handler.CreateProduct_variant)
	api.Put("/product_variants/:id", handler.UpdateProduct_variant)
	api.Delete("/product_variants/:id", handler.DeleteProduct_variant)

	// Users
	api.Post("/users", handler.CreateUser)
	api.Get("/users", handler.GetUsers)

	// Specific user routes (must come before /:id)
	api.Get("/users/unassigned", handler.GetUnassignedUsers)
	api.Put("/users/restore/:id", handler.RestoreUser)
	api.Delete("/users/force/:id", handler.ForceDeleteUser)

	// Single user routes (must come after specific paths)
	api.Get("/users/:id", handler.GetUser)
	api.Put("/users/:id", handler.UpdateUser)
	api.Delete("/users/:id", handler.DeleteUser)

	// user - addresses

	api.Post("/user-address", handler.CreateUserAddress)
	api.Get("/user-address", handler.GetUserAddresses)
	api.Get("/user-address/:id", handler.GetUserAddress)
	api.Put("/user-address/:id", handler.UpdateUserAddress)
	api.Delete("/user-address/:id", handler.DeleteUserAddress)

	//user-bank

	api.Post("/user-bank", handler.CreateUserBankAccount)
	api.Get("/user-bank", handler.GetUserBankAccounts)
	api.Get("/user-bank/:id", handler.GetUserBankAccount)
	api.Put("/user-bank/:id", handler.UpdateUserBankAccount)
	api.Delete("/user-bank/:id", handler.DeleteUserBankAccount)

	//user documents

	api.Post("/document", handler.CreateUserDocument)
	api.Get("/document", handler.GetUserDocuments)
	api.Get("/document/:id", handler.GetUserDocumentByID)
	api.Put("/document/:id", handler.UpdateUserDocument)
	api.Delete("/document/:id", handler.DeleteUserDocument)

	//users search
	// api.Get("/users/roles/:role", handler.GetUsersByType)

	// api.Get("/users", handler.GetAllUsers)
	// api.Get("/users/:id", handler.GetUserByID)
	// api.Post("/users", handler.CreateUser)
	// api.Put("/users/:id", handler.UpdateUser)
	// api.Delete("/users/:id", handler.DeleteUser)

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

	// Addresses (master + aggregated from users)
	// api.Get("/addresses/from-users", handler.GetAddressesFromUsers) // Must come before /:id route
	// api.Get("/addresses", handler.GetAllAddresses)
	// api.Get("/addresses/:id", handler.GetAddressByID)
	// api.Post("/addresses", handler.CreateAddress)
	// api.Put("/addresses/:id", handler.UpdateAddress)
	// api.Delete("/addresses/:id", handler.DeleteAddress)
	// api.Get("/addresses-search", handler.SearchAddresses)

	// Debug endpoint to inspect route registration (quick check for 404 troubleshooting)
	api.Get("/debug/routes", func(c *fiber.Ctx) error {
		return c.JSON(routeStatus)
	})

	// Hierarchical Users API (list & single)
	// Corrected: plural endpoint should return filtered list (supports parent_id/child_id query params)
	app.Get("/api/hierarchical-users", handler.GetUserRelations)
	app.Get("/api/hierarchical-users/:id", handler.GetUserRelation)
	app.Post("/api/hierarchical-users", handler.CreateUserRelation)
	app.Put("/api/hierarchical-users/:id", handler.UpdateUserRelation)
	app.Delete("/api/hierarchical-users/:id", handler.DeleteUserRelation)

	// Department
	app.Post("/departments", handler.CreateDepartment)
	app.Get("/departments", handler.GetDepartments)
	app.Get("/departments/:id", handler.GetDepartment)
	app.Put("/departments/:id", handler.UpdateDepartment)
	app.Delete("/departments/:id", handler.DeleteDepartment)

	// Employee
	app.Post("/api/employees", handler.CreateEmployee)
	app.Get("/api/employees", handler.GetEmployees)
	// Employees not department heads
	api.Get("/employees/non-heads", handler.GetNonHeadEmployees)

	// Employee-User assignment endpoints (must come before /:id routes)
	app.Post("/api/employees/assign-user", handler.AssignUserToEmployee)
	app.Delete("/api/employees/remove-user", handler.RemoveUserFromEmployee)
	app.Post("/api/employees/shift-users", handler.ShiftUsersToEmployee)
	app.Get("/api/employees/with-users", handler.GetEmployeesWithUsers)
	app.Get("/api/employees/without-users", handler.GetEmployeesWithoutUsers)
	app.Get("/api/employee-user-mappings", handler.GetAllEmployeeUserMappings)

	// Single employee routes (must come after specific paths)
	app.Get("/api/employees/:id", handler.GetEmployee)
	app.Get("/api/employees/:id/user", handler.GetEmployeeUser)
	app.Put("/api/employees/:id", handler.UpdateEmployee)
	app.Delete("/api/employees/:id", handler.DeleteEmployee) // Department Relations (Employees)
	app.Post("/departments/assign", handler.AssignEmployeeToDepartment)
	app.Get("/departments/:id/employees", handler.GetDepartmentEmployees)
	app.Delete("/departments/employee/:id", handler.RemoveEmployeeFromDepartment)

	// Log route registration status so startup logs show if login endpoints were registered
	fmt.Printf("Route registration: /login=%v, /api/login=%v\n", routeStatus.Login, routeStatus.APILogin)

	// start server
	log.Fatal(app.Listen(":8000"))

}
