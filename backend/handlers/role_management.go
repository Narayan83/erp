package handler

import (
	"encoding/json"
	"strconv"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var rolemanageDB *gorm.DB

func SetRolesManagementDB(db *gorm.DB) {
	rolemanageDB = db
}

// GetRolePermissions - Get all permissions for a specific role
func GetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	var rolemanagement models.RoleManagement
	if err := rolemanageDB.Where("role_id = ?", roleID).First(&rolemanagement).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role permissions not found"})
	}

	// Parse permissions JSON
	var permissions map[string]interface{}
	if len(rolemanagement.RoleManagementPermissions) > 0 {
		if err := json.Unmarshal(rolemanagement.RoleManagementPermissions, &permissions); err != nil {
			permissions = make(map[string]interface{})
		}
	} else {
		permissions = make(map[string]interface{})
	}

	return c.JSON(fiber.Map{
		"role_id":     rolemanagement.RoleID,
		"menu_id":     rolemanagement.MenuID,
		"permissions": permissions,
	})
}

// UpdateRolePermissions - Update permissions for a role
func UpdateRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	// Convert roleID to uint
	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	// Parse the permissions JSON
	var permissionsData map[string]interface{}
	if err := c.BodyParser(&permissionsData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid permissions data"})
	}

	// Convert to JSONB
	permsBytes, err := json.Marshal(permissionsData)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid permissions format"})
	}

	// Check if record exists, if not create it
	var rolemanagement models.RoleManagement
	result := rolemanageDB.Where("role_id = ?", roleIDUint).First(&rolemanagement)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// Create new record
			rolemanagement = models.RoleManagement{
				RoleID:                    uint(roleIDUint),
				RoleManagementPermissions: permsBytes,
			}
			if err := rolemanageDB.Create(&rolemanagement).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		} else {
			return c.Status(500).JSON(fiber.Map{"error": result.Error.Error()})
		}
	} else {
		// Update existing record
		if err := rolemanageDB.Model(&rolemanagement).Update("role_management_permissions", permsBytes).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.JSON(fiber.Map{
		"message":     "Permissions updated successfully",
		"role_id":     roleIDUint,
		"permissions": permissionsData,
	})
}

// GetRoleMenuTreeWithPermissions - Get menu tree with permissions for a specific role
func GetRoleMenuTreeWithPermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	// Convert roleID to uint
	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	// Get role permissions
	var rolemanagement models.RoleManagement
	if err := rolemanageDB.Where("role_id = ?", roleIDUint).First(&rolemanagement).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role permissions not found"})
	}

	// Parse permissions JSON
	var permissions map[string]interface{}
	if len(rolemanagement.RoleManagementPermissions) > 0 {
		if err := json.Unmarshal(rolemanagement.RoleManagementPermissions, &permissions); err != nil {
			permissions = make(map[string]interface{})
		}
	} else {
		permissions = make(map[string]interface{})
	}

	// Get all menus with their parent-child structure
	var menus []models.Menu
	if err := rolemanageDB.
		Where("parent_id IS NULL AND is_active = true").
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = true").Order("sort_order")
		}).
		Order("sort_order").
		Find(&menus).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Build response with permissions
	type MenuWithPermissions struct {
		models.Menu
		Permissions interface{} `json:"permissions"`
	}

	var result []MenuWithPermissions
	for _, menu := range menus {
		// Convert menu ID to string for map lookup
		menuIDStr := strconv.FormatUint(uint64(menu.ID), 10)

		menuPerms, exists := permissions[menuIDStr]
		if !exists {
			// Default permissions if not set
			menuPerms = map[string]bool{
				"can_view":   false,
				"can_create": false,
				"can_update": false,
				"can_delete": false,
				"can_all":    false,
			}
		}

		menuWithPerms := MenuWithPermissions{
			Menu:        menu,
			Permissions: menuPerms,
		}
		result = append(result, menuWithPerms)
	}

	return c.JSON(result)
}

// ResetRolePermissions - Reset all permissions for a role to default (empty)
func ResetRolePermissions(c *fiber.Ctx) error {
	roleID := c.Params("id")

	// Convert roleID to uint
	roleIDUint, err := strconv.ParseUint(roleID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role ID"})
	}

	var rolemanagement models.RoleManagement
	if err := rolemanageDB.Where("role_id = ?", roleIDUint).First(&rolemanagement).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Role permissions not found"})
	}

	// Set permissions to empty JSON
	emptyPerms := make(map[string]interface{})
	permsBytes, _ := json.Marshal(emptyPerms)

	if err := rolemanageDB.Model(&rolemanagement).Update("role_management_permissions", permsBytes).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Permissions reset successfully"})
}
