package seeds

import (
	"fmt"
	"log"

	"erp.local/backend/initializers"
	"erp.local/backend/models"
	"golang.org/x/crypto/bcrypt"
)

func SeedAll() {
	SeedRoles()
	SeedAdminUser()
	SeedMenus()
}

func SeedMenus() {
	menus := []models.Menu{
		{MenuName: "Dashboard", URL: "/home", Icon: "LayoutDashboard", SortOrder: 1, IsActive: true},

		// Catalog / Products Module
		{MenuName: "Catalog", URL: "/catalog", Icon: "Package", SortOrder: 2, IsActive: true, Children: []models.Menu{
			{MenuName: "Product List", URL: "/ProductMaster", Icon: "List", SortOrder: 1, IsActive: true},
			{MenuName: "Add Product", URL: "/ManageProduct", Icon: "PlusCircle", SortOrder: 2, IsActive: true},
			{MenuName: "Categories", URL: "/ManageCategory", Icon: "ListTree", SortOrder: 3, IsActive: true},
			{MenuName: "Sub Categories", URL: "/ManageSubcategory", Icon: "ListMusic", SortOrder: 4, IsActive: true},
			{MenuName: "Tags", URL: "/ManageTag", Icon: "Tag", SortOrder: 5, IsActive: true},
			{MenuName: "Units/Stores/Taxes", URL: "/ManageUnitStoreTax", Icon: "Settings2", SortOrder: 6, IsActive: true},
			{MenuName: "Series Master", URL: "/ManageSeries", Icon: "Type", SortOrder: 7, IsActive: true},
		}},

		// Sales / CRM Module
		{MenuName: "CRM & Sales", URL: "/crm", Icon: "ShoppingCart", SortOrder: 3, IsActive: true, Children: []models.Menu{
			{MenuName: "Leads Dashboard", URL: "/leads-dashboard", Icon: "BarChart", SortOrder: 1, IsActive: true},
			{MenuName: "CRM Master", URL: "/crm-master", Icon: "Database", SortOrder: 2, IsActive: true},
			{MenuName: "Quotations", URL: "/quotation-list", Icon: "FileText", SortOrder: 3, IsActive: true},
			{MenuName: "Create Quotation", URL: "/quotation", Icon: "PlusSquare", SortOrder: 4, IsActive: true},
			{MenuName: "Accounts", URL: "/account", Icon: "User", SortOrder: 5, IsActive: true},
			{MenuName: "Sales Config", URL: "/sales-configuration", Icon: "Sliders", SortOrder: 6, IsActive: true},
		}},

		// CRM Reports
		{MenuName: "CRM Reports", URL: "/reports", Icon: "PieChart", SortOrder: 4, IsActive: true, Children: []models.Menu{
			{MenuName: "Sales Interactions", URL: "/reports/sales-interactions", Icon: "MessageCircle", SortOrder: 1, IsActive: true},
			{MenuName: "Followups", URL: "/reports/followups", Icon: "Clock", SortOrder: 2, IsActive: true},
			{MenuName: "Travel Report", URL: "/reports/travel-report", Icon: "Map", SortOrder: 3, IsActive: true},
		}},

		// HR / Employee Module
		{MenuName: "HR Management", URL: "/hr", Icon: "Users2", SortOrder: 5, IsActive: true, Children: []models.Menu{
			{MenuName: "Employee List", URL: "/employeemanagement", Icon: "Users", SortOrder: 1, IsActive: true},
			{MenuName: "Add Employee", URL: "/employeemaster", Icon: "UserPlus", SortOrder: 2, IsActive: true},
			{MenuName: "Employee Hierarchy", URL: "/empHierarchy", Icon: "GitMerge", SortOrder: 3, IsActive: true},
			{MenuName: "Departments", URL: "/departmentmaster", Icon: "Building", SortOrder: 4, IsActive: true},
			{MenuName: "Designations", URL: "/designation", Icon: "Award", SortOrder: 5, IsActive: true},
			{MenuName: "Organization Units", URL: "/orgunits", Icon: "Network", SortOrder: 6, IsActive: true},
			{MenuName: "User Assignment", URL: "/assignusertoemployee", Icon: "UserCheck", SortOrder: 7, IsActive: true},
		}},

		// User & Role Management (Admin)
		{MenuName: "User & Roles", URL: "/admin-master", Icon: "ShieldAlert", SortOrder: 6, IsActive: true, Children: []models.Menu{
			{MenuName: "User List", URL: "/users", Icon: "Users", SortOrder: 1, IsActive: true},
			{MenuName: "Role Creation", URL: "/rolecreation", Icon: "ShieldPlus", SortOrder: 2, IsActive: true},
			{MenuName: "Existing Roles", URL: "/existingroles", Icon: "Shield", SortOrder: 3, IsActive: true},
			{MenuName: "Role Permissions", URL: "/rolemanagement", Icon: "Lock", SortOrder: 4, IsActive: true},
			{MenuName: "User-Role Map", URL: "/usermanagement", Icon: "Link", SortOrder: 5, IsActive: true},
			{MenuName: "Menu Creation", URL: "/menucreation", Icon: "Menu", SortOrder: 6, IsActive: true},
			{MenuName: "Existing Menus", URL: "/existingmenus", Icon: "List", SortOrder: 7, IsActive: true},
			{MenuName: "Audit Logs", URL: "/auditlogs", Icon: "FileClock", SortOrder: 8, IsActive: true},
		}},

		// Company Master Module
		{MenuName: "Company Master", URL: "/company-master", Icon: "Building2", SortOrder: 7, IsActive: true, Children: []models.Menu{
			{MenuName: "Company Management", URL: "/companies", Icon: "Home", SortOrder: 1, IsActive: true},
			{MenuName: "Branch Management", URL: "/branches", Icon: "MapPin", SortOrder: 2, IsActive: true},
			{MenuName: "Bank Management", URL: "/banks", Icon: "Landmark", SortOrder: 3, IsActive: true},
		}},

		// General Settings
		{MenuName: "Settings", URL: "/settings-root", Icon: "Settings", SortOrder: 8, IsActive: true, Children: []models.Menu{
			{MenuName: "Profile", URL: "/profile", Icon: "User", SortOrder: 1, IsActive: true},
			{MenuName: "App Settings", URL: "/settings", Icon: "sliders", SortOrder: 2, IsActive: true},
			{MenuName: "Addresses", URL: "/address", Icon: "MapPin", SortOrder: 3, IsActive: true},
			{MenuName: "ERP Reports", URL: "/erpreport", Icon: "FileBarChart", SortOrder: 4, IsActive: true},
		}},
	}

	for _, m := range menus {
		var existing models.Menu
		if err := initializers.DB.Where("menu_name = ? AND url = ?", m.MenuName, m.URL).First(&existing).Error; err != nil {
			if err := initializers.DB.Create(&m).Error; err != nil {
				log.Printf("Failed to seed menu %s: %v", m.MenuName, err)
			} else {
				fmt.Printf("Seeded Menu: %s\n", m.MenuName)
			}
		}
	}
}

