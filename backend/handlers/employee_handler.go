package handler

import (
	"time"

	"fmt"
	"strings"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var employeeDB *gorm.DB

func SetEmployeeDB(db *gorm.DB) {
	employeeDB = db
}

/* ================= DTOs ================= */

type CreateEmployeeRequest struct {
	UserID        uint     `json:"user_id"`
	EmpCode       *string  `json:"empcode,omitempty"`
	DepartmentID  *uint    `json:"department_id,omitempty"`
	DesignationID *uint    `json:"designation_id,omitempty"`
	JoiningDate   *string  `json:"joining_date,omitempty"`
	ExitDate      *string  `json:"exit_date,omitempty"`
	Salary        *float64 `json:"salary,omitempty"`
	WorkEmail     string   `json:"work_email,omitempty"`
	Remarks       string   `json:"remarks,omitempty"`
}

type UpdateEmployeeRequest struct {
	UserID        *uint    `json:"user_id"`
	EmpCode       *string  `json:"empcode"`
	DepartmentID  *uint    `json:"department_id"`
	DesignationID *uint    `json:"designation_id"`
	JoiningDate   *string  `json:"joining_date"`
	ExitDate      *string  `json:"exit_date"`
	Salary        *float64 `json:"salary"`
	WorkEmail     *string  `json:"work_email"`
	Remarks       *string  `json:"remarks"`
}

/* ================= HELPERS ================= */

func parseDate(str *string) *time.Time {
	if str == nil || *str == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, *str)
	if err != nil {
		// fallback: YYYY-MM-DD
		t2, err2 := time.Parse("2006-01-02", *str)
		if err2 != nil {
			return nil
		}
		return &t2
	}
	return &t
}

/* ================= HANDLERS ================= */

// Request structs
type CreateEmployeeAsUserRequest struct {
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
	// Contact information
	EmergencyNumber *string `json:"emergency_number"`
	// Legal/Document fields
	AadharNumber *string `json:"aadhar_number"`
	PANNumber    *string `json:"pan_number"`
	// Permanent address
	PermanentAddress1 *string `json:"permanent_address1"`
	PermanentAddress2 *string `json:"permanent_address2"`
	PermanentAddress3 *string `json:"permanent_address3"`
	PermanentCity     *string `json:"permanent_city"`
	PermanentState    *string `json:"permanent_state"`
	PermanentCountry  *string `json:"permanent_country"`
	PermanentPincode  *string `json:"permanent_pincode"`
	// Residential address
	ResidentialAddress1 *string `json:"residential_address1"`
	ResidentialAddress2 *string `json:"residential_address2"`
	ResidentialAddress3 *string `json:"residential_address3"`
	ResidentialCity     *string `json:"residential_city"`
	ResidentialState    *string `json:"residential_state"`
	ResidentialCountry  *string `json:"residential_country"`
	ResidentialPincode  *string `json:"residential_pincode"`
	// Primary bank
	PrimaryBankName      *string `json:"primary_bank_name"`
	PrimaryBranchName    *string `json:"primary_branch_name"`
	PrimaryBranchAddress *string `json:"primary_branch_address"`
	PrimaryAccountNumber *string `json:"primary_account_number"`
	PrimaryIFSCCode      *string `json:"primary_ifsc_code"`
}

