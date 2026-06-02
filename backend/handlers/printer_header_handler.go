package handler

import (
	"encoding/json"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var printerHeaderDB *gorm.DB

func SetPrinterHeaderDB(db *gorm.DB) {
	printerHeaderDB = db
}

/* ================= REQUEST DTO ================= */

// LogoItem represents a single header logo with a user-defined display name.
type LogoItem struct {
	Name string `json:"name"`
	Data string `json:"data"`
}

type CreatePrinterHeaderRequest struct {
	HeaderTitle    string     `json:"header_title"`
	HeaderSubtitle string     `json:"header_subtitle"`
	Address        string     `json:"address"`
	Pin            string     `json:"pin"`
	GSTIN          string     `json:"gstin"`
	Mobile         string     `json:"mobile"`
	Email          string     `json:"email"`
	Website        string     `json:"website"`
	LogoData       string     `json:"logo_data"`
	LogosData      []LogoItem `json:"logos_data"`
	Alignment      string     `json:"alignment"`
}

type UpdatePrinterHeaderRequest struct {
	HeaderTitle    *string     `json:"header_title"`
	HeaderSubtitle *string     `json:"header_subtitle"`
	Address        *string     `json:"address"`
	Pin            *string     `json:"pin"`
	GSTIN          *string     `json:"gstin"`
	Mobile         *string     `json:"mobile"`
	Email          *string     `json:"email"`
	Website        *string     `json:"website"`
	LogoData       *string     `json:"logo_data"`
	LogosData      *[]LogoItem `json:"logos_data"`
	Alignment      *string     `json:"alignment"`
}

func normalizeLogoItems(items []LogoItem) []LogoItem {
	if len(items) == 0 {
		return []LogoItem{}
	}
	result := make([]LogoItem, 0, len(items))
	seen := make(map[string]struct{}, len(items))
	for _, item := range items {
		d := strings.TrimSpace(item.Data)
		if d == "" {
			continue
		}
		if _, ok := seen[d]; ok {
			continue
		}
		seen[d] = struct{}{}
		result = append(result, LogoItem{Name: strings.TrimSpace(item.Name), Data: d})
	}
	return result
}

// ensureSelectedFirst moves the selected data to the front of the slice
// while preserving any existing name for that data. If the selected value
// is not present it will be prepended with an empty name. The result will
// contain unique Data entries in order.
func ensureSelectedFirst(items []LogoItem, selected string) []LogoItem {
	sel := strings.TrimSpace(selected)
	if sel == "" {
		return normalizeLogoItems(items)
	}
	seen := make(map[string]struct{}, len(items)+1)
	result := make([]LogoItem, 0, len(items)+1)

	// if selected is already present, pick its name and push first
	var selectedName string
	for _, it := range items {
		if strings.TrimSpace(it.Data) == sel {
			selectedName = strings.TrimSpace(it.Name)
			break
		}
	}
	if selectedName != "" {
		result = append(result, LogoItem{Name: selectedName, Data: sel})
		seen[sel] = struct{}{}
	} else {
		// prepend with empty name if not found
		result = append(result, LogoItem{Name: "", Data: sel})
		seen[sel] = struct{}{}
	}

	// append the rest (skip duplicates)
	for _, it := range items {
		d := strings.TrimSpace(it.Data)
		if d == "" {
			continue
		}
		if _, ok := seen[d]; ok {
			continue
		}
		seen[d] = struct{}{}
		result = append(result, LogoItem{Name: strings.TrimSpace(it.Name), Data: d})
	}

	return normalizeLogoItems(result)
}

// decodeStoredLogos handles both the legacy plain-string-array format and the
// current {name, data} object format stored in the logos_data JSONB column.
func decodeStoredLogos(raw datatypes.JSON) []LogoItem {
	if len(raw) == 0 {
		return []LogoItem{}
	}
	// Try the current object format first.
	var items []LogoItem
	if err := json.Unmarshal(raw, &items); err == nil {
		return normalizeLogoItems(items)
	}
	// Fallback: legacy plain string array.
	var strs []string
	if err := json.Unmarshal(raw, &strs); err != nil {
		return []LogoItem{}
	}
	result := make([]LogoItem, 0, len(strs))
	for _, s := range strs {
		s = strings.TrimSpace(s)
		if s != "" {
			result = append(result, LogoItem{Name: "", Data: s})
		}
	}
	return result
}

func encodeLogoItems(items []LogoItem) datatypes.JSON {
	normalized := normalizeLogoItems(items)
	if len(normalized) == 0 {
		return datatypes.JSON([]byte("[]"))
	}
	b, err := json.Marshal(normalized)
	if err != nil {
		return datatypes.JSON([]byte("[]"))
	}
	return datatypes.JSON(b)
}

/* ================= HANDLERS ================= */

func CreatePrinterHeader(c *fiber.Ctx) error {
	var body CreatePrinterHeaderRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.HeaderTitle == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Header title is required"})
	}

	var bodyAlignment = body.Alignment
	if bodyAlignment == "" {
		bodyAlignment = "center"
	}

	logos := normalizeLogoItems(body.LogosData)
	selectedLogo := strings.TrimSpace(body.LogoData)
	if selectedLogo == "" && len(logos) > 0 {
		selectedLogo = logos[0].Data
	}
	if selectedLogo != "" {
		logos = ensureSelectedFirst(logos, selectedLogo)
	}

	var existing models.PrinterHeader
	if err := printerHeaderDB.Order("id desc").First(&existing).Error; err != nil && err != gorm.ErrRecordNotFound {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	} else if err == nil {
		existing.HeaderTitle = body.HeaderTitle
		existing.HeaderSubtitle = body.HeaderSubtitle
		existing.Address = body.Address
		existing.Pin = body.Pin
		existing.GSTIN = body.GSTIN
		existing.Mobile = body.Mobile
		existing.Email = body.Email
		existing.Website = body.Website
		existing.LogoData = selectedLogo
		existing.LogosData = encodeLogoItems(logos)
		existing.Alignment = bodyAlignment
		if err := printerHeaderDB.Save(&existing).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(existing)
	}

	header := models.PrinterHeader{
		HeaderTitle:    body.HeaderTitle,
		HeaderSubtitle: body.HeaderSubtitle,
		Address:        body.Address,
		Pin:            body.Pin,
		GSTIN:          body.GSTIN,
		Mobile:         body.Mobile,
		Email:          body.Email,
		Website:        body.Website,
		LogoData:       selectedLogo,
		LogosData:      encodeLogoItems(logos),
		Alignment:      bodyAlignment,
	}

	if err := printerHeaderDB.Create(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(header)
}

func GetPrinterHeaders(c *fiber.Ctx) error {
	var headers []models.PrinterHeader
	printerHeaderDB.Order("id desc").Find(&headers)
	return c.JSON(headers)
}

func GetPrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")
	var header models.PrinterHeader

	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(header)
}

func UpdatePrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdatePrinterHeaderRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var header models.PrinterHeader
	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.HeaderTitle != nil {
		header.HeaderTitle = *body.HeaderTitle
	}
	if body.HeaderSubtitle != nil {
		header.HeaderSubtitle = *body.HeaderSubtitle
	}
	if body.Address != nil {
		header.Address = *body.Address
	}
	if body.Pin != nil {
		header.Pin = *body.Pin
	}
	if body.GSTIN != nil {
		header.GSTIN = *body.GSTIN
	}
	if body.Mobile != nil {
		header.Mobile = *body.Mobile
	}
	if body.Email != nil {
		header.Email = *body.Email
	}
	if body.Website != nil {
		header.Website = *body.Website
	}
	if body.LogoData != nil {
		nextLogo := strings.TrimSpace(*body.LogoData)
		header.LogoData = nextLogo
		if nextLogo != "" {
			existingLogos := decodeStoredLogos(header.LogosData)
			header.LogosData = encodeLogoItems(ensureSelectedFirst(existingLogos, nextLogo))
		}
	}
	if body.LogosData != nil {
		normalized := normalizeLogoItems(*body.LogosData)
		header.LogosData = encodeLogoItems(normalized)
		if len(normalized) > 0 {
			header.LogoData = normalized[0].Data
		} else {
			header.LogoData = ""
		}
	}
	if body.Alignment != nil {
		header.Alignment = *body.Alignment
	}

	if err := printerHeaderDB.Save(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(header)
}

func DeletePrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")

	var header models.PrinterHeader
	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := printerHeaderDB.Delete(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Printer header deleted"})
}
