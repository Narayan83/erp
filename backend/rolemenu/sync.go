package rolemenu

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"erp.local/backend/models"
	"gorm.io/gorm"
)

// MenusExportPath returns the path for the menu tree JSON snapshot (DB → file).
func MenusExportPath() string {
	if p := strings.TrimSpace(os.Getenv("ERP_MENUS_JSON_PATH")); p != "" {
		return p
	}
	return filepath.Join("..", "frontend", "src", "data", "menus-from-db.json")
}

type menuExportNode struct {
	ID           uint             `json:"id"`
	MenuName     string           `json:"menu_name"`
	Description  string           `json:"description,omitempty"`
	URL          string           `json:"url"`
	Icon         string           `json:"icon,omitempty"`
	ParentID     *uint            `json:"parent_id,omitempty"`
	SortOrder    int              `json:"sort_order"`
	MenuType     string           `json:"menu_type"`
	IsActive     bool             `json:"is_active"`
	RequiresAuth bool             `json:"requires_auth"`
	Children     []menuExportNode `json:"children,omitempty"`
}

// ExportMenusJSONFile writes the current active main menu tree to JSON (for tooling / reference).
func ExportMenusJSONFile(db *gorm.DB, path string) error {
	if path == "" {
		path = MenusExportPath()
	}
	var roots []models.Menu
	if err := db.Where("parent_id IS NULL AND menu_type = ? AND is_active = ?", "main", true).
		Preload("Children", func(d *gorm.DB) *gorm.DB {
			return d.Where("is_active = ?", true).Order("sort_order, menu_name")
		}).
		Order("sort_order, menu_name").
		Find(&roots).Error; err != nil {
		return err
	}
	out := make([]menuExportNode, 0, len(roots))
	for _, r := range roots {
		out = append(out, exportNode(r))
	}
	b, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return os.WriteFile(path, b, 0644)
}

func exportNode(m models.Menu) menuExportNode {
	n := menuExportNode{
		ID:           m.ID,
		MenuName:     m.MenuName,
		Description:  m.Description,
		URL:          m.URL,
		Icon:         m.Icon,
		ParentID:     m.ParentID,
		SortOrder:    m.SortOrder,
		MenuType:     m.MenuType,
		IsActive:     m.IsActive,
		RequiresAuth: m.RequiresAuth,
	}
	for _, ch := range m.Children {
		n.Children = append(n.Children, exportNode(ch))
	}
	return n
}

// CollectSubtreeMenuIDs returns root id and all descendant menu ids (BFS).
func CollectSubtreeMenuIDs(db *gorm.DB, rootID uint) ([]uint, error) {
	out := []uint{rootID}
	queue := []uint{rootID}
	for len(queue) > 0 {
		cur := queue[0]
		queue = queue[1:]
		var children []uint
		if err := db.Model(&models.Menu{}).Where("parent_id = ?", cur).Pluck("id", &children).Error; err != nil {
			return nil, err
		}
		for _, cid := range children {
			out = append(out, cid)
			queue = append(queue, cid)
		}
	}
	return out, nil
}

// PrunePermissionKeysForMenuIDs removes permission map entries keyed by those menu IDs (decimal strings).
func PrunePermissionKeysForMenuIDs(db *gorm.DB, menuIDs []uint) error {
	if len(menuIDs) == 0 {
		return nil
	}
	remove := make(map[string]struct{}, len(menuIDs))
	for _, id := range menuIDs {
		remove[strconv.FormatUint(uint64(id), 10)] = struct{}{}
	}
	var rows []models.RoleManagement
	if err := db.Find(&rows).Error; err != nil {
		return err
	}
	for _, rm := range rows {
		if len(rm.RoleManagementPermissions) == 0 {
			continue
		}
		var perms map[string]json.RawMessage
		if err := json.Unmarshal(rm.RoleManagementPermissions, &perms); err != nil {
			continue
		}
		changed := false
		for k := range perms {
			if _, ok := remove[k]; ok {
				delete(perms, k)
				changed = true
			}
		}
		if !changed {
			continue
		}
		b, err := json.Marshal(perms)
		if err != nil {
			return err
		}
		if err := db.Model(&models.RoleManagement{}).Where("id = ?", rm.ID).Update("role_management_permissions", b).Error; err != nil {
			return err
		}
	}
	return nil
}

