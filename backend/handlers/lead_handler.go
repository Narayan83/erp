package handler

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadsDB *gorm.DB

func SetLeadsDB(db *gorm.DB) {
	leadsDB = db
}

// 📌 Create Lead
func CreateLead(c *fiber.Ctx) error {
	var lead models.Lead

	// Read raw body and clean up empty time fields which would fail
	// to unmarshal into time.Time (empty string causes parse errors).
	raw := c.Body()
	if len(raw) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Empty request body"})
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		// Fallback to BodyParser for non-JSON or unexpected formats
		if err2 := c.BodyParser(&lead); err2 != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}
	} else {
		// Remove keys that map to time.Time fields when they are empty strings
		timeKeys := []string{"since", "lastTalk", "nextTalk", "transferredOn", "createdAt", "updatedAt", "created_at", "updated_at", "last_talk", "next_talk", "transferred_on"}
		for _, k := range timeKeys {
			if v, ok := payload[k]; ok {
				if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) == "" {
					delete(payload, k)
				}
			}
		}

		cleaned, _ := json.Marshal(payload)
		if err := json.Unmarshal(cleaned, &lead); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "detail": err.Error()})
		}
	}

	if err := leadsDB.Create(&lead).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return created lead (without preloading empty relations)
	return c.JSON(lead)
}

// 📌 Get All Leads with Pagination & Filtering
func GetAllLeads(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Don't preload relations - use text fields instead
	query := leadsDB

	if contact := c.Query("contact"); contact != "" {
		query = query.Where("contact ILIKE ?", "%"+contact+"%")
	}
	if stage := c.Query("stage"); stage != "" {
		query = query.Where("stage = ?", stage)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}

	var total int64
	if err := query.Model(&models.Lead{}).Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var leads []models.Lead
	if err := query.Offset(offset).Limit(limit).Find(&leads).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":       leads,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// 📌 Get Single Lead by ID
func GetLeadByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var lead models.Lead
	// Don't preload relations - use text fields instead
	if err := leadsDB.First(&lead, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
	}
	return c.JSON(lead)
}

// 📌 Update Lead
func UpdateLead(c *fiber.Ctx) error {
	id := c.Params("id")

	var req models.Lead

	// Read raw body and clean up empty time fields (same logic as CreateLead)
	raw := c.Body()
	if len(raw) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Empty request body"})
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(raw, &payload); err != nil {
		// Fallback to BodyParser for non-JSON or unexpected formats
		if err2 := c.BodyParser(&req); err2 != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
		}
	} else {
		// Remove empty string keys that map to time.Time fields to avoid parse errors
		timeKeys := []string{"since", "lastTalk", "nextTalk", "transferredOn", "createdAt", "updatedAt", "created_at", "updated_at", "last_talk", "next_talk", "transferred_on"}
		for _, k := range timeKeys {
			if v, ok := payload[k]; ok {
				if s, ok2 := v.(string); ok2 && strings.TrimSpace(s) == "" {
					delete(payload, k)
				}
			}
		}

		cleaned, _ := json.Marshal(payload)
		if err := json.Unmarshal(cleaned, &req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "detail": err.Error()})
		}
	}

	var lead models.Lead
	if err := leadsDB.First(&lead, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
	}

	req.UpdatedAt = time.Now()

	// Validate foreign keys before attempting DB update to return friendlier errors
	if req.AssignedToID != nil {
		var user models.User
		if err := leadsDB.First(&user, *req.AssignedToID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid assigned_to_id", "detail": "user not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate assignee", "detail": err.Error()})
		}
	}
	if req.ProductID != nil {
		var prod models.Product
		if err := leadsDB.First(&prod, *req.ProductID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid product_id", "detail": "product not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate product", "detail": err.Error()})
		}
	}

	if err := leadsDB.Model(&lead).Updates(req).Error; err != nil {
		// Return DB error for easier debugging
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update lead", "detail": err.Error()})
	}

	// Reload lead without preloading empty relations
	if err := leadsDB.First(&lead, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch updated lead", "detail": err.Error()})
	}

	return c.JSON(lead)
}

// 📌 Delete Lead
func DeleteLead(c *fiber.Ctx) error {
	idParam := c.Params("id")
	// Ensure id is numeric (prevent trying to delete imported/local leads from DB)
	parsed, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lead id"})
	}

	if err := leadsDB.Delete(&models.Lead{}, uint(parsed)).Error; err != nil {
		// return actual DB error for easier debugging on client
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Lead deleted successfully"})
}

