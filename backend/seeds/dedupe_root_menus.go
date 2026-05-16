package seeds

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"erp.local/backend/rolemenu"
	"gorm.io/gorm"
)

// DedupeRootMenusByURL merges duplicate top-level menus that share the same URL (case-insensitive).
// Keeps the lowest id, repoints children and role_management FKs, prunes permission keys, deletes extras.
func DedupeRootMenusByURL(db *gorm.DB) error {
	var roots []models.Menu
	if err := db.Where("parent_id IS NULL").Order("id ASC").Find(&roots).Error; err != nil {
		return err
	}
	groups := make(map[string][]models.Menu)
	for _, r := range roots {
		k := rootDedupeKey(r)
		groups[k] = append(groups[k], r)
	}

	return db.Transaction(func(tx *gorm.DB) error {
		for _, g := range groups {
			if len(g) < 2 {
				continue
			}
			keeper := g[0].ID
			dupIDs := make([]uint, 0, len(g)-1)
			for _, r := range g[1:] {
				dupIDs = append(dupIDs, r.ID)
			}
			if err := tx.Model(&models.Menu{}).Where("parent_id IN ?", dupIDs).Update("parent_id", keeper).Error; err != nil {
				return err
			}
			if err := rolemenu.RepointRoleManagementFKIfDeleting(tx, dupIDs); err != nil {
				return err
			}
			if err := rolemenu.PrunePermissionKeysForMenuIDs(tx, dupIDs); err != nil {
				return err
			}
			if err := tx.Where("id IN ?", dupIDs).Delete(&models.Menu{}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func rootDedupeKey(r models.Menu) string {
	u := strings.TrimSpace(strings.ToLower(r.URL))
	if u != "" {
		return "url:" + u
	}
	return fmt.Sprintf("id:%d", r.ID)
}
