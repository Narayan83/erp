package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var userDB *gorm.DB

func SetUserDB(db *gorm.DB) {
	userDB = db
}

type CreateUserRequest struct {
	Usercode        *string `json:"usercode"`
	Salutation      *string `json:"salutation"`
	Firstname       string  `json:"firstname"`
	Lastname        string  `json:"lastname"`
	DOB             *string `json:"dob"`
	Gender          string  `json:"gender"`
	Username        *string `json:"username"`
	Country         string  `json:"country"`
	CountryCode     string  `json:"country_code"`
	MobileNumber    string  `json:"mobile_number"`
	WhatsappNumber  *string `json:"whatsapp_number"`
	EmergencyNumber *string `json:"emergency_number"`
	AlternateNumber *string `json:"alternate_number"`
	Website         *string `json:"website"`
	Email           string  `json:"email"`
	Password        string  `json:"password"`
	Active          *bool   `json:"active"`

	IsUser        bool `json:"is_user"`
	IsCustomer    bool `json:"is_customer"`
	IsSupplier    bool `json:"is_supplier"`
	IsEmployee    bool `json:"is_employee"`
	IsDealer      bool `json:"is_dealer"`
	IsDistributor bool `json:"is_distributor"`

	// Business Information
	BusinessName    *string `json:"business_name"`
	CompanyName     *string `json:"company_name"`
	IndustrySegment *string `json:"industry_segment"`
	Designation     *string `json:"designation"`
	Title           *string `json:"title"`

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
	PrimaryBankName           *string     `json:"primary_bank_name"`
	PrimaryBranchName         *string     `json:"primary_branch_name"`
	PrimaryBranchAddress      *string     `json:"primary_branch_address"`
	PrimaryAccountNumber      *string     `json:"primary_account_number"`
	PrimaryIFSCCode           *string     `json:"primary_ifsc_code"`
	PrimaryAdditionalBankInfo interface{} `json:"primary_additional_bank_info,omitempty"`

	// Legal/Document fields
	AadharNumber *string `json:"aadhar_number"`
	PANNumber    *string `json:"pan_number"`
	GSTINNumber  *string `json:"gstin_number"`
	MSMENo       *string `json:"msme_no"`

	// Additional addresses and bank accounts to create for this user
	Addresses    []AddressPayload     `json:"addresses"`
	BankAccounts []BankAccountPayload `json:"bank_accounts"`
}

type UpdateUserRequest struct {
	Usercode        *string `json:"usercode"`
	Salutation      *string `json:"salutation"`
	Firstname       *string `json:"firstname"`
	Lastname        *string `json:"lastname"`
	DOB             *string `json:"dob"`
	Gender          *string `json:"gender"`
	Country         *string `json:"country"`
	CountryCode     *string `json:"country_code"`
	MobileNumber    *string `json:"mobile_number"`
	WhatsappNumber  *string `json:"whatsapp_number"`
	EmergencyNumber *string `json:"emergency_number"`
	AlternateNumber *string `json:"alternate_number"`
	Website         *string `json:"website"`
	Email           *string `json:"email"`
	Password        *string `json:"password"`
	Username        *string `json:"username"`
	Active          *bool   `json:"active"`

	// Business Information
	BusinessName    *string `json:"business_name"`
	CompanyName     *string `json:"company_name"`
	IndustrySegment *string `json:"industry_segment"`
	Designation     *string `json:"designation"`
	Title           *string `json:"title"`

	// Account types
	IsUser        *bool `json:"is_user"`
	IsCustomer    *bool `json:"is_customer"`
	IsSupplier    *bool `json:"is_supplier"`
	IsEmployee    *bool `json:"is_employee"`
	IsDealer      *bool `json:"is_dealer"`
	IsDistributor *bool `json:"is_distributor"`

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
	PrimaryBankName           *string     `json:"primary_bank_name"`
	PrimaryBranchName         *string     `json:"primary_branch_name"`
	PrimaryBranchAddress      *string     `json:"primary_branch_address"`
	PrimaryAccountNumber      *string     `json:"primary_account_number"`
	PrimaryIFSCCode           *string     `json:"primary_ifsc_code"`
	PrimaryAdditionalBankInfo interface{} `json:"primary_additional_bank_info,omitempty"`

	// Legal/Document fields
	AadharNumber *string `json:"aadhar_number"`
	PANNumber    *string `json:"pan_number"`
	GSTINNumber  *string `json:"gstin_number"`
	MSMENo       *string `json:"msme_no"`

	// Optional addresses to create/update for this user
	Addresses []AddressPayload `json:"addresses"`
}