// SyncRemoveOrphanedPermissionKeys removes numeric keys that do not correspond to an existing menu id.
func SyncRemoveOrphanedPermissionKeys(db *gorm.DB) error {
	var ids []uint
	if err := db.Model(&models.Menu{}).Pluck("id", &ids).Error; err != nil {
		return err
	}
	valid := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		valid[strconv.FormatUint(uint64(id), 10)] = struct{}{}
	}
	var rows []models.RoleManagement
	if err := db.Find(&rows).Error; err != nil {
		return err
	}
	for _, rm := range rows {
		if len(rm.RoleManagementPermissions) == 0 {
			continue
		}
		var perms map[string]json.RawMessage
		if err := json.Unmarshal(rm.RoleManagementPermissions, &perms); err != nil {
			continue
		}
		changed := false
		for k := range perms {
			if _, err := strconv.ParseUint(k, 10, 64); err != nil {
				continue
			}
			if _, ok := valid[k]; !ok {
				delete(perms, k)
				changed = true
			}
		}
		if !changed {
			continue
		}
		b, err := json.Marshal(perms)
		if err != nil {
			return err
		}
		if err := db.Model(&models.RoleManagement{}).Where("id = ?", rm.ID).Update("role_management_permissions", b).Error; err != nil {
			return err
		}
	}
	return nil
}

// RepointRoleManagementFKIfDeleting updates role_managements.menu_id when it points at a menu being removed.
func RepointRoleManagementFKIfDeleting(db *gorm.DB, deletingIDs []uint) error {
	if len(deletingIDs) == 0 {
		return nil
	}
	var n int64
	if err := db.Model(&models.RoleManagement{}).Where("menu_id IN ?", deletingIDs).Count(&n).Error; err != nil {
		return err
	}
	if n == 0 {
		return nil
	}
	var replacement uint
	tx := db.Model(&models.Menu{}).Select("id").Where("id NOT IN ?", deletingIDs).Order("id").Limit(1)
	if err := tx.Scan(&replacement).Error; err != nil {
		return err
	}
	if replacement == 0 {
		return fmt.Errorf("cannot delete menus: role_management rows reference them and no other menu exists to repoint menu_id")
	}
	return db.Model(&models.RoleManagement{}).Where("menu_id IN ?", deletingIDs).Update("menu_id", replacement).Error
}

// DeleteMenusSubtree deletes root and descendants (children before parents within the subtree).
func DeleteMenusSubtree(db *gorm.DB, rootID uint) error {
	ids, err := CollectSubtreeMenuIDs(db, rootID)
	if err != nil {
		return err
	}
	idSet := make(map[uint]struct{}, len(ids))
	for _, id := range ids {
		idSet[id] = struct{}{}
	}
	return db.Transaction(func(tx *gorm.DB) error {
		if err := RepointRoleManagementFKIfDeleting(tx, ids); err != nil {
			return err
		}
		if err := PrunePermissionKeysForMenuIDs(tx, ids); err != nil {
			return err
		}
		for len(idSet) > 0 {
			var leaves []uint
			for id := range idSet {
				var childInSet int64
				if err := tx.Model(&models.Menu{}).
					Where("parent_id = ? AND id IN ?", id, idsInSet(idSet)).
					Count(&childInSet).Error; err != nil {
					return err
				}
				if childInSet == 0 {
					leaves = append(leaves, id)
				}
			}
			if len(leaves) == 0 {
				return fmt.Errorf("menu delete: could not resolve delete order (possible cycle)")
			}
			if err := tx.Where("id IN ?", leaves).Delete(&models.Menu{}).Error; err != nil {
				return err
			}
			for _, id := range leaves {
				delete(idSet, id)
			}
		}
		return nil
	})
}

func idsInSet(m map[uint]struct{}) []uint {
	out := make([]uint, 0, len(m))
	for id := range m {
		out = append(out, id)
	}
	return out
}
