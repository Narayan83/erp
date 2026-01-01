package handler

import (
	"errors"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var employeeDB *gorm.DB

func SetEmployeeDB(db *gorm.DB) {
	employeeDB = db
}

// Request structs
type CreateEmployeeRequest struct {
	Empcode      *string `json:"empcode"`
	Username     *string `json:"username"`
	Salutation   *string `json:"salutation"`
	Firstname    string  `json:"firstname"`
	Lastname     string  `json:"lastname"`
	DOB          *string `json:"dob"`
	Country      *string `json:"country"`
	Gender       string  `json:"gender"`
	CountryCode  string  `json:"country_code"`
	MobileNumber string  `json:"mobile_number"`
	Email        string  `json:"email"`
	Password     string  `json:"password"`
	Active       bool    `json:"active"`
	// Permanent address
	PermanentAddress1 *string `json:"permanent_address1"`
	PermanentAddress2 *string `json:"permanent_address2"`
	PermanentAddress3 *string `json:"permanent_address3"`
	PermanentCity     *string `json:"permanent_city"`
	PermanentState    *string `json:"permanent_state"`
	PermanentCountry  *string `json:"permanent_country"`
	PermanentPincode  *string `json:"permanent_pincode"`
	// Primary bank
	PrimaryBankName      *string `json:"primary_bank_name"`
	PrimaryBranchName    *string `json:"primary_branch_name"`
	PrimaryBranchAddress *string `json:"primary_branch_address"`
	PrimaryAccountNumber *string `json:"primary_account_number"`
	PrimaryIFSCCode      *string `json:"primary_ifsc_code"`
}

type UpdateEmployeeRequest struct {
	Username     *string `json:"username"`
	Salutation   *string `json:"salutation"`
	Firstname    *string `json:"firstname"`
	Lastname     *string `json:"lastname"`
	MobileNumber *string `json:"mobile_number"`
	Email        *string `json:"email"`
	Password     *string `json:"password"`
	Active       *bool   `json:"active"`
	DOB          *string `json:"dob"`
	Country      *string `json:"country"`
	CountryCode  *string `json:"country_code"`
	Designation  *string `json:"designation"`

	// Permanent Address fields
	PermanentAddress1    *string `json:"permanent_address1"`
	PermanentAddress2    *string `json:"permanent_address2"`
	PermanentAddress3    *string `json:"permanent_address3"`
	PermanentCity        *string `json:"permanent_city"`
	PermanentState       *string `json:"permanent_state"`
	PermanentCountry     *string `json:"permanent_country"`
	PermanentCountryCode *string `json:"permanent_country_code"`
	PermanentPincode     *string `json:"permanent_pincode"`
	PermanentGSTIN       *string `json:"permanent_gstin"`

	// Primary Bank Information
	PrimaryBankName      *string `json:"primary_bank_name"`
	PrimaryBranchName    *string `json:"primary_branch_name"`
	PrimaryBranchAddress *string `json:"primary_branch_address"`
	PrimaryAccountNumber *string `json:"primary_account_number"`
	PrimaryIFSCCode      *string `json:"primary_ifsc_code"`
}

// Password hashing helper
func hashEmployeePassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// Helper to get string from pointer
func getString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// Create Employee
func CreateEmployee(c *fiber.Ctx) error {
	var body CreateEmployeeRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	hashedPassword, err := hashEmployeePassword(body.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Password encryption failed"})
	}

	var dob *time.Time
	if body.DOB != nil {
		parsed, err := time.Parse("2006-01-02", *body.DOB)
		if err == nil {
			dob = &parsed
		}
	}

	// Create a User record with IsEmployee flag set to true
	user := models.User{
		Usercode:      body.Empcode,
		Username:      getString(body.Username),
		Salutation:    body.Salutation,
		Firstname:     body.Firstname,
		Lastname:      body.Lastname,
		DOB:           dob,
		Gender:        models.Gender(body.Gender),
		Country:       getString(body.Country),
		CountryCode:   body.CountryCode,
		MobileNumber:  body.MobileNumber,
		Email:         body.Email,
		Password:      hashedPassword,
		PlainPassword: body.Password,
		Active:        body.Active,
		IsEmployee:    true, // Mark this user as an employee
	}

	// Use transaction so that user and related records are created atomically
	tx := employeeDB.Begin()
	if tx.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": tx.Error.Error()})
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Create permanent address if provided
	if body.PermanentAddress1 != nil || body.PermanentCity != nil || body.PermanentState != nil || body.PermanentCountry != nil || body.PermanentPincode != nil {
		addr := models.UserAddress{
			UserID:   user.ID,
			Title:    "Permanent",
			Address1: getString(body.PermanentAddress1),
			Address2: getString(body.PermanentAddress2),
			Address3: getString(body.PermanentAddress3),
			City:     getString(body.PermanentCity),
			State:    getString(body.PermanentState),
			Country:  getString(body.PermanentCountry),
			Pincode:  getString(body.PermanentPincode),
		}
		if err := tx.Create(&addr).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	// Create primary bank if provided
	if body.PrimaryBankName != nil || body.PrimaryAccountNumber != nil || body.PrimaryIFSCCode != nil {
		bank := models.UserBankAccount{
			UserID:        user.ID,
			BankName:      getString(body.PrimaryBankName),
			BranchName:    getString(body.PrimaryBranchName),
			BranchAddress: getString(body.PrimaryBranchAddress),
			AccountNumber: getString(body.PrimaryAccountNumber),
			IFSCCode:      getString(body.PrimaryIFSCCode),
		}
		if err := tx.Create(&bank).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Reload user with associations
	var created models.User
	if err := employeeDB.Preload("Addresses").Preload("BankAccounts").Preload("Documents").First(&created, user.ID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(created)
}

// Get All Employees (with search)
func GetEmployees(c *fiber.Ctx) error {
	search := c.Query("search")
	var employees []models.User
	query := employeeDB.Model(&models.User{}).Where("is_employee = ?", true)

	if search != "" {
		query = query.Where("firstname ILIKE ? OR lastname ILIKE ? OR mobile_number ILIKE ? OR usercode ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		Find(&employees).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(employees)
}

// Get employees who are not department heads
func GetNonHeadEmployees(c *fiber.Ctx) error {
	// Return users marked as employees who are not set as department heads
	var users []models.User

	err := employeeDB.
		Model(&models.User{}).
		Joins("LEFT JOIN departments d ON users.id = d.head_id").
		Where("d.head_id IS NULL AND users.is_employee = ?", true).
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		Find(&users).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(users)
}

// Get Single Employee
func GetEmployee(c *fiber.Ctx) error {
	id := c.Params("id")

	var employee models.User
	err := employeeDB.
		Where("is_employee = ?", true).
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&employee, id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
	}

	return c.JSON(employee)
}

// Update Employee
func UpdateEmployee(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateEmployeeRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var employee models.User
	if err := employeeDB.Where("is_employee = ?", true).First(&employee, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
	}

	updateData := map[string]interface{}{}

	if body.Firstname != nil {
		updateData["firstname"] = *body.Firstname
	}
	if body.Lastname != nil {
		updateData["lastname"] = *body.Lastname
	}
	if body.Email != nil {
		updateData["email"] = *body.Email
	}
	if body.MobileNumber != nil {
		updateData["mobile_number"] = *body.MobileNumber
	}
	if body.Salutation != nil {
		updateData["salutation"] = *body.Salutation
	}
	if body.Active != nil {
		updateData["active"] = *body.Active
	}

	if body.DOB != nil {
		if parsed, err := time.Parse("2006-01-02", *body.DOB); err == nil {
			updateData["dob"] = parsed
		}
	}

	if body.Country != nil {
		updateData["country"] = *body.Country
	}

	if body.CountryCode != nil {
		updateData["country_code"] = *body.CountryCode
	}

	if body.Designation != nil {
		updateData["designation"] = *body.Designation
	}

	if body.Password != nil {
		hashed, _ := hashEmployeePassword(*body.Password)
		updateData["password"] = hashed
	}

	if body.Password != nil {
		// store plain password as well for display consistency with user endpoint
		updateData["plain_password"] = *body.Password
	}

	if len(updateData) > 0 {
		updateData["updated_at"] = time.Now()
		employeeDB.Model(&employee).Updates(updateData)
	}

	if body.Username != nil {
		// Update username separately if provided
		employeeDB.Model(&employee).Update("username", *body.Username)
	}

	// Handle permanent address update/create
	if body.PermanentAddress1 != nil || body.PermanentCity != nil || body.PermanentState != nil || body.PermanentCountry != nil {
		// Check if permanent address exists
		var permanentAddr models.UserAddress
		err := employeeDB.Where("user_id = ? AND title = ?", employee.ID, "Permanent").First(&permanentAddr).Error

		if err == nil {
			// Update existing permanent address
			addrUpdate := map[string]interface{}{}
			if body.PermanentAddress1 != nil {
				addrUpdate["address1"] = *body.PermanentAddress1
			}
			if body.PermanentAddress2 != nil {
				addrUpdate["address2"] = *body.PermanentAddress2
			}
			if body.PermanentAddress3 != nil {
				addrUpdate["address3"] = *body.PermanentAddress3
			}
			if body.PermanentCity != nil {
				addrUpdate["city"] = *body.PermanentCity
			}
			if body.PermanentState != nil {
				addrUpdate["state"] = *body.PermanentState
			}
			if body.PermanentCountry != nil {
				addrUpdate["country"] = *body.PermanentCountry
			}
			if body.PermanentCountryCode != nil {
				addrUpdate["country_code"] = *body.PermanentCountryCode
			}
			if body.PermanentPincode != nil {
				addrUpdate["pincode"] = *body.PermanentPincode
			}
			if body.PermanentGSTIN != nil {
				addrUpdate["gstin"] = *body.PermanentGSTIN
			}
			if len(addrUpdate) > 0 {
				employeeDB.Model(&permanentAddr).Updates(addrUpdate)
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new permanent address
			newPermanentAddr := models.UserAddress{
				UserID:      employee.ID,
				Title:       "Permanent",
				Address1:    stringPtrToString(body.PermanentAddress1),
				Address2:    stringPtrToString(body.PermanentAddress2),
				Address3:    stringPtrToString(body.PermanentAddress3),
				City:        stringPtrToString(body.PermanentCity),
				State:       stringPtrToString(body.PermanentState),
				Country:     stringPtrToString(body.PermanentCountry),
				CountryCode: stringPtrToString(body.PermanentCountryCode),
				Pincode:     stringPtrToString(body.PermanentPincode),
				GSTIN:       stringPtrToString(body.PermanentGSTIN),
			}
			if err := employeeDB.Create(&newPermanentAddr).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create permanent address", "details": err.Error()})
			}
		}
	}

	// Handle primary bank account update/create
	if body.PrimaryBankName != nil || body.PrimaryAccountNumber != nil {
		// For simplicity, find first bank account or create if none exists
		var primaryBank models.UserBankAccount
		err := employeeDB.Where("user_id = ?", employee.ID).First(&primaryBank).Error

		if err == nil {
			// Update existing bank account
			bankUpdate := map[string]interface{}{}
			if body.PrimaryBankName != nil {
				bankUpdate["bank_name"] = *body.PrimaryBankName
			}
			if body.PrimaryBranchName != nil {
				bankUpdate["branch_name"] = *body.PrimaryBranchName
			}
			if body.PrimaryBranchAddress != nil {
				bankUpdate["branch_address"] = *body.PrimaryBranchAddress
			}
			if body.PrimaryAccountNumber != nil {
				bankUpdate["account_number"] = *body.PrimaryAccountNumber
			}
			if body.PrimaryIFSCCode != nil {
				bankUpdate["ifsc_code"] = *body.PrimaryIFSCCode
			}
			if len(bankUpdate) > 0 {
				employeeDB.Model(&primaryBank).Updates(bankUpdate)
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new bank account
			newPrimaryBank := models.UserBankAccount{
				UserID:        employee.ID,
				BankName:      stringPtrToString(body.PrimaryBankName),
				BranchName:    stringPtrToString(body.PrimaryBranchName),
				BranchAddress: stringPtrToString(body.PrimaryBranchAddress),
				AccountNumber: stringPtrToString(body.PrimaryAccountNumber),
				IFSCCode:      stringPtrToString(body.PrimaryIFSCCode),
			}
			if err := employeeDB.Create(&newPrimaryBank).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create primary bank account", "details": err.Error()})
			}
		}
	}

	// Reload employee with associations to return complete data
	employeeDB.Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&employee, employee.ID)

	return c.JSON(employee)
}

// Soft Delete Employee
func DeleteEmployee(c *fiber.Ctx) error {
	id := c.Params("id")

	// Use a transaction to remove or nullify dependent references first to
	// avoid foreign key constraint violations (department relations, role mappings, etc.).
	tx := employeeDB.Begin()
	if tx.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": tx.Error.Error()})
	}

	// If this user is set as a department head, nullify the HeadID
	if err := tx.Model(&models.Department{}).Where("head_id = ?", id).Update("head_id", nil).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to nullify department head", "details": err.Error()})
	}

	// Remove any department relations where this user is employee or assignee
	if err := tx.Where("employee_id = ? OR assigned_by_id = ?", id, id).Delete(&models.DepartmentRelation{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete department relations", "details": err.Error()})
	}

	// Remove role mappings
	if err := tx.Where("user_id = ?", id).Delete(&models.UserRoleMapping{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user role mappings", "details": err.Error()})
	}

	// Remove addresses, bank accounts and documents explicitly (some models may have cascade set, but be explicit)
	if err := tx.Where("user_id = ?", id).Delete(&models.UserAddress{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user addresses", "details": err.Error()})
	}
	if err := tx.Where("user_id = ?", id).Delete(&models.UserBankAccount{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user bank accounts", "details": err.Error()})
	}
	if err := tx.Where("user_id = ?", id).Delete(&models.UserDocument{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user documents", "details": err.Error()})
	}

	// Finally delete the user record (only if it is an employee)
	if err := tx.Model(&models.User{}).Where("is_employee = ?", true).Delete(&models.User{}, id).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user", "details": err.Error()})
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "transaction commit failed", "details": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Employee deleted"})
}

// 🔄 Restore Employee
func RestoreEmployee(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := employeeDB.Unscoped().Model(&models.User{}).
		Where("id = ? AND is_employee = ?", id, true).
		Update("deleted_at", nil).Error; err != nil {

		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Employee restored"})
}

// ❌ Force Delete Employee
func ForceDeleteEmployee(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := employeeDB.Unscoped().Where("is_employee = ?", true).Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Employee permanently deleted"})
}
