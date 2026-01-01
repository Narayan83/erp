package handler

import (
	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
)

/* ================= REQUEST ================= */

type CreateCompanyBranchBankRequest struct {
	CompanyBranchID uint    `json:"company_branch_id"`
	BankName        string  `json:"bank_name"`
	BranchName      string  `json:"branch_name"`
	BranchAddress   string  `json:"branch_address"`
	AccountNumber   string  `json:"account_number"`
	IFSCCode        string  `json:"ifsc_code"`
	Balance         float64 `json:"balance"`
}

type UpdateCompanyBranchBankRequest struct {
	CompanyBranchID uint    `json:"company_branch_id"`
	BankName        string  `json:"bank_name"`
	BranchName      string  `json:"branch_name"`
	BranchAddress   string  `json:"branch_address"`
	AccountNumber   string  `json:"account_number"`
	IFSCCode        string  `json:"ifsc_code"`
	Balance         float64 `json:"balance"`
}

/* ================= CREATE ================= */

func CreateCompanyBranchBank(c *fiber.Ctx) error {
	var body CreateCompanyBranchBankRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	bank := models.CompanyBranchBank{
		CompanyBranchID: body.CompanyBranchID,
		BankName:        body.BankName,
		BranchName:      body.BranchName,
		BranchAddress:   body.BranchAddress,
		AccountNumber:   body.AccountNumber,
		IFSCCode:        body.IFSCCode,
		Balance:         body.Balance,
	}

	if err := companyBranchDB.Create(&bank).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(bank)
}

/* ================= UPDATE ================= */

func UpdateCompanyBranchBank(c *fiber.Ctx) error {
	id := c.Params("id")

	// find existing record
	var existing models.CompanyBranchBank
	if err := companyBranchDB.First(&existing, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Bank record not found"})
	}

	var body UpdateCompanyBranchBankRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// Use a map so zero values (e.g. balance = 0) are updated correctly
	updates := map[string]interface{}{
		"company_branch_id": body.CompanyBranchID,
		"bank_name":         body.BankName,
		"branch_name":       body.BranchName,
		"branch_address":    body.BranchAddress,
		"account_number":    body.AccountNumber,
		"ifsc_code":         body.IFSCCode,
		"balance":           body.Balance,
	}

	if err := companyBranchDB.Model(&existing).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// return updated record
	companyBranchDB.First(&existing, id)
	return c.JSON(existing)
}

func GetCompanyBranchBanks(c *fiber.Ctx) error {
	branchID := c.Query("company_branch_id")
	var banks []models.CompanyBranchBank

	query := companyBranchDB.Model(&models.CompanyBranchBank{})
	if branchID != "" {
		query = query.Where("company_branch_id = ?", branchID)
	}

	query.Find(&banks)
	return c.JSON(banks)
}

func DeleteCompanyBranchBank(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := companyBranchDB.Delete(&models.CompanyBranchBank{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Branch bank deleted"})
}