// AddressPayload represents an address item that can be created/updated
// together with the user payload.
type AddressPayload struct {
	ID          *uint       `json:"id"`
	Title       *string     `json:"title"`
	Address1    *string     `json:"address1"`
	Address2    *string     `json:"address2"`
	Address3    *string     `json:"address3"`
	City        *string     `json:"city"`
	State       *string     `json:"state"`
	Country     *string     `json:"country"`
	CountryCode *string     `json:"country_code"`
	Pincode     *string     `json:"pincode"`
	GSTIN       *string     `json:"gstin"`
	KeyValues   interface{} `json:"keyValues,omitempty"`
}

// BankAccountPayload represents a bank account item that can be created/updated
// together with the user payload.
type BankAccountPayload struct {
	ID            *uint       `json:"id"`
	BankName      *string     `json:"bank_name"`
	BranchName    *string     `json:"branch_name"`
	BranchAddress *string     `json:"branch_address"`
	AccountNumber *string     `json:"account_number"`
	IFSCCode      *string     `json:"ifsc_code"`
	KeyValues     interface{} `json:"keyValues,omitempty"`
}

type UserWithHierarchyResponse struct {
	User      models.User            `json:"user"`
	Hierarchy []models.UserHierarchy `json:"hierarchy"`
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CreateUser(c *fiber.Ctx) error {
	var body CreateUserRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid Request",
			"message": "Failed to parse request body",
			"details": err.Error(),
		})
	}

	// Validate required fields
	if body.Firstname == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Firstname is required",
			"field":   "firstname",
			"message": "Please provide a first name",
		})
	}
	if body.Email == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Email is required",
			"field":   "email",
			"message": "Please provide an email address",
		})
	}
	if body.MobileNumber == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Mobile number is required",
			"field":   "mobile_number",
			"message": "Please provide a mobile number",
		})
	}
	if body.Password == "" {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Password is required",
			"field":   "password",
			"message": "Please provide a password",
		})
	}

	// Check if email already exists
	var existingUser models.User
	if err := userDB.Where("email = ?", body.Email).First(&existingUser).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{
			"error":   "A user with this email already exists",
			"field":   "email",
			"message": "Please use a different email address",
		})
	}

	// Check if mobile number already exists
	if err := userDB.Where("mobile_number = ?", body.MobileNumber).First(&existingUser).Error; err == nil {
		return c.Status(409).JSON(fiber.Map{
			"error":   "A user with this mobile number already exists",
			"field":   "mobile_number",
			"message": "Please use a different mobile number",
		})
	}

	hashedPassword, err := hashPassword(body.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Password encryption failed",
			"message": "Failed to encrypt password",
			"details": err.Error(),
		})
	}

	// Parse DOB if provided
	var dobPtr *time.Time
	if body.DOB != nil && *body.DOB != "" {
		// Try parsing different date formats
		formats := []string{
			"2006-01-02",
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05.000Z",
			time.RFC3339,
		}
		var parsedDOB time.Time
		var parseErr error
		for _, format := range formats {
			parsedDOB, parseErr = time.Parse(format, *body.DOB)
			if parseErr == nil {
				dobPtr = &parsedDOB
				break
			}
		}
		if parseErr != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Invalid date format for DOB",
				"field":   "dob",
				"message": "Please provide a valid date",
				"details": parseErr.Error(),
			})
		}
	}

	// Set default active status if not provided
	active := true
	if body.Active != nil {
		active = *body.Active
	}

	user := models.User{
		Usercode:        body.Usercode,
		Salutation:      body.Salutation,
		Firstname:       body.Firstname,
		Lastname:        body.Lastname,
		DOB:             dobPtr,
		Gender:          models.Gender(body.Gender),
		Username:        stringPtrToString(body.Username),
		Country:         body.Country,
		CountryCode:     body.CountryCode,
		MobileNumber:    body.MobileNumber,
		WhatsappNumber:  body.WhatsappNumber,
		EmergencyNumber: body.EmergencyNumber,
		AlternateNumber: body.AlternateNumber,
		Website:         stringPtrToString(body.Website),
		Email:           body.Email,
		Password:        hashedPassword,
		PlainPassword:   body.Password, // Store plain password for display
		Active:          active,
		IsUser:          body.IsUser,
		IsCustomer:      body.IsCustomer,
		IsSupplier:      body.IsSupplier,
		IsEmployee:      body.IsEmployee,
		IsDealer:        body.IsDealer,
		IsDistributor:   body.IsDistributor,
		// Business Information
		BusinessName:    stringPtrToString(body.BusinessName),
		CompanyName:     stringPtrToString(body.CompanyName),
		IndustrySegment: stringPtrToString(body.IndustrySegment),
		Designation:     stringPtrToString(body.Designation),
		Title:           stringPtrToString(body.Title),
		// Legal Information
		AadharNumber: stringPtrToString(body.AadharNumber),
		PANNumber:    stringPtrToString(body.PANNumber),
		GSTINNumber:  stringPtrToString(body.GSTINNumber),
		MSMENo:       stringPtrToString(body.MSMENo),
	}

	if err := userDB.Create(&user).Error; err != nil {
		// Check for unique constraint violations
		errMsg := err.Error()
		if strings.Contains(errMsg, "duplicate key") || strings.Contains(errMsg, "unique constraint") {
			if strings.Contains(errMsg, "email") {
				return c.Status(409).JSON(fiber.Map{
					"error":   "Email already exists",
					"field":   "email",
					"message": "A user with this email already exists",
				})
			}
			if strings.Contains(errMsg, "mobile_number") {
				return c.Status(409).JSON(fiber.Map{
					"error":   "Mobile number already exists",
					"field":   "mobile_number",
					"message": "A user with this mobile number already exists",
				})
			}
			if strings.Contains(errMsg, "usercode") {
				return c.Status(409).JSON(fiber.Map{
					"error":   "Usercode already exists",
					"field":   "usercode",
					"message": "A user with this usercode already exists",
				})
			}
		}
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to create user",
			"message": "Database error occurred",
			"details": err.Error(),
		})
	}

	// Create any additional addresses provided in the payload
	if len(body.Addresses) > 0 {
		for _, a := range body.Addresses {
			// skip empty entries
			if a.Title == nil && a.Address1 == nil && a.Address2 == nil && a.Address3 == nil && a.City == nil && a.State == nil && a.Country == nil && a.Pincode == nil {
				continue
			}

			addr := models.UserAddress{
				UserID:   user.ID,
				Title:    stringPtrToString(a.Title),
				Address1: stringPtrToString(a.Address1),
				Address2: stringPtrToString(a.Address2),
				Address3: stringPtrToString(a.Address3),
				City:     stringPtrToString(a.City),
				State:    stringPtrToString(a.State),
				Country:  stringPtrToString(a.Country),
				Pincode:  stringPtrToString(a.Pincode),
			}

			if err := userDB.Create(&addr).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create user address", "details": err.Error()})
			}
		}
	}

	// Create permanent address if provided
	if body.PermanentAddress1 != nil || body.PermanentCity != nil || body.PermanentState != nil || body.PermanentCountry != nil {
		permanentAddr := models.UserAddress{
			UserID:      user.ID,
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
		if err := userDB.Create(&permanentAddr).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create permanent address", "details": err.Error()})
		}
	}

	// Create primary bank account if provided (only if we have meaningful data)
	bankName := stringPtrToString(body.PrimaryBankName)
	accountNumber := stringPtrToString(body.PrimaryAccountNumber)

	if bankName != "" || accountNumber != "" {
		// Validate that we have minimum required fields
		if bankName == "" {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Validation error",
				"field":   "primary_bank_name",
				"message": "Bank name is required when providing bank account details",
			})
		}
		if accountNumber == "" {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Validation error",
				"field":   "primary_account_number",
				"message": "Account number is required when providing bank account details",
			})
		}

		primaryBank := models.UserBankAccount{
			UserID:        user.ID,
			BankName:      bankName,
			BranchName:    stringPtrToString(body.PrimaryBranchName),
			BranchAddress: stringPtrToString(body.PrimaryBranchAddress),
			AccountNumber: accountNumber,
			IFSCCode:      stringPtrToString(body.PrimaryIFSCCode),
		}
		if err := userDB.Create(&primaryBank).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create primary bank account", "details": err.Error()})
		}
	}

	// Reload user with relationships
	userDB.Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&user, user.ID)

	return c.Status(201).JSON(user)
}