type UpdateEmployeeAsUserRequest struct {
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
	// Contact information
	EmergencyNumber *string `json:"emergency_number"`
	// Legal/Document fields
	AadharNumber *string `json:"aadhar_number"`
	PANNumber    *string `json:"pan_number"`

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

	// Residential Address fields
	ResidentialAddress1 *string `json:"residential_address1"`
	ResidentialAddress2 *string `json:"residential_address2"`
	ResidentialAddress3 *string `json:"residential_address3"`
	ResidentialCity     *string `json:"residential_city"`
	ResidentialState    *string `json:"residential_state"`
	ResidentialCountry  *string `json:"residential_country"`
	ResidentialPincode  *string `json:"residential_pincode"`

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
func CreateEmployeeAsUser(c *fiber.Ctx) error {
	var body CreateEmployeeAsUserRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// DEBUG: log parsed permanent and residential fields to diagnose import issue
	fmt.Printf("CreateEmployee parsed permanent fields: perm1=%v perm2=%v perm3=%v city=%v state=%v country=%v pincode=%v\n",
		body.PermanentAddress1, body.PermanentAddress2, body.PermanentAddress3, body.PermanentCity, body.PermanentState, body.PermanentCountry, body.PermanentPincode)
	fmt.Printf("CreateEmployee parsed residential fields: res1=%v res2=%v res3=%v city=%v state=%v country=%v pincode=%v\n",
		body.ResidentialAddress1, body.ResidentialAddress2, body.ResidentialAddress3, body.ResidentialCity, body.ResidentialState, body.ResidentialCountry, body.ResidentialPincode)

	// Debug: ensure email is present and log user basic info
	fmt.Printf("CreateEmployee parsed basic info: email=%q mobile=%q firstname=%q lastname=%q\n", body.Email, body.MobileNumber, body.Firstname, body.Lastname)

	// Validation: Email is required
	if strings.TrimSpace(body.Email) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email is required and cannot be empty"})
	}

	// Validation: Mobile number is required
	if strings.TrimSpace(body.MobileNumber) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Mobile number is required and cannot be empty"})
	}

	// Validation: First name is required
	if strings.TrimSpace(body.Firstname) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "First name is required and cannot be empty"})
	}

	// Validation: Last name is required
	if strings.TrimSpace(body.Lastname) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Last name is required and cannot be empty"})
	}

	// Validation: Password is required
	if strings.TrimSpace(body.Password) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Password is required and cannot be empty"})
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
		Usercode:        body.Empcode,
		Username:        getString(body.Username),
		Salutation:      body.Salutation,
		Firstname:       body.Firstname,
		Lastname:        body.Lastname,
		DOB:             dob,
		Gender:          models.Gender(body.Gender),
		Country:         getString(body.Country),
		CountryCode:     body.CountryCode,
		MobileNumber:    body.MobileNumber,
		Email:           body.Email,
		Password:        hashedPassword,
		PlainPassword:   body.Password,
		Active:          body.Active,
		EmergencyNumber: body.EmergencyNumber,
		AadharNumber:    getString(body.AadharNumber),
		PANNumber:       getString(body.PANNumber),
		IsEmployee:      true, // Mark this user as an employee
	}

	// Use transaction so that user and related records are created atomically
	tx := employeeDB.Begin()
	if tx.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": tx.Error.Error()})
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		errMsg := err.Error()
		fmt.Printf("DEBUG: Database error creating user: %v\n", errMsg)
		fmt.Printf("DEBUG: User data: Email=%q, MobileNumber=%q, Firstname=%q, Lastname=%q\n", user.Email, user.MobileNumber, user.Firstname, user.Lastname)
		// Check for specific constraint violations and provide helpful messages
		if strings.Contains(errMsg, "email") && strings.Contains(errMsg, "not-null") {
			return c.Status(400).JSON(fiber.Map{"error": "Email is required - cannot be empty", "field": "email"})
		}
		if strings.Contains(errMsg, "email") && strings.Contains(errMsg, "unique") {
			return c.Status(409).JSON(fiber.Map{"error": "Email already exists - please use a different email", "field": "email"})
		}
		if strings.Contains(errMsg, "mobile") && strings.Contains(errMsg, "unique") {
			return c.Status(409).JSON(fiber.Map{"error": "Mobile number already exists - please use a different number", "field": "mobile_number"})
		}
		return c.Status(500).JSON(fiber.Map{"error": errMsg})
	}

	// Create permanent address if provided (check all fields)
	if body.PermanentAddress1 != nil || body.PermanentAddress2 != nil || body.PermanentAddress3 != nil || body.PermanentCity != nil || body.PermanentState != nil || body.PermanentCountry != nil || body.PermanentPincode != nil {
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

	// Create residential address if provided (check all fields)
	if body.ResidentialAddress1 != nil || body.ResidentialAddress2 != nil || body.ResidentialAddress3 != nil || body.ResidentialCity != nil || body.ResidentialState != nil || body.ResidentialCountry != nil || body.ResidentialPincode != nil {
		resAddr := models.UserAddress{
			UserID:   user.ID,
			Title:    "Residential",
			Address1: getString(body.ResidentialAddress1),
			Address2: getString(body.ResidentialAddress2),
			Address3: getString(body.ResidentialAddress3),
			City:     getString(body.ResidentialCity),
			State:    getString(body.ResidentialState),
			Country:  getString(body.ResidentialCountry),
			Pincode:  getString(body.ResidentialPincode),
		}
		if err := tx.Create(&resAddr).Error; err != nil {
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

	// ⭐ CREATE EMPLOYEE ENTRY (ADD THIS HERE)
	employee := models.Employee{
		UserID:  user.ID,
		EmpCode: body.Empcode,
	}

	if err := tx.Create(&employee).Error; err != nil {
		tx.Rollback()
		errMsg := err.Error()
		return c.Status(500).JSON(fiber.Map{"error": errMsg})
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

func CreateEmployee(c *fiber.Ctx) error {
	var body CreateEmployeeRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	item := models.Employee{
		UserID:        body.UserID,
		EmpCode:       body.EmpCode,
		DepartmentID:  body.DepartmentID,
		DesignationID: body.DesignationID,
		JoiningDate:   parseDate(body.JoiningDate),
		ExitDate:      parseDate(body.ExitDate),
		Salary:        body.Salary,
		WorkEmail:     body.WorkEmail,
		Remarks:       body.Remarks,
	}

	if err := employeeDB.Create(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	employeeDB.
		Preload("Department").
		Preload("Designation").
		Preload("User").
		First(&item, item.ID)

	return c.Status(201).JSON(item)
}

func GetEmployees(c *fiber.Ctx) error {
	var items []models.Employee
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	search := c.Query("search")

	offset := (page - 1) * limit

	query := employeeDB.Model(&models.Employee{})

	if search != "" {
		query = query.Where("work_email ILIKE ? OR emp_code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	query.Offset(offset).Limit(limit).
		Order("id desc").
		Preload("Department").
		Preload("Designation").
		Preload("User").
		Preload("User.Addresses").
		Preload("User.BankAccounts").
		Preload("User.Documents").
		Find(&items)

	// Extract only user data
	users := make([]models.User, 0)
	for _, emp := range items {
		users = append(users, emp.User)
	}

	return c.JSON(fiber.Map{
		"data":    users,
		"empData": items,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

func GetEmployee(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Employee

	if err := employeeDB.
		Preload("Department").
		Preload("Designation").
		Preload("User").
		First(&item, id).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(item)
}

func UpdateEmployee(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateEmployeeRequest
	var item models.Employee

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := employeeDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.UserID != nil {
		item.UserID = *body.UserID
	}
	if body.EmpCode != nil {
		item.EmpCode = body.EmpCode
	}
	if body.DepartmentID != nil {
		item.DepartmentID = body.DepartmentID
	}
	if body.DesignationID != nil {
		item.DesignationID = body.DesignationID
	}
	if body.JoiningDate != nil {
		item.JoiningDate = parseDate(body.JoiningDate)
	}
	if body.ExitDate != nil {
		item.ExitDate = parseDate(body.ExitDate)
	}
	if body.Salary != nil {
		item.Salary = body.Salary
	}
	if body.WorkEmail != nil {
		item.WorkEmail = *body.WorkEmail
	}
	if body.Remarks != nil {
		item.Remarks = *body.Remarks
	}

	if err := employeeDB.Save(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	employeeDB.
		Preload("Department").
		Preload("Designation").
		Preload("User").
		First(&item, id)

	return c.JSON(item)
}

func DeleteEmployee(c *fiber.Ctx) error {
	id := c.Params("id")
	var item models.Employee

	if err := employeeDB.First(&item, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := employeeDB.Delete(&item).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Employee deleted successfully"})
}
