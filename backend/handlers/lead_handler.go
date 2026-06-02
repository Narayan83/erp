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

func isLeadsPrimaryKeyDuplicate(err error) bool {
	if err == nil {
		return false
	}

	errMsg := strings.ToLower(err.Error())
	if !strings.Contains(errMsg, "duplicate key") && !strings.Contains(errMsg, "sqlstate 23505") {
		return false
	}

	return strings.Contains(errMsg, "leads_pkey") ||
		strings.Contains(errMsg, "key (id)") ||
		strings.Contains(errMsg, "constraint")
}

func resetLeadsSequence() error {
	if leadsDB == nil {
		return fmt.Errorf("lead database not initialized")
	}

	resetQuery := `
		SELECT setval(
			pg_get_serial_sequence('leads', 'id'),
			COALESCE((SELECT MAX(id) FROM leads), 0) + 1,
			false
		)
	`

	return leadsDB.Exec(resetQuery).Error
}

func createLeadWithRetry(lead *models.Lead) error {
	err := leadsDB.Create(lead).Error
	if err == nil {
		return nil
	}

	if !isLeadsPrimaryKeyDuplicate(err) {
		return err
	}

	if seqErr := resetLeadsSequence(); seqErr != nil {
		return err
	}

	return leadsDB.Create(lead).Error
}

func payloadHasAny(payload map[string]interface{}, keys ...string) bool {
	for _, key := range keys {
		if _, ok := payload[key]; ok {
			return true
		}
		lowerKey := strings.ToLower(key)
		for existingKey := range payload {
			if strings.ToLower(existingKey) == lowerKey {
				return true
			}
		}
	}
	return false
}

func payloadGetString(payload map[string]interface{}, keys ...string) (string, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case string:
				return strings.TrimSpace(typed), true
			case float64:
				return strings.TrimSpace(strconv.FormatFloat(typed, 'f', -1, 64)), true
			case json.Number:
				return strings.TrimSpace(typed.String()), true
			}
		}

		lowerKey := strings.ToLower(key)
		for existingKey, value := range payload {
			if strings.ToLower(existingKey) != lowerKey {
				continue
			}
			switch typed := value.(type) {
			case string:
				return strings.TrimSpace(typed), true
			case float64:
				return strings.TrimSpace(strconv.FormatFloat(typed, 'f', -1, 64)), true
			case json.Number:
				return strings.TrimSpace(typed.String()), true
			}
		}
	}

	return "", false
}

func payloadGetFloat(payload map[string]interface{}, keys ...string) (float64, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case float64:
				return typed, true
			case string:
				parsed := strings.TrimSpace(typed)
				if parsed == "" {
					return 0, true
				}
				if floatValue, err := strconv.ParseFloat(parsed, 64); err == nil {
					return floatValue, true
				}
			case json.Number:
				if floatValue, err := typed.Float64(); err == nil {
					return floatValue, true
				}
			}
		}

		lowerKey := strings.ToLower(key)
		for existingKey, value := range payload {
			if strings.ToLower(existingKey) != lowerKey {
				continue
			}
			switch typed := value.(type) {
			case float64:
				return typed, true
			case string:
				parsed := strings.TrimSpace(typed)
				if parsed == "" {
					return 0, true
				}
				if floatValue, err := strconv.ParseFloat(parsed, 64); err == nil {
					return floatValue, true
				}
			case json.Number:
				if floatValue, err := typed.Float64(); err == nil {
					return floatValue, true
				}
			}
		}
	}

	return 0, false
}

