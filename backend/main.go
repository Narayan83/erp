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
	// handler.SetQuotationDB(initializers.DB)
	handler.SetHSNDB(initializers.DB)
	handler.SetSizeDB(initializers.DB)
	handler.SetLeadsDB(initializers.DB)
	// Lead interactions and followups DB
	handler.SetLeadInteractionDB(initializers.DB)
	handler.SetLeadFollowupDB(initializers.DB)
	handler.SetRolesDB(initializers.DB)
	// Initialize role-management DB used by role permission handlers
	handler.SetRolesManagementDB(initializers.DB)
	handler.SetMenusDB(initializers.DB)
	handler.SetQuotationTableDB(initializers.DB)

	handler.SetTandcDB(initializers.DB)
	handler.SetUserRelationDB(initializers.DB)
	// handler.SetDepartmentDB(initializers.DB)
	// handler.SetDepartmentRelationDB(initializers.DB)
	// handler.SetEmployeeDB(initializers.DB)
	// handler.SetEmployeeUserDB(initializers.DB)
	handler.SetCompanyDB(initializers.DB)
	handler.SetCompanyBranchDB(initializers.DB)
	// Series master
	handler.SetSeriesDB(initializers.DB)
	handler.SetPrinterHeaderDB(initializers.DB)
	handler.SetIntegrationDB(initializers.DB)
	handler.SetQuotationTemplatesDB(initializers.DB)

	handler.SetDepartmentDB(initializers.DB)
	handler.SetDesignationDB(initializers.DB)
	handler.SetOrgUnitDB(initializers.DB)
	handler.SetEmployeeDB(initializers.DB)
	handler.SetEmployeeHierarchyDB(initializers.DB)
	handler.SetEmployeeOrgUnitDB(initializers.DB)

	// CRM/Leads Config
	handler.SetCRMTagDB(initializers.DB)
	handler.SetLeadSourceDB(initializers.DB)
	handler.SetRejectionReasonDB(initializers.DB)

	// set up fiber
	app := fiber.New()

	// Enable CORS (default)
	app.Use(cors.New())

	// Ensure CORS headers are present on ALL responses (including 304 responses from static files)
	app.Use(func(c *fiber.Ctx) error {
		// Handle preflight immediately
		if c.Method() == "OPTIONS" {
			c.Set("Access-Control-Allow-Origin", "*")
			c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
			c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			return c.SendStatus(fiber.StatusNoContent)
		}

		// Proceed to next handler
		err := c.Next()

		// Ensure the headers are always set on the response (covers static 304 responses)
		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		return err
	})

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
	// api.Get("/users/unassigned", handler.GetUnassignedUsers)
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

	app.Get("/api/quotations/count-scp/:series_id", handler.GetScpCountBySeriesID)
	app.Post("/api/quotations", handler.CreateQuotationTable)
	app.Get("/api/quotations", handler.GetAllQuotationsTable)
	app.Get("/api/quotations/:id", handler.GetQuotationTable)
	app.Put("/api/quotations/:id", handler.UpdateQuotationTable)
	app.Delete("/api/quotations/:id", handler.DeleteQuotationTable)

	// Quotation Templates
	api.Post("/quotation-templates", handler.CreateQuotationTemplate)
	api.Get("/quotation-templates", handler.GetAllQuotationTemplates)
	api.Get("/quotation-templates/:id", handler.GetQuotationTemplateByID)
	api.Delete("/quotation-templates/:id", handler.DeleteQuotationTemplate)

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
	api.Post("/leads/import", handler.ImportLeads)
	api.Put("/leads/:id", handler.UpdateLead)
	api.Delete("/leads/:id", handler.DeleteLead)

	// Lead - interactions tied to a specific lead
	api.Post("/leads/:id/interactions", handler.CreateLeadInteractionForLead)

	// Lead Interactions
	api.Post("/lead-interactions", handler.CreateLeadInteraction)
	api.Get("/lead-interactions", handler.GetLeadInteractions)
	api.Get("/lead-interactions/:id", handler.GetLeadInteraction)
	api.Put("/lead-interactions/:id", handler.UpdateLeadInteraction)
	api.Delete("/lead-interactions/:id", handler.DeleteLeadInteraction)

	// Lead Followups
	api.Post("/lead-followups", handler.CreateLeadFollowUp)
	api.Get("/lead-followups", handler.GetLeadFollowUps)
	api.Get("/lead-followups/:id", handler.GetLeadFollowUp)
	api.Put("/lead-followups/:id", handler.UpdateLeadFollowUp)
	api.Delete("/lead-followups/:id", handler.DeleteLeadFollowUp)

	// Lead Timeline
	api.Get("/lead/:id/timeline", handler.GetLeadTimeline)

	// Lead Sources
	api.Get("/lead-sources", handler.GetLeadSources)
	api.Get("/lead-sources/:id", handler.GetLeadSource)
	api.Post("/lead-sources", handler.CreateLeadSource)
	api.Put("/lead-sources/:id", handler.UpdateLeadSource)
	api.Delete("/lead-sources/:id", handler.DeleteLeadSource)

	// Rejection Reasons
	api.Post("/rejection-reasons", handler.CreateRejectionReason)
	api.Get("/rejection-reasons", handler.GetRejectionReasons)
	api.Get("/rejection-reasons/:id", handler.GetRejectionReason)
	api.Put("/rejection-reasons/:id", handler.UpdateRejectionReason)
	api.Delete("/rejection-reasons/:id", handler.DeleteRejectionReason)

	// CRM Tags
	api.Post("/crm-tags", handler.CreateCRMTag)
	api.Get("/crm-tags", handler.GetCRMTags)
	api.Get("/crm-tags/:id", handler.GetCRMTag)
	api.Put("/crm-tags/:id", handler.UpdateCRMTag)
	api.Delete("/crm-tags/:id", handler.DeleteCRMTag)

	// IndiaMART Integration
	api.Post("/indiamart/fetch-leads", handler.FetchIndiaMartLeads)

	// Printer Header
	api.Post("/printer-headers", handler.CreatePrinterHeader)
	api.Get("/printer-headers", handler.GetPrinterHeaders)
	api.Get("/printer-headers/:id", handler.GetPrinterHeader)
	api.Put("/printer-headers/:id", handler.UpdatePrinterHeader)
	api.Delete("/printer-headers/:id", handler.DeletePrinterHeader)

	// Integrations
	api.Post("/integrations", handler.CreateIntegration)
	api.Get("/integrations", handler.GetIntegrations)
	api.Get("/integrations/:id", handler.GetIntegration)
	api.Put("/integrations/:id", handler.UpdateIntegration)
	api.Delete("/integrations/:id", handler.DeleteIntegration)

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
	// app.Post("/departments", handler.CreateDepartment)
	// app.Get("/departments", handler.GetDepartments)
	// app.Get("/departments/:id", handler.GetDepartment)
	// app.Put("/departments/:id", handler.UpdateDepartment)
	// app.Delete("/departments/:id", handler.DeleteDepartment)

	// Employee
	// app.Post("/api/employees", handler.CreateEmployee)
	// app.Get("/api/employees", handler.GetEmployees)
	// // Employees not department heads
	// api.Get("/employees/non-heads", handler.GetNonHeadEmployees)

	// Employee-User assignment endpoints (must come before /:id routes)
	// app.Post("/api/employees/assign-user", handler.AssignUserToEmployee)
	// app.Delete("/api/employees/remove-user", handler.RemoveUserFromEmployee)
	// app.Post("/api/employees/shift-users", handler.ShiftUsersToEmployee)
	// app.Get("/api/employees/with-users", handler.GetEmployeesWithUsers)
	// app.Get("/api/employees/without-users", handler.GetEmployeesWithoutUsers)
	// app.Get("/api/employee-user-mappings", handler.GetAllEmployeeUserMappings)

	// Single employee routes (must come after specific paths)
	// app.Get("/api/employees/:id", handler.GetEmployee)
	// app.Get("/api/employees/:id/user", handler.GetEmployeeUser)
	// app.Put("/api/employees/:id", handler.UpdateEmployee)
	// app.Delete("/api/employees/:id", handler.DeleteEmployee) // Department Relations (Employees)
	// app.Post("/departments/assign", handler.AssignEmployeeToDepartment)
	// app.Get("/departments/:id/employees", handler.GetDepartmentEmployees)
	// app.Delete("/departments/employee/:id", handler.RemoveEmployeeFromDepartment)

	// Companies
	api.Get("/companies", handler.GetCompanies)
	api.Get("/companies/:id", handler.GetCompany)
	api.Post("/companies", handler.CreateCompany)
	api.Put("/companies/:id", handler.UpdateCompany)
	api.Delete("/companies/:id", handler.DeleteCompany)

	// Company Branches
	api.Get("/company-branches", handler.GetCompanyBranches)
	api.Get("/company-branches/:id", handler.GetCompanyBranch)
	api.Post("/company-branches", handler.CreateCompanyBranch)
	api.Put("/company-branches/:id", handler.UpdateCompanyBranch)
	api.Delete("/company-branches/:id", handler.DeleteCompanyBranch)

	// Company Branch Banks
	api.Get("/company-branch-banks", handler.GetCompanyBranchBanks)
	api.Post("/company-branch-banks", handler.CreateCompanyBranchBank)
	api.Put("/company-branch-banks/:id", handler.UpdateCompanyBranchBank)
	api.Delete("/company-branch-banks/:id", handler.DeleteCompanyBranchBank)

	// Series
	api.Get("/series", handler.GetSeriesList)
	api.Get("/series/:id", handler.GetSeries)
	api.Post("/series", handler.CreateSeries)
	api.Put("/series/:id", handler.UpdateSeries)
	api.Delete("/series/:id", handler.DeleteSeries)

	// Log route registration status so startup logs show if login endpoints were registered
	fmt.Printf("Route registration: /login=%v, /api/login=%v\n", routeStatus.Login, routeStatus.APILogin)

	// Departments
	api.Post("/departments", handler.CreateDepartment)
	api.Get("/departments", handler.GetDepartments)
	api.Get("/departments/:id", handler.GetDepartment)
	api.Put("/departments/:id", handler.UpdateDepartment)
	api.Delete("/departments/:id", handler.DeleteDepartment)

	// Designations
	api.Post("/designations", handler.CreateDesignation)
	api.Get("/designations", handler.GetDesignations)
	api.Get("/designations/:id", handler.GetDesignation)
	api.Put("/designations/:id", handler.UpdateDesignation)
	api.Delete("/designations/:id", handler.DeleteDesignation)

	// Organization Units
	api.Post("/organization-units", handler.CreateOrgUnit)
	api.Get("/organization-units", handler.GetOrgUnits)
	api.Get("/organization-units/:id", handler.GetOrgUnit)
	api.Put("/organization-units/:id", handler.UpdateOrgUnit)
	api.Delete("/organization-units/:id", handler.DeleteOrgUnit)

	// Employees
	api.Post("/employees", handler.CreateEmployeeAsUser)
	api.Get("/employees", handler.GetEmployees)
	api.Get("/employees/non-heads", handler.GetNonHeadEmployees)
	api.Get("/employees/:id", handler.GetEmployee)
	api.Put("/employees/:id", handler.UpdateEmployee)
	api.Delete("/employees/:id", handler.DeleteEmployee)

	// Employee Hierarchy
	api.Post("/employee-hierarchy", handler.CreateEmployeeHierarchy)
	api.Get("/employee-hierarchy", handler.GetEmployeeHierarchies)
	api.Get("/employee-hierarchy/:id", handler.GetEmployeeHierarchy)
	api.Put("/employee-hierarchy/:id", handler.UpdateEmployeeHierarchy)
	api.Delete("/employee-hierarchy/:id", handler.DeleteEmployeeHierarchy)

	// Employee - Organization Unit Mapping
	api.Post("/employee-org-units", handler.CreateEmployeeOrgUnit)
	api.Get("/employee-org-units", handler.GetEmployeeOrgUnits)
	api.Get("/employee-org-units/:id", handler.GetEmployeeOrgUnit)
	api.Put("/employee-org-units/:id", handler.UpdateEmployeeOrgUnit)
	api.Delete("/employee-org-units/:id", handler.DeleteEmployeeOrgUnit)

	// start server
	log.Fatal(app.Listen(":8000"))

}
