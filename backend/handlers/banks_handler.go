package handler

import (
	"fmt"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var banksDB *gorm.DB

func SetbanksDB(db *gorm.DB) {
	banksDB = db
}

func GetAllBanks(c *fiber.Ctx) error {
	var items []models.Bank
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := banksDB.Model(&models.Bank{})
	if filter != "" {
		query = query.Where("name ILIKE ? OR account_number ILIKE ?", "%"+filter+"%", "%"+filter+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&items).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"data": items, "total": total, "page": page, "limit": limit})
}

func GetBankByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Bank
	if err := banksDB.First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	return c.JSON(item)
}

func CreateBank(c *fiber.Ctx) error {
	var item models.Bank
	if err := c.BodyParser(&item); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	fmt.Printf("[CreateBank] payload=%+v\n", item)

	// If account number exists, try to update existing bank instead of creating duplicate
	if item.AccountNumber != "" {
		var existing models.Bank
		if err := banksDB.Where("account_number = ?", item.AccountNumber).First(&existing).Error; err == nil {
			// update fields
			existing.Name = item.Name
			existing.BranchName = item.BranchName
			existing.BranchAddress = item.BranchAddress
			existing.IFSCCode = item.IFSCCode
			existing.Branch = item.Branch
			existing.Balance = item.Balance
			// also update optional user references
			existing.UserID = item.UserID
			existing.UserCode = item.UserCode
			existing.UserName = item.UserName
			if err := banksDB.Save(&existing).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
			return c.JSON(existing)
		}
	}

	if err := banksDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(item)
}

func UpdateBank(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Bank
	if err := banksDB.First(&item, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}
	// Parse incoming payload into a separate object to avoid clearing
	// fields that aren't sent in the request (including the primary key).
	var input models.Bank
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Prevent accidental overwrite of ID
	input.ID = item.ID

	// Use GORM's Updates to only change provided fields. This will respect
	// zero-values for fields if they are omitted by the client.
	fmt.Printf("[UpdateBank] id=%v payload=%+v\n", id, input)
	if err := banksDB.Model(&item).Updates(input).Error; err != nil {
		fmt.Printf("[UpdateBank] update error: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Reload the updated record
	if err := banksDB.First(&item, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to load updated record"})
	}

	return c.JSON(item)
}

func DeleteBank(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" || id == "undefined" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid ID: empty or undefined"})
	}

	var bank models.Bank
	if err := banksDB.First(&bank, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Bank not found"})
	}
	if err := banksDB.Delete(&bank).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete bank: " + err.Error()})
	}
	return c.SendStatus(204)
}

// GET /api/banks/from-users
// Build bank-like records from users table where users have bank/account fields filled
func GetBanksFromUsers(c *fiber.Ctx) error {
	var users []models.User

	// Get bank details from users table
	query := usersDB.Where("bank_name IS NOT NULL OR account_number IS NOT NULL")

	if err := query.Select("usercode", "firstname", "lastname", "bank_name", "branch_name", "branch_address", "account_number", "ifsc_code").Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch bank details from users"})
	}

	// Also get all banks from the banks table
	var banks []models.Bank
	if err := banksDB.Find(&banks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch banks"})
	}

	// Transform to format matching the bank table structure
	type BankInfo struct {
		ID            uint    `json:"id,omitempty"`
		UserID        *uint   `json:"user_id,omitempty"`
		UserCode      string  `json:"user_code"`
		UserName      string  `json:"user_name"`
		Name          string  `json:"name"` // bank name
		BranchName    string  `json:"branch_name"`
		BranchAddress string  `json:"branch_address"`
		AccountNumber string  `json:"account_number"`
		IFSCCode      string  `json:"ifsc_code"`
		Balance       float64 `json:"balance"`
	}

	bankInfos := make([]BankInfo, 0)

	// Add records from users table (these won't have IDs since they're not in banks table)
	for _, user := range users {
		if user.BankName != nil || user.AccountNumber != nil {
			bankInfos = append(bankInfos, BankInfo{
				UserCode:      stringOrEmpty(user.Usercode),
				UserName:      user.Firstname + " " + user.Lastname,
				Name:          stringOrEmpty(user.BankName),
				BranchName:    stringOrEmpty(user.BranchName),
				BranchAddress: stringOrEmpty(user.BranchAddress),
				AccountNumber: stringOrEmpty(user.AccountNumber),
				IFSCCode:      stringOrEmpty(user.IFSCCode),
				Balance:       0,
			})
		}
	}

	// Add records from banks table (these will have IDs and can be edited)
	for _, bank := range banks {
		bankInfos = append(bankInfos, BankInfo{
			ID:            bank.ID,
			UserID:        bank.UserID,
			UserCode:      stringOrEmpty(bank.UserCode),
			UserName:      stringOrEmpty(bank.UserName),
			Name:          bank.Name,
			BranchName:    bank.BranchName,
			BranchAddress: bank.BranchAddress,
			AccountNumber: bank.AccountNumber,
			IFSCCode:      bank.IFSCCode,
			Balance:       bank.Balance,
		})
	}

	return c.JSON(bankInfos)
}

// Helper to handle nil string pointers
func stringOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