// Helper function to convert string pointer to string
func stringPtrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func boolPtrToBool(b *bool) bool {
	if b == nil {
		return true // default to active
	}
	return *b
}

func GetUsers(c *fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")
	search := c.Query("filter", "")
	userType := c.Query("user_type", "")
	employeeIDStr := c.Query("employee_id", "")
	deptHeadIDStr := c.Query("dept_head", "")

	page := 1
	limit := 10
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	offset := (page - 1) * limit

	var users []models.User
	var total int64
	query := userDB.Model(&models.User{})

	// Apply search filter
	if search != "" {
		searchTerm := "%" + search + "%"
		sql := `
			firstname ILIKE ? OR 
			lastname ILIKE ? OR 
			email ILIKE ? OR 
			mobile_number ILIKE ? OR
			whatsapp_number ILIKE ? OR
			emergency_number ILIKE ? OR
			alternate_number ILIKE ? OR
			website ILIKE ? OR
			business_name ILIKE ? OR
			company_name ILIKE ? OR
			industry_segment ILIKE ? OR
			designation ILIKE ? OR
			title ILIKE ? OR
			aadhar_number ILIKE ? OR
			pan_number ILIKE ? OR
			gstin_number ILIKE ? OR
			msme_no ILIKE ? OR
			usercode ILIKE ? OR
			gender::text ILIKE ? OR
			country_code ILIKE ? OR
			COALESCE(dob::text, '') ILIKE ? OR
			EXISTS (
				SELECT 1 FROM user_addresses ua 
				WHERE ua.user_id = users.id AND (
					ua.address1 ILIKE ? OR
					ua.address2 ILIKE ? OR
					ua.address3 ILIKE ? OR
					ua.city ILIKE ? OR
					ua.state ILIKE ? OR
					ua.country ILIKE ? OR
					ua.pincode ILIKE ? OR
					ua.gstin ILIKE ?
				)
			) OR
			EXISTS (
				SELECT 1 FROM user_bank_accounts uba 
				WHERE uba.user_id = users.id AND (
					uba.bank_name ILIKE ? OR
					uba.branch_name ILIKE ? OR
					uba.branch_address ILIKE ? OR
					uba.account_number ILIKE ? OR
					uba.ifsc_code ILIKE ?
				)
			)
		`
		args := make([]interface{}, 34)
		for i := range args {
			args[i] = searchTerm
		}
		query = query.Where(sql, args...)
	}

	// Apply user type filter
	if userType != "" {
		switch userType {
		case "user":
			query = query.Where("is_user = ?", true)
		case "customer":
			query = query.Where("is_customer = ?", true)
		case "supplier":
			query = query.Where("is_supplier = ?", true)
		case "dealer":
			query = query.Where("is_dealer = ?", true)
		case "distributor":
			query = query.Where("is_distributor = ?", true)
		}
	} else {
		// When no user type filter, exclude employees to keep user list separate
		query = query.Where("is_employee = ?", false)
	}

	// Filter by employee (users assigned to a specific employee)
	if employeeIDStr != "" {
		if employeeID, err := strconv.Atoi(employeeIDStr); err == nil && employeeID > 0 {
			query = query.Joins("INNER JOIN employee_user_relations eur ON users.id = eur.user_id").
				Where("eur.employee_id = ?", employeeID)
		}
	} else if deptHeadIDStr != "" {
		// Filter by department head - show users assigned to any employee in departments where this user is the head
		if deptHeadID, err := strconv.Atoi(deptHeadIDStr); err == nil && deptHeadID > 0 {
			query = query.Joins("INNER JOIN employee_user_relations eur ON users.id = eur.user_id").
				Joins("INNER JOIN department_relations dr ON eur.employee_id = dr.employee_id").
				Joins("INNER JOIN departments dept ON dr.department_id = dept.id").
				Where("dept.head_id = ?", deptHeadID)
		}
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Apply pagination and fetch users
	if err := query.
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		Limit(limit).
		Offset(offset).
		Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	err := userDB.
		Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&user, id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Fetch user hierarchy relations
	var hierarchy []models.UserHierarchy
	if err := userDB.Where("parent_id = ? OR child_id = ?", user.ID, user.ID).Find(&hierarchy).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch user hierarchy"})
	}

	response := UserWithHierarchyResponse{
		User:      user,
		Hierarchy: hierarchy,
	}

	return c.JSON(response)
}