func SeedRoles() {
	roles := []models.Role{
		{RoleName: "Super Admin", Description: "Has full access to the system"},
		{RoleName: "Admin", Description: "Administrator"},
		{RoleName: "User", Description: "Standard User"},
	}

	for _, r := range roles {
		var count int64
		initializers.DB.Model(&models.Role{}).Where("role_name = ?", r.RoleName).Count(&count)
		if count == 0 {
			if err := initializers.DB.Create(&r).Error; err != nil {
				log.Printf("Failed to seed role %s: %v", r.RoleName, err)
			} else {
				fmt.Printf("Seeded Role: %s\n", r.RoleName)
			}
		}
	}
}

func SeedAdminUser() {
	var count int64
	initializers.DB.Model(&models.User{}).Count(&count)
	// if count > 0 {
	// 	return // Users exist, skip
	// }

	// Create Super Admin User
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	admin := models.User{
		Firstname:     "System",
		Lastname:      "Admin",
		Email:         "admin@admin.com",
		Password:      string(hash),
		PlainPassword: "admin123",
		MobileNumber:  "0000000000",
		Active:        true,
		IsUser:        true,
		Usercode:      stringPtr("ADM001"),
	}

	var existingUser models.User
	if err := initializers.DB.Where("email = ?", admin.Email).First(&existingUser).Error; err == nil {
		fmt.Printf("Admin user already exists, skipping seed.\n")
		return
	}

	if err := initializers.DB.Create(&admin).Error; err != nil {
		log.Printf("Failed to create admin user: %v", err)
		return
	}
	fmt.Printf("Seeded Super Admin User: admin@admin.com / admin123\n")

	// Assign Super Admin Role
	var role models.Role
	if err := initializers.DB.Where("role_name = ?", "Super Admin").First(&role).Error; err == nil {
		mapping := models.UserRoleMapping{
			UserID: admin.ID,
			RoleID: role.ID,
		}
		if err := initializers.DB.Create(&mapping).Error; err != nil {
			log.Printf("Failed to assign role to admin: %v", err)
		} else {
			fmt.Printf("Assigned Super Admin role to user\n")
		}
	}
}

func stringPtr(s string) *string {
	return &s
}
