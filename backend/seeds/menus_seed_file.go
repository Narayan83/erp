package seeds

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"erp.local/backend/models"
	"gorm.io/gorm"
)

// MenusSeedJSONPath is the JSON snapshot of the menus table (updated from the DB on every menu change).
// Override with ERP_MENUS_SEED_JSON for a custom path.
func MenusSeedJSONPath() string {
	if p := strings.TrimSpace(os.Getenv("ERP_MENUS_SEED_JSON")); p != "" {
		return p
	}
	return filepath.Join("seeds", "menus_default.json")
}

// menuFileNode is the on-disk JSON shape (no ids/timestamps) so seeds stay readable and stable.
type menuFileNode struct {
	MenuName     string         `json:"menu_name"`
	Description  string         `json:"description,omitempty"`
	URL          string         `json:"url"`
	Icon         string         `json:"icon,omitempty"`
	SortOrder    int            `json:"sort_order"`
	MenuType     string         `json:"menu_type"`
	IsActive     bool           `json:"is_active"`
	RequiresAuth bool           `json:"requires_auth"`
	Children     []menuFileNode `json:"children,omitempty"`
}

func toFileNode(m models.Menu) menuFileNode {
	n := menuFileNode{
		MenuName:     m.MenuName,
		Description:  m.Description,
		URL:          m.URL,
		Icon:         m.Icon,
		SortOrder:    m.SortOrder,
		MenuType:     m.MenuType,
		IsActive:     m.IsActive,
		RequiresAuth: m.RequiresAuth,
	}
	if strings.TrimSpace(n.MenuType) == "" {
		n.MenuType = "main"
	}
	for _, ch := range m.Children {
		n.Children = append(n.Children, toFileNode(ch))
	}
	return n
}

func fromFileNode(n menuFileNode) models.Menu {
	m := models.Menu{
		MenuName:     n.MenuName,
		Description:  n.Description,
		URL:          n.URL,
		Icon:         n.Icon,
		SortOrder:    n.SortOrder,
		IsActive:     n.IsActive,
		RequiresAuth: n.RequiresAuth,
	}
	if strings.TrimSpace(n.MenuType) != "" {
		m.MenuType = n.MenuType
	} else {
		m.MenuType = "main"
	}
	for _, ch := range n.Children {
		m.Children = append(m.Children, fromFileNode(ch))
	}
	return m
}

func sortMenusRecursive(m []models.Menu) {
	sort.Slice(m, func(i, j int) bool {
		if m[i].SortOrder != m[j].SortOrder {
			return m[i].SortOrder < m[j].SortOrder
		}
		return m[i].MenuName < m[j].MenuName
	})
	for i := range m {
		if len(m[i].Children) > 0 {
			sortMenusRecursive(m[i].Children)
		}
	}
}

// BuildMenuTreeFromFlat groups flat rows into nested roots (parent_id IS NULL).
func BuildMenuTreeFromFlat(flat []models.Menu) []models.Menu {
	if len(flat) == 0 {
		return nil
	}
	byID := make(map[uint]*models.Menu, len(flat))
	for i := range flat {
		m := flat[i]
		m.Children = nil
		m.Parent = nil
		cp := m
		byID[flat[i].ID] = &cp
	}
	for i := range flat {
		m := byID[flat[i].ID]
		if m.ParentID != nil {
			if p, ok := byID[*m.ParentID]; ok {
				p.Children = append(p.Children, *m)
			}
		}
	}
	var roots []models.Menu
	for i := range flat {
		if flat[i].ParentID != nil {
			continue
		}
		roots = append(roots, *byID[flat[i].ID])
	}
	sortMenusRecursive(roots)
	return roots
}

// SaveMenusSeedJSONFromDB writes menus_default.json from the current menus table (nested tree, no ids).
func SaveMenusSeedJSONFromDB(db *gorm.DB) error {
	var flat []models.Menu
	if err := db.Order("id").Find(&flat).Error; err != nil {
		return err
	}
	roots := BuildMenuTreeFromFlat(flat)
	nodes := make([]menuFileNode, len(roots))
	for i := range roots {
		nodes[i] = toFileNode(roots[i])
	}
	b, err := json.MarshalIndent(nodes, "", "  ")
	if err != nil {
		return err
	}
	path := MenusSeedJSONPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	return os.WriteFile(path, b, 0644)
}

// LoadMenusSeedFromJSONFile loads nested roots from menus_default.json.
// Returns (nil, nil) if the file is missing or contains an empty array — caller should fall back to hardcoded defaults.
func LoadMenusSeedFromJSONFile() ([]models.Menu, error) {
	path := MenusSeedJSONPath()
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	if len(strings.TrimSpace(string(b))) == 0 {
		return nil, nil
	}
	var nodes []menuFileNode
	if err := json.Unmarshal(b, &nodes); err != nil {
		return nil, err
	}
	if len(nodes) == 0 {
		return nil, nil
	}
	out := make([]models.Menu, len(nodes))
	for i := range nodes {
		out[i] = fromFileNode(nodes[i])
	}
	return out, nil
}

// SeedMenusFromJSONRoots inserts each root tree (nested) into the database.
func SeedMenusFromJSONRoots(db *gorm.DB, roots []models.Menu) error {
	for i := range roots {
		r := roots[i]
		if err := db.Session(&gorm.Session{FullSaveAssociations: true}).Create(&r).Error; err != nil {
			return fmt.Errorf("seed root %q: %w", r.MenuName, err)
		}
	}
	return nil
}

// TryCreateUniqueRootURLIndex adds a partial unique index on normalized root URLs (Postgres).
func TryCreateUniqueRootURLIndex(db *gorm.DB) {
	err := db.Exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_unique_root_url
ON menus (lower(trim(both from url)))
WHERE parent_id IS NULL AND coalesce(trim(url), '') <> '';
`).Error
	if err != nil {
		// e.g. SQLite or duplicate data — non-fatal
		return
	}
}