func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateUserRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request",
			"message": "Failed to parse request body",
			"details": err.Error(),
		})
	}

	var user models.User
	if err := userDB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	updateData := map[string]interface{}{}

	// Basic fields
	if body.Usercode != nil {
		updateData["usercode"] = *body.Usercode
	}
	if body.Salutation != nil {
		updateData["salutation"] = *body.Salutation
	}
	if body.Firstname != nil {
		updateData["firstname"] = *body.Firstname
	}
	if body.Lastname != nil {
		updateData["lastname"] = *body.Lastname
	}
	if body.Gender != nil {
		updateData["gender"] = *body.Gender
	}
	if body.Country != nil {
		updateData["country"] = *body.Country
	}
	if body.CountryCode != nil {
		updateData["country_code"] = *body.CountryCode
	}
	if body.MobileNumber != nil {
		updateData["mobile_number"] = *body.MobileNumber
	}
	if body.WhatsappNumber != nil {
		updateData["whatsapp_number"] = *body.WhatsappNumber
	}
	if body.EmergencyNumber != nil {
		updateData["emergency_number"] = *body.EmergencyNumber
	}
	if body.AlternateNumber != nil {
		updateData["alternate_number"] = *body.AlternateNumber
	}
	if body.Website != nil {
		updateData["website"] = *body.Website
	}
	if body.Email != nil {
		updateData["email"] = *body.Email
	}
	if body.Username != nil {
		updateData["username"] = *body.Username
	}
	if body.Active != nil {
		updateData["active"] = *body.Active
	}

	// Business Information
	if body.BusinessName != nil {
		updateData["business_name"] = *body.BusinessName
	}
	if body.CompanyName != nil {
		updateData["company_name"] = *body.CompanyName
	}
	if body.IndustrySegment != nil {
		updateData["industry_segment"] = *body.IndustrySegment
	}
	if body.Designation != nil {
		updateData["designation"] = *body.Designation
	}
	if body.Title != nil {
		updateData["title"] = *body.Title
	}

	// Legal Information
	if body.AadharNumber != nil {
		updateData["aadhar_number"] = *body.AadharNumber
	}
	if body.PANNumber != nil {
		updateData["pan_number"] = *body.PANNumber
	}
	if body.GSTINNumber != nil {
		updateData["gstin_number"] = *body.GSTINNumber
	}
	if body.MSMENo != nil {
		updateData["msme_no"] = *body.MSMENo
	}

	// Account type flags
	if body.IsUser != nil {
		updateData["is_user"] = *body.IsUser
	}
	if body.IsCustomer != nil {
		updateData["is_customer"] = *body.IsCustomer
	}
	if body.IsSupplier != nil {
		updateData["is_supplier"] = *body.IsSupplier
	}
	if body.IsEmployee != nil {
		updateData["is_employee"] = *body.IsEmployee
	}
	if body.IsDealer != nil {
		updateData["is_dealer"] = *body.IsDealer
	}
	if body.IsDistributor != nil {
		updateData["is_distributor"] = *body.IsDistributor
	}

	// DOB field (requires parsing)
	if body.DOB != nil && *body.DOB != "" {
		formats := []string{
			"2006-01-02",
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05.000Z",
			time.RFC3339,
		}
		var parsedDOB time.Time
		var parseErr error
		for _, format := range formats {
			parsedDOB, parseErr = time.Parse(format, *body.DOB)
			if parseErr == nil {
				updateData["dob"] = parsedDOB
				break
			}
		}
		if parseErr != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Invalid date format for DOB",
				"field":   "dob",
				"message": "Please provide a valid date",
				"details": parseErr.Error(),
			})
		}
	}

	if body.Password != nil && *body.Password != "" {
		hashed, err := hashPassword(*body.Password)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Password encryption failed",
				"message": "Failed to encrypt password",
				"details": err.Error(),
			})
		}
		updateData["password"] = hashed
		updateData["plain_password"] = *body.Password // Store plain password for display
	}

	if len(updateData) > 0 {
		updateData["updated_at"] = time.Now()
		if err := userDB.Model(&user).Updates(updateData).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Failed to update user",
				"message": "Database error occurred",
				"details": err.Error(),
			})
		}
	}

	// Handle addresses create/update if provided
	if len(body.Addresses) > 0 {
		for _, a := range body.Addresses {
			// If ID provided, attempt update
			if a.ID != nil {
				var addr models.UserAddress
				if err := userDB.Where("id = ? AND user_id = ?", *a.ID, user.ID).First(&addr).Error; err == nil {
					addrUpdate := map[string]interface{}{}
					if a.Title != nil {
						addrUpdate["title"] = *a.Title
					}
					if a.Address1 != nil {
						addrUpdate["address1"] = *a.Address1
					}
					if a.Address2 != nil {
						addrUpdate["address2"] = *a.Address2
					}
					if a.Address3 != nil {
						addrUpdate["address3"] = *a.Address3
					}
					if a.City != nil {
						addrUpdate["city"] = *a.City
					}
					if a.State != nil {
						addrUpdate["state"] = *a.State
					}
					if a.Country != nil {
						addrUpdate["country"] = *a.Country
					}
					if a.Pincode != nil {
						addrUpdate["pincode"] = *a.Pincode
					}
					if len(addrUpdate) > 0 {
						userDB.Model(&addr).Updates(addrUpdate)
					}
				} else if !errors.Is(err, gorm.ErrRecordNotFound) {
					// database error
					return c.Status(500).JSON(fiber.Map{"error": "Failed to query user address", "details": err.Error()})
				} else {
					// not found; create new
					newAddr := models.UserAddress{
						UserID:   user.ID,
						Title:    stringPtrToString(a.Title),
						Address1: stringPtrToString(a.Address1),
						Address2: stringPtrToString(a.Address2),
						Address3: stringPtrToString(a.Address3),
						City:     stringPtrToString(a.City),
						State:    stringPtrToString(a.State),
						Country:  stringPtrToString(a.Country),
						Pincode:  stringPtrToString(a.Pincode),
					}
					if err := userDB.Create(&newAddr).Error; err != nil {
						return c.Status(500).JSON(fiber.Map{"error": "Failed to create user address", "details": err.Error()})
					}
				}
			} else {
				// create new address
				newAddr := models.UserAddress{
					UserID:   user.ID,
					Title:    stringPtrToString(a.Title),
					Address1: stringPtrToString(a.Address1),
					Address2: stringPtrToString(a.Address2),
					Address3: stringPtrToString(a.Address3),
					City:     stringPtrToString(a.City),
					State:    stringPtrToString(a.State),
					Country:  stringPtrToString(a.Country),
					Pincode:  stringPtrToString(a.Pincode),
				}
				if err := userDB.Create(&newAddr).Error; err != nil {
					return c.Status(500).JSON(fiber.Map{"error": "Failed to create user address", "details": err.Error()})
				}
			}
		}
	}

	// Handle permanent address update/create
	if body.PermanentAddress1 != nil || body.PermanentCity != nil || body.PermanentState != nil || body.PermanentCountry != nil {
		// Check if permanent address exists
		var permanentAddr models.UserAddress
		err := userDB.Where("user_id = ? AND title = ?", user.ID, "Permanent").First(&permanentAddr).Error

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
				userDB.Model(&permanentAddr).Updates(addrUpdate)
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new permanent address
			newPermanentAddr := models.UserAddress{
				UserID:      user.ID,
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
			if err := userDB.Create(&newPermanentAddr).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create permanent address", "details": err.Error()})
			}
		}
	}

	// Handle primary bank account update/create
	if body.PrimaryBankName != nil || body.PrimaryAccountNumber != nil {
		bankName := stringPtrToString(body.PrimaryBankName)
		accountNumber := stringPtrToString(body.PrimaryAccountNumber)

		// Validate that we have minimum required fields when creating/updating
		if bankName != "" || accountNumber != "" {
			if bankName == "" {
				return c.Status(400).JSON(fiber.Map{
					"error":   "Validation error",
					"field":   "primary_bank_name",
					"message": "Bank name is required when providing bank account details",
				})
			}
			if accountNumber == "" {
				return c.Status(400).JSON(fiber.Map{
					"error":   "Validation error",
					"field":   "primary_account_number",
					"message": "Account number is required when providing bank account details",
				})
			}
		}

		// For simplicity, find first bank account or create if none exists
		var primaryBank models.UserBankAccount
		err := userDB.Where("user_id = ?", user.ID).First(&primaryBank).Error

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
				userDB.Model(&primaryBank).Updates(bankUpdate)
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new bank account (only if we have meaningful data)
			if bankName != "" || accountNumber != "" {
				newPrimaryBank := models.UserBankAccount{
					UserID:        user.ID,
					BankName:      bankName,
					BranchName:    stringPtrToString(body.PrimaryBranchName),
					BranchAddress: stringPtrToString(body.PrimaryBranchAddress),
					AccountNumber: accountNumber,
					IFSCCode:      stringPtrToString(body.PrimaryIFSCCode),
				}
				if err := userDB.Create(&newPrimaryBank).Error; err != nil {
					return c.Status(500).JSON(fiber.Map{"error": "Failed to create primary bank account", "details": err.Error()})
				}
			}
		}
	}

	// Reload user with relationships to return complete data
	userDB.Preload("Addresses").
		Preload("BankAccounts").
		Preload("Documents").
		First(&user, user.ID)

	return c.JSON(user)
}

