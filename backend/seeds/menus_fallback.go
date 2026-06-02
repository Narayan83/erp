package seeds

import "erp.local/backend/models"

// menuSeedHardcodedDefaults is used only when menus_default.json is missing or empty (brand-new DB).
func menuSeedHardcodedDefaults() []models.Menu {
	return []models.Menu{
		{MenuName: "Dashboard", URL: "/home", Icon: "LayoutDashboard", SortOrder: 1, IsActive: true},

		{MenuName: "Catalog", URL: "/catalog", Icon: "Package", SortOrder: 2, IsActive: true, Children: []models.Menu{
			{MenuName: "Product List", URL: "/ProductMaster", Icon: "List", SortOrder: 1, IsActive: true},
			{MenuName: "Add Product", URL: "/ManageProduct", Icon: "PlusCircle", SortOrder: 2, IsActive: true},
			{MenuName: "Categories", URL: "/ManageCategory", Icon: "ListTree", SortOrder: 3, IsActive: true},
			{MenuName: "Sub Categories", URL: "/ManageSubcategory", Icon: "ListMusic", SortOrder: 4, IsActive: true},
			{MenuName: "Tags", URL: "/ManageTag", Icon: "Tag", SortOrder: 5, IsActive: true},
			{MenuName: "Units/Stores/Taxes", URL: "/ManageUnitStoreTax", Icon: "Settings2", SortOrder: 6, IsActive: true},
			{MenuName: "Series Master", URL: "/ManageSeries", Icon: "Type", SortOrder: 7, IsActive: true},
		}},

		{MenuName: "CRM & Sales", URL: "/crm", Icon: "ShoppingCart", SortOrder: 3, IsActive: true, Children: []models.Menu{
			{MenuName: "Leads Dashboard", URL: "/leads-dashboard", Icon: "BarChart", SortOrder: 1, IsActive: true},
			{MenuName: "CRM Master", URL: "/crm-master", Icon: "Database", SortOrder: 2, IsActive: true},
			{MenuName: "Quotations", URL: "/quotation-list", Icon: "FileText", SortOrder: 3, IsActive: true},
			{MenuName: "Create Quotation", URL: "/quotation", Icon: "PlusSquare", SortOrder: 4, IsActive: true},
			{MenuName: "Accounts", URL: "/account", Icon: "User", SortOrder: 5, IsActive: true},
			{MenuName: "Sales Config", URL: "/sales-configuration", Icon: "Sliders", SortOrder: 6, IsActive: true},
		}},

		{MenuName: "CRM Reports", URL: "/reports", Icon: "PieChart", SortOrder: 4, IsActive: true, Children: []models.Menu{
			{MenuName: "Sales Interactions", URL: "/reports/sales-interactions", Icon: "MessageCircle", SortOrder: 1, IsActive: true},
			{MenuName: "Followups", URL: "/reports/followups", Icon: "Clock", SortOrder: 2, IsActive: true},
			{MenuName: "Travel Report", URL: "/reports/travel-report", Icon: "Map", SortOrder: 3, IsActive: true},
		}},

		{MenuName: "HR Management", URL: "/hr", Icon: "Users2", SortOrder: 5, IsActive: true, Children: []models.Menu{
			{MenuName: "Employee List", URL: "/employeemanagement", Icon: "Users", SortOrder: 1, IsActive: true},
			{MenuName: "Add Employee", URL: "/employeemaster", Icon: "UserPlus", SortOrder: 2, IsActive: true},
			{MenuName: "Employee Hierarchy", URL: "/empHierarchy", Icon: "GitMerge", SortOrder: 3, IsActive: true},
			{MenuName: "Departments", URL: "/departmentmaster", Icon: "Building", SortOrder: 4, IsActive: true},
			{MenuName: "Designations", URL: "/designation", Icon: "Award", SortOrder: 5, IsActive: true},
			{MenuName: "Organization Units", URL: "/orgunits", Icon: "Network", SortOrder: 6, IsActive: true},
			{MenuName: "User Assignment", URL: "/assignusertoemployee", Icon: "UserCheck", SortOrder: 7, IsActive: true},
		}},

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

		{MenuName: "Company Master", URL: "/company-master", Icon: "Building2", SortOrder: 7, IsActive: true, Children: []models.Menu{
			{MenuName: "Company Management", URL: "/companies", Icon: "Home", SortOrder: 1, IsActive: true},
			{MenuName: "Branch Management", URL: "/branches", Icon: "MapPin", SortOrder: 2, IsActive: true},
			{MenuName: "Bank Management", URL: "/banks", Icon: "Landmark", SortOrder: 3, IsActive: true},
		}},

		{MenuName: "Settings", URL: "/settings-root", Icon: "Settings", SortOrder: 8, IsActive: true, Children: []models.Menu{
			{MenuName: "Profile", URL: "/profile", Icon: "User", SortOrder: 1, IsActive: true},
			{MenuName: "App Settings", URL: "/settings", Icon: "sliders", SortOrder: 2, IsActive: true},
			{MenuName: "Addresses", URL: "/address", Icon: "MapPin", SortOrder: 3, IsActive: true},
			{MenuName: "ERP Reports", URL: "/erpreport", Icon: "FileBarChart", SortOrder: 4, IsActive: true},
		}},
	}
}
