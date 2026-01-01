package handler

import (
	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var addressesDB *gorm.DB

// Inject DB
func SetAddressesDB(db *gorm.DB) {
	addressesDB = db
}

// Get all addresses with pagination & filter
func GetAllAddresses(c *fiber.Ctx) error {
	var addresses []models.Addresses
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := addressesDB.Model(&models.Addresses{})
	if filter != "" {
		query = query.Where("address_title ILIKE ?", "%"+filter+"%")
	}

	// Count with filter
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error counting addresses"})
	}

	// Fetch results
	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&addresses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  addresses,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// Get one by ID
func GetAddressByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var addr models.Addresses
	if err := addressesDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(addr)
}

// Create new address
func CreateAddress(c *fiber.Ctx) error {
	var addr models.Addresses
	if err := c.BodyParser(&addr); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if err := addressesDB.Create(&addr).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(addr)
}

// Update existing address
func UpdateAddress(c *fiber.Ctx) error {
	id := c.Params("id")
	var addr models.Addresses
	if err := addressesDB.First(&addr, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}

	if err := c.BodyParser(&addr); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if err := addressesDB.Save(&addr).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(addr)
}

// Delete address
func DeleteAddress(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := addressesDB.Delete(&models.Addresses{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

// Search addresses (autocomplete style)
func SearchAddresses(c *fiber.Ctx) error {
	search := c.Query("search")
	var addresses []models.Addresses

	query := addressesDB.Model(&models.Addresses{})
	if search != "" {
		query = query.Where("address_title ILIKE ? OR city ILIKE ? OR state ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Limit(20).Find(&addresses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": addresses,
	})
}

// GET /api/addresses/from-users
// Build address-like records from users table where users have address fields populated.
// This mirrors the pattern used in banks_handler.go (GetBanksFromUsers) to surface embedded
// address data without duplicating rows in a physical addresses table.
func GetAddressesFromUsers(c *fiber.Ctx) error {
	// Pagination & filtering similar to GetAllAddresses for consistency
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := strings.TrimSpace(c.Query("filter"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	// We reuse usersDB declared in users handler (same package) just like banks handler does.
	var users []models.User
	// Select only fields we need to reduce memory (add more if required on UI)
	if err := usersDB.
		Select("id", "usercode", "firstname", "lastname", "address1", "address2", "address3", "address4", "address5", "state", "country", "pincode", "addresses").
		Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch users for addresses"})
	}

	fmt.Printf("[GetAddressesFromUsers] Found %d users\n", len(users))

	type AddressRow struct {
		// Core address table style fields
		ID           uint   `json:"id,omitempty"` // will be 0 for user-derived addresses
		AddressTitle string `json:"address_title"`
		AddressLine1 string `json:"address_line1"`
		AddressLine2 string `json:"address_line2"`
		AddressLine3 string `json:"address_line3"`
		AddressLine4 string `json:"address_line4"`
		City         string `json:"city"`
		District     string `json:"district"`
		State        string `json:"state"`
		Country      string `json:"country"`
		Pincode      string `json:"pincode"`
		AddressType  string `json:"address_type"`

		// Embedded minimal user info for UI consumption
		User struct {
			ID        uint   `json:"id"`
			Code      string `json:"usercode"`
			Firstname string `json:"firstname"`
			Lastname  string `json:"lastname"`
		} `json:"user"`
	}

	rows := make([]AddressRow, 0)
	// Helper to append if line not empty
	addIfNotEmpty := func(user models.User, line, title, atype string) {
		if strings.TrimSpace(line) == "" {
			return
		}
		r := AddressRow{
			AddressTitle: title,
			AddressLine1: line,
			State:        stringOrEmpty(user.State),
			Country:      stringOrEmpty(user.Country),
			Pincode:      stringOrEmpty(user.Pincode),
			AddressType:  atype,
		}
		r.User.ID = user.ID
		r.User.Code = stringOrEmpty(user.Usercode)
		r.User.Firstname = user.Firstname
		r.User.Lastname = user.Lastname
		rows = append(rows, r)
	}

	for _, u := range users {
		// Primary addresses (Address1..5) labeled for display
		primaryLines := []string{
			stringOrEmpty(u.Address1),
			stringOrEmpty(u.Address2),
			stringOrEmpty(u.Address3),
			stringOrEmpty(u.Address4),
			stringOrEmpty(u.Address5),
		}
		for idx, line := range primaryLines {
			if strings.TrimSpace(line) == "" {
				continue
			}
			title := fmt.Sprintf("%s %s - Address%d", u.Firstname, u.Lastname, idx+1)
			addIfNotEmpty(u, line, title, "Primary")
		}
		// Additional addresses from JSON array (u.Addresses)
		for i, line := range u.Addresses {
			title := fmt.Sprintf("%s %s - Additional %d", u.Firstname, u.Lastname, i+1)
			addIfNotEmpty(u, line, title, "Additional")
		}
	}

	// Apply filter (case-insensitive contains) to AddressTitle or AddressLine1
	if filter != "" {
		f := strings.ToLower(filter)
		filtered := make([]AddressRow, 0, len(rows))
		for _, r := range rows {
			if strings.Contains(strings.ToLower(r.AddressTitle), f) || strings.Contains(strings.ToLower(r.AddressLine1), f) {
				filtered = append(filtered, r)
			}
		}
		rows = filtered
	}

	total := len(rows)
	fmt.Printf("[GetAddressesFromUsers] Generated %d address rows before pagination\n", total)

	// Pagination slice
	end := offset + limit
	if offset > total {
		rows = []AddressRow{}
	} else {
		if end > total {
			end = total
		}
		rows = rows[offset:end]
	}

	fmt.Printf("[GetAddressesFromUsers] Returning %d rows (page=%d, limit=%d, total=%d)\n", len(rows), page, limit, total)
	return c.JSON(fiber.Map{
		"data":  rows,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