func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	// Attempt to delete dependent child records first to avoid FK constraint errors.
	// Delete addresses
	if err := userDB.Where("user_id = ?", id).Delete(&models.UserAddress{}).Error; err != nil {
		// Log and return a clearer error message
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user addresses", "details": err.Error()})
	}

	// Delete bank accounts
	if err := userDB.Where("user_id = ?", id).Delete(&models.UserBankAccount{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user bank accounts", "details": err.Error()})
	}

	// Delete documents
	if err := userDB.Where("user_id = ?", id).Delete(&models.UserDocument{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user documents", "details": err.Error()})
	}

	// Now delete the user record
	if err := userDB.Delete(&models.User{}, id).Error; err != nil {
		// If this is a foreign key constraint error, try to return a user-friendly message
		errMsg := err.Error()
		if strings.Contains(errMsg, "violates foreign key constraint") || strings.Contains(errMsg, "SQLSTATE 23503") {
			// Try to extract the constraint name from the DB error message
			constraintName := ""
			if idx := strings.Index(errMsg, "constraint \""); idx != -1 {
				start := idx + len("constraint \"")
				if end := strings.Index(errMsg[start:], "\""); end != -1 {
					constraintName = errMsg[start : start+end]
				}
			}

			// If we have a constraint name, query information_schema to find the referencing table/column
			if constraintName != "" {
				var info struct {
					TableName         string `gorm:"column:table_name"`
					ColumnName        string `gorm:"column:column_name"`
					ForeignTableName  string `gorm:"column:foreign_table_name"`
					ForeignColumnName string `gorm:"column:foreign_column_name"`
				}
				sql := `SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
				FROM information_schema.table_constraints tc
				JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
				JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
				WHERE tc.constraint_name = ? LIMIT 1;`
				if queryErr := userDB.Raw(sql, constraintName).Scan(&info).Error; queryErr == nil && info.TableName != "" {
					friendly := "Cannot delete user because it is referenced by records in table '" + info.TableName + "'"
					if info.ColumnName != "" {
						friendly += " (column '" + info.ColumnName + "')"
					}
					friendly += ". Remove or reassign those references before deleting."
					return c.Status(409).JSON(fiber.Map{"error": friendly, "constraint": constraintName})
				}
			}

			// Fallback: return a simple message including the constraint name when available
			fallbackMsg := "Cannot delete user because it is referenced by other records."
			if constraintName != "" {
				fallbackMsg += " Constraint: " + constraintName
			}
			return c.Status(409).JSON(fiber.Map{"error": fallbackMsg})
		}

		return c.Status(500).JSON(fiber.Map{"error": "failed to delete user", "details": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User deleted"})
}

func RestoreUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userDB.Unscoped().Model(&models.User{}).
		Where("id = ?", id).
		Update("deleted_at", nil).Error; err != nil {

		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User restored"})
}

func ForceDeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := userDB.Unscoped().Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "User permanently deleted"})
}

func ImportUsers(c *fiber.Ctx) error {
	var users []CreateUserRequest

	if err := c.BodyParser(&users); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid Request",
			"message": "Failed to parse request body",
			"details": err.Error(),
		})
	}

	if len(users) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"error":   "No users to import",
			"message": "Request body must contain an array of users",
		})
	}

	var successCount int
	var errors []string

	// Process each user
	for i, body := range users {
		rowNum := i + 1

		// Validate required fields
		if body.Firstname == "" {
			errors = append(errors, fmt.Sprintf("Row %d: Firstname is required", rowNum))
			continue
		}
		if body.Email == "" {
			errors = append(errors, fmt.Sprintf("Row %d: Email is required", rowNum))
			continue
		}
		if body.MobileNumber == "" {
			errors = append(errors, fmt.Sprintf("Row %d: Mobile number is required", rowNum))
			continue
		}

		// Check if user with this email already exists
		var existingUser models.User
		if err := userDB.Where("email = ?", body.Email).First(&existingUser).Error; err == nil {
			errors = append(errors, fmt.Sprintf("Row %d: User with email %s already exists", rowNum, body.Email))
			continue
		}

		// Start transaction for this user
		tx := userDB.Begin()
		if tx.Error != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to start transaction", rowNum))
			continue
		}

		// Parse DOB if provided
		var dob *time.Time
		if body.DOB != nil && *body.DOB != "" {
			parsedDOB, err := time.Parse("2006-01-02", *body.DOB) // assuming YYYY-MM-DD format
			if err != nil {
				errors = append(errors, fmt.Sprintf("Row %d: Invalid DOB format (expected YYYY-MM-DD)", rowNum))
				continue
			}
			dob = &parsedDOB
		}

		// Parse Gender
		var gender models.Gender
		switch strings.ToLower(body.Gender) {
		case "male":
			gender = models.Male
		case "female":
			gender = models.Female
		case "other":
			gender = models.Other
		default:
			gender = models.Other // default
		}

		// Create user
		user := models.User{
			Usercode:        body.Usercode,
			Salutation:      body.Salutation,
			Firstname:       body.Firstname,
			Lastname:        body.Lastname,
			DOB:             dob,
			Gender:          gender,
			Username:        stringPtrToString(body.Username),
			Country:         body.Country,
			CountryCode:     body.CountryCode,
			MobileNumber:    body.MobileNumber,
			WhatsappNumber:  body.WhatsappNumber,
			EmergencyNumber: body.EmergencyNumber,
			AlternateNumber: body.AlternateNumber,
			Website:         stringPtrToString(body.Website),
			Email:           body.Email,
			Active:          boolPtrToBool(body.Active),

			// Account Type Flags
			IsCustomer:    body.IsCustomer,
			IsSupplier:    body.IsSupplier,
			IsDealer:      body.IsDealer,
			IsDistributor: body.IsDistributor,

			// Business Information
			BusinessName:    stringPtrToString(body.BusinessName),
			CompanyName:     stringPtrToString(body.CompanyName),
			IndustrySegment: stringPtrToString(body.IndustrySegment),
			Designation:     stringPtrToString(body.Designation),
			Title:           stringPtrToString(body.Title),

			// Legal/Document fields
			AadharNumber: stringPtrToString(body.AadharNumber),
			PANNumber:    stringPtrToString(body.PANNumber),
			GSTINNumber:  stringPtrToString(body.GSTINNumber),
			MSMENo:       stringPtrToString(body.MSMENo),
		}

		// Hash password if provided
		if body.Password != "" {
			hashedPassword, err := hashPassword(body.Password)
			if err != nil {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Failed to hash password", rowNum))
				continue
			}
			user.Password = hashedPassword
		}

		// Create user
		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			errors = append(errors, fmt.Sprintf("Row %d: Failed to create user - %s", rowNum, err.Error()))
			continue
		}

		// Create permanent address if provided
		if body.PermanentAddress1 != nil || body.PermanentCity != nil {
			permanentAddress := models.UserAddress{
				UserID:      user.ID,
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
			if err := tx.Create(&permanentAddress).Error; err != nil {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Failed to create permanent address", rowNum))
				continue
			}
		}

		// Create addresses if provided
		for _, addr := range body.Addresses {
			newAddress := models.UserAddress{
				UserID:      user.ID,
				Title:       stringPtrToString(addr.Title),
				Address1:    stringPtrToString(addr.Address1),
				Address2:    stringPtrToString(addr.Address2),
				Address3:    stringPtrToString(addr.Address3),
				City:        stringPtrToString(addr.City),
				State:       stringPtrToString(addr.State),
				Country:     stringPtrToString(addr.Country),
				CountryCode: stringPtrToString(addr.CountryCode),
				Pincode:     stringPtrToString(addr.Pincode),
				GSTIN:       stringPtrToString(addr.GSTIN),
			}

			// Handle key values
			if addr.KeyValues != nil {
				keyValuesJSON, err := json.Marshal(addr.KeyValues)
				if err != nil {
					tx.Rollback()
					errors = append(errors, fmt.Sprintf("Row %d: Failed to marshal address key values", rowNum))
					continue
				}
				newAddress.KeyValues = keyValuesJSON
			}

			if err := tx.Create(&newAddress).Error; err != nil {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Failed to create address", rowNum))
				continue
			}
		}

		// Create primary bank account if provided (only if we have meaningful data)
		bankName := stringPtrToString(body.PrimaryBankName)
		accountNumber := stringPtrToString(body.PrimaryAccountNumber)

		if bankName != "" || accountNumber != "" {
			// Validate that we have minimum required fields
			if bankName == "" {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Bank name is required when providing bank account details", rowNum))
				continue
			}
			if accountNumber == "" {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Account number is required when providing bank account details", rowNum))
				continue
			}

			newPrimaryBank := models.UserBankAccount{
				UserID:        user.ID,
				BankName:      bankName,
				BranchName:    stringPtrToString(body.PrimaryBranchName),
				BranchAddress: stringPtrToString(body.PrimaryBranchAddress),
				AccountNumber: accountNumber,
				IFSCCode:      stringPtrToString(body.PrimaryIFSCCode),
			}

			// Handle additional bank info
			if body.PrimaryAdditionalBankInfo != nil {
				additionalInfoJSON, err := json.Marshal(body.PrimaryAdditionalBankInfo)
				if err != nil {
					tx.Rollback()
					errors = append(errors, fmt.Sprintf("Row %d: Failed to marshal additional bank info", rowNum))
					continue
				}
				newPrimaryBank.AdditionalBankInfos = additionalInfoJSON
			}

			if err := tx.Create(&newPrimaryBank).Error; err != nil {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Failed to create primary bank account - %s", rowNum, err.Error()))
				continue
			}
		}

		// Create additional bank accounts if provided
		for _, bank := range body.BankAccounts {
			newBank := models.UserBankAccount{
				UserID:        user.ID,
				BankName:      stringPtrToString(bank.BankName),
				BranchName:    stringPtrToString(bank.BranchName),
				BranchAddress: stringPtrToString(bank.BranchAddress),
				AccountNumber: stringPtrToString(bank.AccountNumber),
				IFSCCode:      stringPtrToString(bank.IFSCCode),
			}

			// Handle key values
			if bank.KeyValues != nil {
				keyValuesJSON, err := json.Marshal(bank.KeyValues)
				if err != nil {
					tx.Rollback()
					errors = append(errors, fmt.Sprintf("Row %d: Failed to marshal bank key values", rowNum))
					continue
				}
				newBank.KeyValues = keyValuesJSON
			}

			if err := tx.Create(&newBank).Error; err != nil {
				tx.Rollback()
				errors = append(errors, fmt.Sprintf("Row %d: Failed to create bank account", rowNum))
				continue
			}
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to commit transaction", rowNum))
			continue
		}

		successCount++
	}

	return c.JSON(fiber.Map{
		"imported": successCount,
		"errors":   errors,
		"total":    len(users),
	})
}