func payloadGetUint(payload map[string]interface{}, keys ...string) (*uint, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case float64:
				if typed <= 0 {
					return nil, true
				}
				uintValue := uint(typed)
				return &uintValue, true
			case string:
				parsed := strings.TrimSpace(typed)
				if parsed == "" {
					return nil, true
				}
				intValue, err := strconv.Atoi(parsed)
				if err == nil && intValue > 0 {
					uintValue := uint(intValue)
					return &uintValue, true
				}
			case json.Number:
				intValue, err := typed.Int64()
				if err == nil {
					if intValue <= 0 {
						return nil, true
					}
					uintValue := uint(intValue)
					return &uintValue, true
				}
			}
		}

		lowerKey := strings.ToLower(key)
		for existingKey, value := range payload {
			if strings.ToLower(existingKey) != lowerKey {
				continue
			}
			switch typed := value.(type) {
			case float64:
				if typed <= 0 {
					return nil, true
				}
				uintValue := uint(typed)
				return &uintValue, true
			case string:
				parsed := strings.TrimSpace(typed)
				if parsed == "" {
					return nil, true
				}
				intValue, err := strconv.Atoi(parsed)
				if err == nil && intValue > 0 {
					uintValue := uint(intValue)
					return &uintValue, true
				}
			case json.Number:
				intValue, err := typed.Int64()
				if err == nil {
					if intValue <= 0 {
						return nil, true
					}
					uintValue := uint(intValue)
					return &uintValue, true
				}
			}
		}
	}

	return nil, false
}

func payloadGetTime(payload map[string]interface{}, keys ...string) (time.Time, bool) {
	parseDate := func(value string) (time.Time, bool) {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			return time.Time{}, false
		}

		if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
			return parsed, true
		}

		layouts := []string{
			"2006-01-02 15:04:05", "2006-01-02 15:04", "2006-01-02",
			"2006/01/02 15:04:05", "2006/01/02 15:04", "2006/01/02",
			"2006-01-02T15:04:05", "2006-01-02T15:04:05Z07:00",
			"02-01-2006", "02-01-2006 15:04", "02-01-2006 15:04:05",
			"02/01/2006", "02/01/2006 15:04:05", "02/01/2006 15:04",
			"02-Jan-2006 15:04:05", "02-Jan-2006 15:04", "02-Jan-2006",
		}
		for _, layout := range layouts {
			if parsed, err := time.Parse(layout, trimmed); err == nil {
				return parsed, true
			}
		}

		return time.Time{}, false
	}

	if value, ok := payloadGetString(payload, keys...); ok {
		return parseDate(value)
	}

	return time.Time{}, false
}

func payloadGetTags(payload map[string]interface{}, keys ...string) (string, bool) {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case string:
				return strings.TrimSpace(typed), true
			case []interface{}:
				parts := []string{}
				for _, item := range typed {
					if text, ok := item.(string); ok {
						trimmed := strings.TrimSpace(text)
						if trimmed != "" {
							parts = append(parts, trimmed)
						}
					}
				}
				return strings.Join(parts, ","), true
			}
		}
	}

	if value, ok := payloadGetString(payload, keys...); ok {
		return value, true
	}

	return "", false
}

