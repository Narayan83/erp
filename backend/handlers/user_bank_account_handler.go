package handler

import (
	"encoding/json"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var userBankDB *gorm.DB

func SetUserBankDB(db *gorm.DB) {
	userBankDB = db
}

type CreateUserBankAccountRequest struct {
	UserID        uint        `json:"user_id"`
	BankName      string      `json:"bank_name"`
	BranchName    string      `json:"branch_name"`
	BranchAddress string      `json:"branch_address"`
	AccountNumber string      `json:"account_number"`
	IFSCCode      string      `json:"ifsc_code"`
	KeyValues     interface{} `json:"keyValues"`
}

type UpdateUserBankAccountRequest struct {
	BankName      *string     `json:"bank_name"`
	BranchName    *string     `json:"branch_name"`
	BranchAddress *string     `json:"branch_address"`
	AccountNumber *string     `json:"account_number"`
	IFSCCode      *string     `json:"ifsc_code"`
	KeyValues     interface{} `json:"keyValues"`
}

// Allow arbitrary JSON for additional bank infos (key-value pairs)
type CreateUserBankAccountRequestWithExtras struct {
	CreateUserBankAccountRequest
	AdditionalBankInfos datatypes.JSON `json:"additional_bank_infos"`
}

type UpdateUserBankAccountRequestWithExtras struct {
	UpdateUserBankAccountRequest
	AdditionalBankInfos *datatypes.JSON `json:"additional_bank_infos"`
}

func CreateUserBankAccount(c *fiber.Ctx) error {
	var body CreateUserBankAccountRequestWithExtras
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Validate User exists
	var user models.User
	if err := userBankDB.First(&user, body.UserID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	bank := models.UserBankAccount{
		UserID:              body.UserID,
		BankName:            body.BankName,
		BranchName:          body.BranchName,
		BranchAddress:       body.BranchAddress,
		AccountNumber:       body.AccountNumber,
		IFSCCode:            body.IFSCCode,
		AdditionalBankInfos: body.AdditionalBankInfos,
	}

	// Handle keyValues if provided
	if body.KeyValues != nil {
		kvBytes, err := json.Marshal(body.KeyValues)
		if err == nil {
			bank.KeyValues = kvBytes
		}
	}

	if err := userBankDB.Create(&bank).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(bank)
}

func GetUserBankAccounts(c *fiber.Ctx) error {
	var accounts []models.UserBankAccount
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")
	userID := c.Query("user_id")

	offset := (page - 1) * limit

	query := userBankDB.Model(&models.UserBankAccount{})

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if search != "" {
		query = query.Where("bank_name ILIKE ? OR branch_name ILIKE ? OR account_number ILIKE ? OR ifsc_code ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to count records"})
	}

	if err := query.Offset(offset).Limit(limit).Order("id desc").Find(&accounts).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  accounts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetUserBankAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	var bank models.UserBankAccount
	if err := userBankDB.First(&bank, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Bank account not found"})
	}

	return c.JSON(bank)
}

func UpdateUserBankAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	var bank models.UserBankAccount
	if err := userBankDB.First(&bank, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Bank account not found"})
	}

	var body UpdateUserBankAccountRequestWithExtras
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	updateData := map[string]interface{}{}

	if body.BankName != nil {
		updateData["bank_name"] = *body.BankName
	}
	if body.BranchName != nil {
		updateData["branch_name"] = *body.BranchName
	}
	if body.BranchAddress != nil {
		updateData["branch_address"] = *body.BranchAddress
	}
	if body.AccountNumber != nil {
		updateData["account_number"] = *body.AccountNumber
	}
	if body.IFSCCode != nil {
		updateData["ifsc_code"] = *body.IFSCCode
	}

	if body.AdditionalBankInfos != nil {
		updateData["additional_bank_infos"] = body.AdditionalBankInfos
	}

	if body.KeyValues != nil {
		kvBytes, err := json.Marshal(body.KeyValues)
		if err == nil {
			updateData["key_values"] = kvBytes
		}
	}

	userBankDB.Model(&bank).Updates(updateData)

	return c.JSON(bank)
}

func DeleteUserBankAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userBankDB.Delete(&models.UserBankAccount{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Bank account deleted"})
}
