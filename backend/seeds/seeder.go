package seeds

import (
	"fmt"
	"log"
	"os"
	"strings"

	"erp.local/backend/initializers"
	"erp.local/backend/models"
	"erp.local/backend/rolemenu"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// menuSeedForce returns true if ERP_FORCE_MENU_SEED is set to 1/true/yes (re-run default inserts on non-empty DB).
func menuSeedForce() bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv("ERP_FORCE_MENU_SEED")))
	return v == "1" || v == "true" || v == "yes"
}

func SeedAll() {
	SeedRoles()
	SeedAdminUser()
	SeedMenus()
}

// SeedMenus: (1) dedupe duplicate root URLs, (2) seed only on empty DB unless forced,
// (3) sync role permission orphans + frontend menus JSON + seeds/menus_default.json from DB.
//
// Live menu data is stored in the database. menus_default.json is rewritten from the DB whenever
// menus change (see handlers) and on startup so it stays aligned with the app.
func SeedMenus() {
	if err := DedupeRootMenusByURL(initializers.DB); err != nil {
		log.Printf("DedupeRootMenusByURL: %v", err)
	}

	var menuCount int64
	if err := initializers.DB.Model(&models.Menu{}).Count(&menuCount).Error; err != nil {
		log.Printf("SeedMenus: count menus: %v", err)
	}

	if menuCount == 0 {
		roots, err := LoadMenusSeedFromJSONFile()
		if err != nil {
			log.Printf("SeedMenus: load menus_default.json: %v", err)
			roots = nil
		}
		if len(roots) > 0 {
			if err := SeedMenusFromJSONRoots(initializers.DB, roots); err != nil {
				log.Printf("SeedMenus: from JSON: %v — falling back to hardcoded defaults", err)
				seedHardcodedMenuRoots(initializers.DB)
			}
		} else {
			seedHardcodedMenuRoots(initializers.DB)
		}
	} else if menuSeedForce() {
		fmt.Println("SeedMenus: ERP_FORCE_MENU_SEED set — filling missing default roots from code.")
		seedHardcodedMenuRoots(initializers.DB)
	} else {
		fmt.Println("SeedMenus: menus table is not empty — skipping inserts (DB is source of truth). Set ERP_FORCE_MENU_SEED=1 to fill gaps from code.")
	}

	if err := rolemenu.SyncRemoveOrphanedPermissionKeys(initializers.DB); err != nil {
		log.Printf("SyncRemoveOrphanedPermissionKeys: %v", err)
	}
	if err := rolemenu.ExportMenusJSONFile(initializers.DB, rolemenu.MenusExportPath()); err != nil {
		log.Printf("ExportMenusJSONFile: %v", err)
	}
	if err := SaveMenusSeedJSONFromDB(initializers.DB); err != nil {
		log.Printf("SaveMenusSeedJSONFromDB: %v", err)
	}
	TryCreateUniqueRootURLIndex(initializers.DB)
}

func seedHardcodedMenuRoots(db *gorm.DB) {
	for _, m := range menuSeedHardcodedDefaults() {
		var existing models.Menu
		q := db.Model(&models.Menu{}).Where("parent_id IS NULL")
		if m.URL != "" {
			q = q.Where("url = ?", m.URL)
		} else {
			q = q.Where("menu_name = ?", m.MenuName)
		}
		r := q.Limit(1).Find(&existing)
		if r.Error != nil {
			log.Printf("Failed to look up menu %s: %v", m.MenuName, r.Error)
			continue
		}
		if r.RowsAffected > 0 {
			continue
		}
		if err := db.Create(&m).Error; err != nil {
			log.Printf("Failed to seed menu %s: %v", m.MenuName, err)
		} else {
			fmt.Printf("Seeded Menu: %s\n", m.MenuName)
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
	ur := initializers.DB.Where("email = ?", admin.Email).Limit(1).Find(&existingUser)
	if ur.Error != nil {
		log.Printf("Failed to look up admin user: %v", ur.Error)
		return
	}
	if ur.RowsAffected > 0 {
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
	rr := initializers.DB.Where("role_name = ?", "Super Admin").Limit(1).Find(&role)
	if rr.Error != nil {
		log.Printf("Failed to look up Super Admin role: %v", rr.Error)
		return
	}
	if rr.RowsAffected == 0 {
		log.Printf("Super Admin role not found; assign role manually to admin user\n")
		return
	}
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

func stringPtr(s string) *string {
	return &s
}