func payloadBuildContact(payload map[string]interface{}) (string, bool) {
	if value, ok := payloadGetString(payload, "name", "contact", "buyerName", "buyer_name"); ok && strings.TrimSpace(value) != "" {
		return strings.TrimSpace(value), true
	}

	prefix, _ := payloadGetString(payload, "prefix", "salutation")
	firstName, _ := payloadGetString(payload, "firstName", "firstname")
	lastName, _ := payloadGetString(payload, "lastName", "lastname")

	fullName := strings.TrimSpace(strings.Join([]string{strings.TrimSpace(prefix), strings.TrimSpace(firstName), strings.TrimSpace(lastName)}, " "))
	if fullName == "" {
		return "", false
	}

	return fullName, true
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

	if len(payload) > 0 {
		if contact, ok := payloadBuildContact(payload); ok {
			lead.Name = contact
		}
		if value, ok := payloadGetString(payload, "source", "enquiry_source", "enquirySource"); ok {
			lead.Source = value
		}
		if value, ok := payloadGetString(payload, "stage", "lead_stage"); ok {
			lead.Stage = value
		}
		if value, ok := payloadGetString(payload, "category", "lead_category"); ok {
			lead.Category = value
		}
		if value, ok := payloadGetTags(payload, "tags", "lead_tags"); ok {
			lead.Tags = value
		}
		if value, ok := payloadGetString(payload, "requirements", "requirement", "buyer_requirement", "message"); ok {
			lead.Requirements = value
		}
		if value, ok := payloadGetString(payload, "assignedToName", "assignedTo", "assigned_to", "assigned_to_name"); ok {
			lead.AssignedToName = value
		}
		if value, ok := payloadGetString(payload, "productName", "product_name", "product", "productName", "product name", "product_title", "productTitle"); ok {
			lead.ProductName = value
		}
		if assignedToID, ok := payloadGetUint(payload, "assigned_to_id", "assignedToId", "AssignedToID"); ok {
			lead.AssignedToID = assignedToID
		}
		if productID, ok := payloadGetUint(payload, "product_id", "productId", "ProductID"); ok {
			lead.ProductID = productID
		}
		if since, ok := payloadGetTime(payload, "since", "queryTime", "query_time", "QUERY_TIME", "createdAt", "created_at", "enquiryDate", "enquiry_date"); ok {
			lead.Since = since
		}
	}

	// If product text is provided, ensure it exists in lead_products master.
	// Do not assign lead_products ID into leads.product_id because product_id FK points to products table.
	if lead.ProductName != "" && lead.ProductID == nil {
		prod, err := EnsureLeadProductByName(lead.ProductName)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upsert product", "detail": err.Error()})
		}
		_ = prod
	}

	if lead.Source != "" {
		source, err := EnsureLeadSourceByName(lead.Source)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upsert source", "detail": err.Error()})
		}
		_ = source
	}

	// If lead is being created with an assignee, record transferredOn as now
	if lead.AssignedToID != nil && lead.TransferredOn.IsZero() {
		lead.TransferredOn = time.Now()
	}

	// Always let DB assign fresh PKs for create APIs.
	lead.ID = 0

	if err := createLeadWithRetry(&lead); err != nil {
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
		query = query.Where("LOWER(contact) LIKE LOWER(?)", "%"+contact+"%")
	}
	if stage := c.Query("stage"); stage != "" {
		query = query.Where("LOWER(stage) = LOWER(?)", stage)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("LOWER(city) = LOWER(?)", city)
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

	// If `assigned_to_id` is being changed, set `transferredOn` to now
	oldAssignedToID := lead.AssignedToID
	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	if contact, ok := payloadBuildContact(payload); ok {
		updates["contact"] = contact
	}
	if value, ok := payloadGetString(payload, "business", "company", "buyer_company"); ok {
		updates["business"] = value
	}
	if value, ok := payloadGetString(payload, "designation", "role"); ok {
		updates["designation"] = value
	}
	if value, ok := payloadGetString(payload, "mobile", "phone", "phone_no", "buyer_mobile"); ok {
		updates["mobile"] = value
	}
	if value, ok := payloadGetString(payload, "email", "buyer_email"); ok {
		updates["email"] = value
	}
	if value, ok := payloadGetString(payload, "addressLine1", "address", "buyer_address"); ok {
		updates["address_line1"] = value
	}
	if value, ok := payloadGetString(payload, "addressLine2", "address2"); ok {
		updates["address_line2"] = value
	}
	if value, ok := payloadGetString(payload, "city", "buyer_city"); ok {
		updates["city"] = value
	}
	if value, ok := payloadGetString(payload, "state", "buyer_state"); ok {
		updates["state"] = value
	}
	if value, ok := payloadGetString(payload, "country", "buyer_country"); ok {
		updates["country"] = value
	}
	if value, ok := payloadGetString(payload, "source", "enquiry_source", "enquirySource"); ok {
		updates["source"] = value
		if _, err := EnsureLeadSourceByName(value); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upsert source", "detail": err.Error()})
		}
	}
	if value, ok := payloadGetString(payload, "stage", "lead_stage"); ok {
		updates["stage"] = value
	}
	if value, ok := payloadGetFloat(payload, "potential", "estimated_value", "estimatedValue"); ok {
		updates["potential"] = value
	}
	if value, ok := payloadGetTime(payload, "since", "queryTime", "query_time", "QUERY_TIME", "createdAt", "created_at", "enquiryDate", "enquiry_date"); ok {
		updates["since"] = value
	}
	if value, ok := payloadGetString(payload, "gstin"); ok {
		updates["gstin"] = value
	}
	if value, ok := payloadGetString(payload, "category", "lead_category"); ok {
		updates["category"] = value
	}
	if value, ok := payloadGetString(payload, "website"); ok {
		updates["website"] = value
	}
	if value, ok := payloadGetString(payload, "requirements", "requirement", "buyer_requirement", "message"); ok {
		updates["requirements"] = value
	}
	if value, ok := payloadGetString(payload, "notes"); ok {
		updates["notes"] = value
	}
	if value, ok := payloadGetTags(payload, "tags", "lead_tags"); ok {
		updates["tags"] = value
	}
	if value, ok := payloadGetTime(payload, "lastTalk", "last_talk"); ok {
		updates["last_talk"] = value
	}
	if value, ok := payloadGetTime(payload, "nextTalk", "next_talk", "next_followup", "nextFollowup"); ok {
		updates["next_talk"] = value
	}
	if value, ok := payloadGetTime(payload, "transferredOn", "transferred_on"); ok {
		updates["transferred_on"] = value
	}
	if value, ok := payloadGetString(payload, "assignedToName", "assignedTo", "assigned_to", "assigned_to_name"); ok {
		updates["assigned_to_name"] = value
	}
	if value, ok := payloadGetString(payload, "productName", "product_name", "product", "product name", "product_title", "productTitle"); ok {
		updates["product_name"] = value
		prod, err := EnsureLeadProductByName(value)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upsert product", "detail": err.Error()})
		}
		_ = prod
	}

	assignedToID, hasAssignedToID := payloadGetUint(payload, "assigned_to_id", "assignedToId", "AssignedToID")
	if hasAssignedToID {
		if assignedToID == nil {
			updates["assigned_to_id"] = nil
		} else {
			updates["assigned_to_id"] = *assignedToID
		}
	}

	productID, hasProductID := payloadGetUint(payload, "product_id", "productId", "ProductID")
	if hasProductID {
		if productID == nil {
			updates["product_id"] = nil
		} else {
			updates["product_id"] = *productID
		}
	}

	if hasAssignedToID {
		if assignedToID != nil && (oldAssignedToID == nil || *oldAssignedToID != *assignedToID) {
			updates["transferred_on"] = time.Now()
		}
	}

	// Validate foreign keys before attempting DB update to return friendlier errors
	if assignedToID != nil {
		var user models.User
		if err := leadsDB.First(&user, *assignedToID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid assigned_to_id", "detail": "user not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate assignee", "detail": err.Error()})
		}
	}
	if productID != nil {
		var prod models.Product
		if err := leadsDB.First(&prod, *productID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid product_id", "detail": "product not found"})
			}
			return c.Status(500).JSON(fiber.Map{"error": "Failed to validate product", "detail": err.Error()})
		}
	}

	if err := leadsDB.Model(&lead).Updates(updates).Error; err != nil {
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

	// Delete related records first to avoid foreign key constraint violations
	leadsDB.Where("lead_id = ?", uint(parsed)).Delete(&models.LeadInteraction{})
	leadsDB.Where("lead_id = ?", uint(parsed)).Delete(&models.LeadFollowUp{})

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

		// Helper: case-insensitive and separator-insensitive string lookup
		getString := func(key string) string {
			normalize := func(s string) string {
				s = strings.ToLower(strings.TrimSpace(s))
				replacer := strings.NewReplacer(" ", "", "_", "", "-", "", "*", "", ".", "")
				return replacer.Replace(s)
			}

			if v, ok := payload[key]; ok {
				switch t := v.(type) {
				case string:
					return strings.TrimSpace(t)
				case float64:
					return fmt.Sprintf("%v", t)
				}
			}
			lk := strings.ToLower(key)
			normKey := normalize(key)
			for k, v := range payload {
				if strings.ToLower(k) == lk || normalize(k) == normKey {
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
			// Try common formats (IndiaMART QUERY_TIME is often "2006-01-02 15:04:05")
			layouts := []string{
				"2006-01-02 15:04:05", "2006-01-02 15:04", "2006-01-02",
				"2006/01/02 15:04:05", "2006/01/02 15:04", "2006/01/02",
				"2006-01-02T15:04:05", "2006-01-02T15:04:05Z07:00",
				"02-01-2006", "02-01-2006 15:04", "02-01-2006 15:04:05",
				"02/01/2006", "02/01/2006 15:04:05", "02/01/2006 15:04",
				"02-Jan-2006 15:04:05", "02-Jan-2006 15:04", "02-Jan-2006",
			}
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

		// For IndiaMART/bulk imports, treat empty text fields as "NA".
		naIfEmpty := func(v string) string {
			trimmed := strings.TrimSpace(v)
			if trimmed == "" {
				return "NA"
			}
			return trimmed
		}

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

		// Parse time fields if provided (enquiry/since only — CreatedAt is set to server time below)
		if s := getAny("since", "queryTime", "query_time", "QUERY_TIME", "createdAt", "created_at", "enquiryDate", "enquiry_date"); s != "" {
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

		// Product (store name and create in lead_products master if needed)
		// Do not map lead_products ID into leads.product_id (FK targets products table).
		if p := getAny("product", "productName", "product_name", "productname", "product title", "product_title", "productTitle"); p != "" {
			lead.ProductName = p

			if _, err := EnsureLeadProductByName(p); err != nil {
				fmt.Printf("DEBUG: Failed to upsert lead product %s: %v\n", p, err)
				errors = append(errors, map[string]interface{}{
					"row":      i + 2,
					"lead":     lead.Name,
					"business": lead.Business,
					"error":    "Failed to upsert product",
					"detail":   err.Error(),
				})
				continue
			}
		}

		if lead.Source != "" {
			if _, err := EnsureLeadSourceByName(lead.Source); err != nil {
				fmt.Printf("DEBUG: Failed to upsert lead source %s: %v\n", lead.Source, err)
				errors = append(errors, map[string]interface{}{
					"row":      i + 2,
					"lead":     lead.Name,
					"business": lead.Business,
					"error":    "Failed to upsert source",
					"detail":   err.Error(),
				})
				continue
			}
		}

		lead.Name = strings.TrimSpace(lead.Name)
		lead.Business = naIfEmpty(lead.Business)
		lead.Designation = naIfEmpty(lead.Designation)
		lead.Mobile = naIfEmpty(lead.Mobile)
		lead.Email = naIfEmpty(lead.Email)
		lead.AddressLine1 = naIfEmpty(lead.AddressLine1)
		lead.AddressLine2 = naIfEmpty(lead.AddressLine2)
		lead.City = naIfEmpty(lead.City)
		lead.State = naIfEmpty(lead.State)
		lead.Country = naIfEmpty(lead.Country)
		lead.Source = naIfEmpty(lead.Source)
		lead.Stage = naIfEmpty(lead.Stage)
		lead.GSTIN = naIfEmpty(lead.GSTIN)
		lead.Category = naIfEmpty(lead.Category)
		lead.Website = naIfEmpty(lead.Website)
		lead.Requirements = naIfEmpty(lead.Requirements)
		lead.Notes = naIfEmpty(lead.Notes)
		lead.Tags = naIfEmpty(lead.Tags)
		lead.AssignedToName = naIfEmpty(lead.AssignedToName)
		lead.ProductName = naIfEmpty(lead.ProductName)

		if lead.Since.IsZero() {
			lead.Since = time.Now()
		}

		// Validate required fields: only Name is mandatory.
		if lead.Name == "" {
			fmt.Printf("DEBUG: Row %d missing required field: Name\n", i+2)
			errors = append(errors, map[string]interface{}{
				"row":      i + 2,
				"lead":     lead.Name,
				"business": lead.Business,
				"error":    "Missing required fields",
				"detail":   "Name is required",
			})
			continue
		}

		// Create lead with one automatic sequence repair+retry for PK collisions.
		if err := createLeadWithRetry(&lead); err != nil {
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