// 📌 Lead Timeline (combined interactions & followups)
func GetLeadTimeline(c *fiber.Ctx) error {
	id := c.Params("id")
	// Load interactions and followups
	var interactions []models.LeadInteraction
	var followups []models.LeadFollowUp

	if err := leadInteractionDB.Preload("AssignedTo").Where("lead_id = ?", id).Find(&interactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if err := leadFollowupDB.Preload("AssignedTo").Where("lead_id = ?", id).Find(&followups).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	type timelineItem struct {
		Type      string      `json:"type"`
		Timestamp time.Time   `json:"timestamp"`
		Item      interface{} `json:"item"`
	}

	var timeline []timelineItem
	for _, it := range interactions {
		timeline = append(timeline, timelineItem{Type: "interaction", Timestamp: it.Timestamp, Item: it})
	}
	for _, f := range followups {
		timeline = append(timeline, timelineItem{Type: "followup", Timestamp: f.FollowUpOn, Item: f})
	}

	// Sort by timestamp descending
	sort.Slice(timeline, func(i, j int) bool {
		return timeline[i].Timestamp.After(timeline[j].Timestamp)
	})

	return c.JSON(timeline)
}

// 📌 Import Leads (Bulk Create)
func ImportLeads(c *fiber.Ctx) error {
	var leadsPayload []map[string]interface{}

	if err := c.BodyParser(&leadsPayload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input", "detail": err.Error()})
	}

	if len(leadsPayload) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No leads to import"})
	}

	// Log the incoming payload for debugging
	fmt.Println("DEBUG: Incoming payload:", leadsPayload)

	// Validate and process each lead
	var createdLeads []models.Lead
	var errors []map[string]interface{}

	for i, payload := range leadsPayload {
		fmt.Printf("DEBUG: Processing row %d with payload: %+v\n", i+1, payload)

		lead := models.Lead{}

		// Helper: case-insensitive string lookup
		getString := func(key string) string {
			if v, ok := payload[key]; ok {
				switch t := v.(type) {
				case string:
					return strings.TrimSpace(t)
				case float64:
					return fmt.Sprintf("%v", t)
				}
			}
			lk := strings.ToLower(key)
			for k, v := range payload {
				if strings.ToLower(k) == lk {
					if s, ok := v.(string); ok {
						return strings.TrimSpace(s)
					}
					if f, ok := v.(float64); ok {
						return fmt.Sprintf("%v", f)
					}
				}
			}
			return ""
		}

		// Helper: try multiple keys, return first non-empty
		getAny := func(keys ...string) string {
			for _, k := range keys {
				if s := getString(k); s != "" {
					return s
				}
			}
			return ""
		}

		// Helper: get float from multiple keys
		getFloat := func(keys ...string) float64 {
			for _, k := range keys {
				if v, ok := payload[k]; ok {
					switch t := v.(type) {
					case float64:
						return t
					case string:
						if f, err := strconv.ParseFloat(strings.TrimSpace(t), 64); err == nil {
							return f
						}
					}
				}
				// case-insensitive search
				lk := strings.ToLower(k)
				for kk, vv := range payload {
					if strings.ToLower(kk) == lk {
						switch tt := vv.(type) {
						case float64:
							return tt
						case string:
							if f, err := strconv.ParseFloat(strings.TrimSpace(tt), 64); err == nil {
								return f
							}
						}
					}
				}
			}
			return 0
		}

		// Helper: parse date/time from common formats
		parseDate := func(val string) (time.Time, bool) {
			val = strings.TrimSpace(val)
			if val == "" {
				return time.Time{}, false
			}
			// Try RFC3339/ISO
			if t, err := time.Parse(time.RFC3339, val); err == nil {
				return t, true
			}
			// Try common formats
			layouts := []string{"02-01-2006", "02-01-2006 15:04", "02-01-2006 15:04:05", "2006-01-02", "2006/01/02", "02/01/2006", "2006-01-02T15:04:05Z07:00"}
			for _, l := range layouts {
				if t, err := time.Parse(l, val); err == nil {
					return t, true
				}
			}
			// Last attempt: try parsing as float (Excel serial) - skip for now
			return time.Time{}, false
		}

		// Map payload to lead struct (support common key variants)
		lead.Business = getAny("business", "company", "buyer_company")
		lead.Name = getAny("name", "contact", "buyerName", "buyer_name")
		lead.Designation = getAny("designation", "role")
		lead.Mobile = getAny("mobile", "phone", "phone_no", "buyer_mobile")
		lead.Email = getAny("email", "buyer_email")
		lead.AddressLine1 = getAny("addressLine1", "address", "buyer_address")
		lead.AddressLine2 = getAny("addressLine2", "address2")
		lead.City = getAny("city", "buyer_city")
		lead.State = getAny("state", "buyer_state")
		lead.Country = getAny("country", "buyer_country")
		lead.Source = getAny("source", "enquiry_source", "enquirySource")
		lead.Stage = getAny("stage", "lead_stage")
		lead.Potential = getFloat("potential", "estimated_value", "estimatedValue")
		lead.GSTIN = getAny("gstin")
		lead.Category = getAny("category", "lead_category")
		lead.Website = getAny("website")
		lead.Requirements = getAny("requirements", "requirement", "buyer_requirement", "message")
		lead.Notes = getAny("notes")

		// Tags may come as array or comma separated string
		if v, ok := payload["tags"]; ok {
			switch t := v.(type) {
			case string:
				lead.Tags = strings.TrimSpace(t)
			case []interface{}:
				parts := []string{}
				for _, it := range t {
					if s, ok := it.(string); ok {
						parts = append(parts, strings.TrimSpace(s))
					}
				}
				lead.Tags = strings.Join(parts, ",")
			}
		} else if v := getAny("lead_tags", "tags"); v != "" {
			lead.Tags = v
		}

		// Parse time fields if provided
		if s := getAny("since", "createdAt", "created_at", "enquiryDate", "enquiry_date"); s != "" {
			if dt, ok := parseDate(s); ok {
				lead.Since = dt
			}
		}
		if s := getAny("lastTalk", "last_talk"); s != "" {
			if dt, ok := parseDate(s); ok {
				lead.LastTalk = dt
			}
		}
		if s := getAny("nextTalk", "next_talk", "next_followup", "nextFollowup"); s != "" {
			if dt, ok := parseDate(s); ok {
				lead.NextTalk = dt
			}
		}
		if s := getAny("transferredOn", "transferred_on"); s != "" {
			if dt, ok := parseDate(s); ok {
				lead.TransferredOn = dt
			}
		}

		// Clean up Created/Updated timestamps
		lead.CreatedAt = time.Now()
		lead.UpdatedAt = time.Now()

		// AssignedTo (store name if provided)
		if assigned := getAny("assignedTo", "assignedToName", "assigned_to", "assigned_to_name"); assigned != "" {
			lead.AssignedToName = assigned
		}

		// Product (store name)
		if p := getAny("product", "productName", "product_name"); p != "" {
			lead.ProductName = p
		}

		// Validate required fields
		if lead.Business == "" || lead.Name == "" || lead.Mobile == "" || lead.Email == "" {
			fmt.Printf("DEBUG: Row %d missing required fields: Business=%s, Name=%s, Mobile=%s, Email=%s\n", i+2, lead.Business, lead.Name, lead.Mobile, lead.Email)
			errors = append(errors, map[string]interface{}{
				"row":      i + 2,
				"lead":     lead.Name,
				"business": lead.Business,
				"error":    "Missing required fields",
				"detail":   fmt.Sprintf("Business='%s', Name='%s', Mobile='%s', Email='%s' are required", lead.Business, lead.Name, lead.Mobile, lead.Email),
			})
			continue
		}

		// Create the lead
		if err := leadsDB.Create(&lead).Error; err != nil {
			fmt.Printf("DEBUG: Failed to create lead: %s\n", err.Error())
			errors = append(errors, map[string]interface{}{
				"row":      i + 2,
				"lead":     lead.Name,
				"business": lead.Business,
				"error":    "Failed to create lead",
				"detail":   err.Error(),
			})
			continue
		}

		fmt.Printf("DEBUG: Successfully created lead ID %d\n", lead.ID)

		createdLeads = append(createdLeads, lead)
	}

	fmt.Printf("DEBUG: Import complete - Created: %d, Errors: %d\n", len(createdLeads), len(errors))

	return c.JSON(fiber.Map{
		"created": len(createdLeads),
		"failed":  len(errors),
		"leads":   createdLeads,
		"errors":  errors,
	})
}
