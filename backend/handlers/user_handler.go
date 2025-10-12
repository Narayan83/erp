package handler

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var usersDB *gorm.DB

func SetUsersDB(db *gorm.DB) {
	usersDB = db
}

// GetUsersByType - returns users filtered by a simple role-type string (user/customer/supplier/etc)
func GetUsersByType(c *fiber.Ctx) error {
	role := c.Params("role")
	if role == "" {
		return c.Status(400).JSON(fiber.Map{"error": "role parameter required"})
	}

	query := usersDB.Model(&models.User{})
	switch strings.ToLower(role) {
	case "user":
		query = query.Where("is_user = ?", true)
	case "customer":
		query = query.Where("is_customer = ?", true)
	case "supplier":
		query = query.Where("is_supplier = ?", true)
	case "employee":
		query = query.Where("is_employee = ?", true)
	case "dealer":
		query = query.Where("is_dealer = ?", true)
	case "distributor":
		query = query.Where("is_distributor = ?", true)
	default:
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}

	var users []models.User
	if err := query.Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(users)
}

// GET /api/users?page=1&limit=10&filter=abc
func GetAllUsers(c *fiber.Ctx) error {
	var users []models.User
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter")
	userType := c.Query("user_type")
	roleID := c.QueryInt("role_id", 0)
	deptHeadID := c.QueryInt("dept_head", 0)

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := usersDB.Model(&models.User{})

	if filter != "" {
		query = query.Where("firstname ILIKE ? OR lastname ILIKE ? OR email ILIKE ?", "%"+filter+"%", "%"+filter+"%", "%"+filter+"%")
	}

	// Apply user type filter if provided (matches frontend values)
	if userType != "" {
		switch userType {
		case "user":
			query = query.Where("is_user = ?", true)
		case "customer":
			query = query.Where("is_customer = ?", true)
		case "supplier":
			query = query.Where("is_supplier = ?", true)
		case "employee":
			query = query.Where("is_employee = ?", true)
		case "dealer":
			query = query.Where("is_dealer = ?", true)
		case "distributor":
			query = query.Where("is_distributor = ?", true)
		default:
			// unknown user_type - ignore and continue without filtering
		}
	}

	// Filter by role_id if provided
	if roleID > 0 {
		query = query.Where("role_id = ?", roleID)
	}

	// Filter by dept_head if provided (expects numeric id)
	if deptHeadID > 0 {
		query = query.Where("dept_head = ?", deptHeadID)
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GET /api/users/:id
func GetUserByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User
	if err := usersDB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	return c.JSON(user)
}

// POST /api/users
// func CreateUser(c *fiber.Ctx) error {
// 	// Define request structure
// 	type RegisterUserRequest struct {
// 		models.User
// 		ConfirmPassword string  `json:"confirmPassword"`
// 		SameAsPermanent bool    `json:"same_as_permanent"`
// 		DOB             *string `json:"dob"` // Override the embedded model.User.DOB
// 	}

// 	var req RegisterUserRequest

// 	// Parse JSON body into struct
// 	if err := c.BodyParser(&req); err != nil {
// 		return c.Status(400).JSON(fiber.Map{
// 			"error":   "Invalid input format",
// 			"details": err.Error(),
// 		})
// 	}

// 	// Parse DOB string to time.Time and assign to model
// 	if req.DOB != nil && *req.DOB != "" {
// 		parsedDOB, err := time.Parse("2006-01-02", *req.DOB)
// 		if err != nil {
// 			return c.Status(400).JSON(fiber.Map{
// 				"error":   "Invalid DOB format (expected YYYY-MM-DD)",
// 				"details": err.Error(),
// 			})
// 		}
// 		req.User.DOB = &parsedDOB
// 	}

// 	// Save user to database
// 	if err := usersDB.Create(&req.User).Error; err != nil {
// 		return c.Status(500).JSON(fiber.Map{
// 			"error":   "Failed to create user",
// 			"details": err.Error(),
// 		})
// 	}

// 	// Return response (without password ideally)
// 	return c.Status(201).JSON(fiber.Map{
// 		"message": "User created successfully",
// 		"user":    req.User,
// 	})
// }

// POST /api/users
func CreateUser(c *fiber.Ctx) error {
	type RegisterUserRequest struct {
		models.User
		ConfirmPassword string  `json:"confirmPassword"`
		SameAsPermanent bool    `json:"same_as_permanent"`
		DOB             *string `json:"dob"` // Override the embedded model.User.DOB
	}

	var req RegisterUserRequest

	// Parse JSON body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid input format",
			"details": err.Error(),
		})
	}

	// Password confirmation
	if req.Password != req.ConfirmPassword {
		return c.Status(400).JSON(fiber.Map{
			"error": "Passwords do not match",
		})
	}

	// Parse DOB
	if req.DOB != nil && *req.DOB != "" {
		parsedDOB, err := time.Parse("2006-01-02", *req.DOB)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Invalid DOB format (expected YYYY-MM-DD)",
				"details": err.Error(),
			})
		}
		req.User.DOB = &parsedDOB
	}

	// If same as permanent, copy addresses
	// if req.SameAsPermanent {
	// 	req.User.ContactAddress1 = req.User.Address1
	// 	req.User.ContactAddress2 = req.User.Address2
	// 	req.User.ContactAddress3 = req.User.Address3
	// 	req.User.ContactAddress4 = req.User.Address4
	// 	req.User.ContactAddress5 = req.User.Address5
	// 	req.User.ContactState = req.User.State
	// 	req.User.ContactCountry = req.User.Country
	// 	req.User.ContactPincode = req.User.Pincode
	// }

	req.User.Password = req.Password

	// Save user
	if err := usersDB.Create(&req.User).Error; err != nil {
		// Check for duplicate key error
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "duplicate key") || strings.Contains(errMsg, "unique constraint") {
			// Return 409 Conflict instead of 500 for unique constraint violations
			statusCode := 409
			errorMessage := "Failed to create user: duplicate value"

			// Provide more specific error message based on the field
			if strings.Contains(errMsg, "email") {
				errorMessage = "A user with this email already exists"
			} else if strings.Contains(errMsg, "mobile_number") {
				errorMessage = "A user with this mobile number already exists"
			} else if strings.Contains(errMsg, "emergency_number") ||
				strings.Contains(errMsg, "alternate_number") ||
				strings.Contains(errMsg, "whatsapp_number") {
				errorMessage = "One of the contact numbers already exists"
			}

			return c.Status(statusCode).JSON(fiber.Map{
				"error":   errorMessage,
				"details": err.Error(),
			})
		}

		// For other errors, return 500
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to create user",
			"details": err.Error(),
		})
	}

	// Return without password
	return c.Status(201).JSON(fiber.Map{
		"message": "User created successfully",
		"user":    req.User,
	})
}

// PUT /api/users/:id
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	// Fetch existing user
	var existingUser models.User
	if err := usersDB.First(&existingUser, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Define the same request structure as in CreateUser
	type UpdateUserRequest struct {
		models.User
		ConfirmPassword string  `json:"confirmPassword"`
		SameAsPermanent bool    `json:"same_as_permanent"`
		DOB             *string `json:"dob"` // to override
	}

	var req UpdateUserRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid input format",
			"details": err.Error(),
		})
	}

	// Parse and assign DOB if present
	if req.DOB != nil && *req.DOB != "" {
		parsedDOB, err := time.Parse("2006-01-02", *req.DOB)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error":   "Invalid DOB format (expected YYYY-MM-DD)",
				"details": err.Error(),
			})
		}
		req.User.DOB = &parsedDOB
	}

	// Ensure the ID from URL path is assigned (helps avoid ID overwrite)
	req.User.ID = existingUser.ID

	// Save updated user to DB
	if err := usersDB.Save(&req.User).Error; err != nil {
		// Check for duplicate key error
		errMsg := strings.ToLower(err.Error())
		if strings.Contains(errMsg, "duplicate key") || strings.Contains(errMsg, "unique constraint") {
			// Return 409 Conflict instead of 500 for unique constraint violations
			statusCode := 409
			errorMessage := "Failed to update user: duplicate value"

			// Provide more specific error message based on the field
			if strings.Contains(errMsg, "email") {
				errorMessage = "A user with this email already exists"
			} else if strings.Contains(errMsg, "mobile_number") {
				errorMessage = "A user with this mobile number already exists"
			} else if strings.Contains(errMsg, "emergency_number") ||
				strings.Contains(errMsg, "alternate_number") ||
				strings.Contains(errMsg, "whatsapp_number") {
				errorMessage = "One of the contact numbers already exists"
			}

			return c.Status(statusCode).JSON(fiber.Map{
				"error":   errorMessage,
				"details": err.Error(),
			})
		}

		// For other errors, return 500
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to update user",
			"details": err.Error(),
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"message": "User updated successfully",
		"user":    req.User,
	})
}

// DELETE /api/users/:id
func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := usersDB.Delete(&models.User{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

// POST /api/users/import
func ImportUsers(c *fiber.Ctx) error {
	body := c.Body()
	fmt.Println("------- USER IMPORT REQUEST START -------")
	fmt.Println("Raw request body:", string(body))
	fmt.Println("------- USER IMPORT REQUEST END ---------")

	var importData []map[string]interface{}

	if err := c.BodyParser(&importData); err != nil {
		// Try to read jsonData form value as fallback
		jsonDataStr := c.FormValue("jsonData")
		if jsonDataStr == "" {
			return c.Status(400).JSON(fiber.Map{"error": "No JSON data provided"})
		}
		if err := json.Unmarshal([]byte(jsonDataStr), &importData); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON data: " + err.Error()})
		}
	}

	if len(importData) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No data to import"})
	}

	var imported int
	var errors []string

	for i, row := range importData {
		rowNum := i + 1

		// helper to get flexible field
		get := func(key string) string {
			// direct
			if v, ok := row[key]; ok && v != nil {
				return fmt.Sprintf("%v", v)
			}
			// with asterisk
			if v, ok := row[key+" *"]; ok && v != nil {
				return fmt.Sprintf("%v", v)
			}
			// case-insensitive search
			lowerKey := strings.ToLower(strings.ReplaceAll(key, " ", ""))
			for k, v := range row {
				kNorm := strings.ToLower(strings.ReplaceAll(k, " ", ""))
				if kNorm == lowerKey {
					if v != nil {
						return fmt.Sprintf("%v", v)
					}
				}
			}
			return ""
		}

		firstName := get("First Name")
		lastName := get("Last Name")
		email := get("Email")
		mobile := get("Mobile Number")
		active := get("Active")

		// Basic validation
		rowErrs := []string{}
		if firstName == "" || lastName == "" {
			rowErrs = append(rowErrs, "First Name and Last Name are required")
		}
		if email == "" {
			rowErrs = append(rowErrs, "Email is required")
		}
		if mobile == "" {
			rowErrs = append(rowErrs, "Mobile Number is required")
		}

		if len(rowErrs) > 0 {
			errors = append(errors, fmt.Sprintf("Row %d: %s", rowNum, strings.Join(rowErrs, "; ")))
			continue
		}

		// Additional fields from CSV
		userCode := get("User Code") // Added User Code field
		salutation := get("Salutation")
		dobStr := get("DOB")
		gender := get("Gender")
		countryCode := get("Country Code")
		emergency := get("Emergency Number")
		alternate := get("Alternate Number")
		whatsapp := get("Whatsapp Number")
		website := get("Website")
		businessName := get("Business Name")
		title := get("Title")
		companyName := get("Company Name")
		designation := get("Designation")
		industry := get("Industry Segment")
		address1 := get("Address1")
		address2 := get("Address2")
		address3 := get("Address3")
		state := get("State")
		country := get("Country")
		pincode := get("Pincode")
		aadhar := get("Aadhar Number")
		pan := get("PAN Number")
		gstin := get("GSTIN")
		msme := get("MSME No")
		bankName := get("Bank Name")
		branchName := get("Branch Name")
		branchAddress := get("Branch Address")
		accountNumber := get("Account Number")
		ifscCode := get("IFSC Code")
		// boolean flags
		isUser := get("IsUser")
		isCustomer := get("IsCustomer")
		isSupplier := get("IsSupplier")
		isEmployee := get("IsEmployee")
		isDealer := get("IsDealer")
		isDistributor := get("IsDistributor")

		// Parse DOB if provided
		var dobPtr *time.Time
		if dobStr != "" {
			// try common formats
			var parsed time.Time
			var perr error
			parsed, perr = time.Parse("2006-01-02", dobStr)
			if perr != nil {
				parsed, perr = time.Parse(time.RFC3339, dobStr)
			}
			if perr != nil {
				// try DD-MM-YYYY or DD/MM/YYYY
				parsed, perr = time.Parse("02-01-2006", dobStr)
			}
			if perr == nil {
				dobPtr = &parsed
			} else {
				// ignore parse error; keep nil
				fmt.Printf("Row %d: Could not parse DOB '%s' (%v)\n", rowNum, dobStr, perr)
			}
		}

		// Default country code if missing
		if countryCode == "" {
			countryCode = "+91"
		}

		// Helper to convert yes/no/true/1 to bool
		convBool := func(v string) bool {
			lv := strings.ToLower(strings.TrimSpace(v))
			return lv == "true" || lv == "yes" || lv == "1" || lv == "active"
		}

		// Create user with optional usercode
		var usercodePtr *string
		if userCode != "" {
			usercodePtr = &userCode
		}

		u := models.User{
			Usercode:        usercodePtr,
			Salutation:      nil,
			Firstname:       firstName,
			Lastname:        lastName,
			DOB:             dobPtr,
			Gender:          models.Gender(gender),
			CountryCode:     countryCode,
			MobileNumber:    mobile,
			EmergencyNumber: nil,
			AlternateNumber: nil,
			WhatsappNumber:  nil,
			Email:           email,
			Website:         nil,
			BusinessName:    nil,
			Title:           nil,
			CompanyName:     nil,
			Designation:     nil,
			IndustrySegment: nil,
			Address1:        nil,
			Address2:        nil,
			Address3:        nil,
			State:           nil,
			Country:         nil,
			Pincode:         nil,
			AadharNumber:    nil,
			PANNumber:       nil,
			GSTIN:           nil,
			MSMENo:          nil,
			BankName:        nil,
			BranchName:      nil,
			BranchAddress:   nil,
			AccountNumber:   nil,
			IFSCCode:        nil,
			Password:        "",
			Active:          convBool(active),
			IsUser:          convBool(isUser),
			IsCustomer:      convBool(isCustomer),
			IsSupplier:      convBool(isSupplier),
			IsEmployee:      convBool(isEmployee),
			IsDealer:        convBool(isDealer),
			IsDistributor:   convBool(isDistributor),
		}

		// Set optional pointer fields if values present
		if salutation != "" {
			u.Salutation = &salutation
		}
		if website != "" {
			u.Website = &website
		}
		if businessName != "" {
			u.BusinessName = &businessName
		}
		if title != "" {
			u.Title = &title
		}
		if companyName != "" {
			u.CompanyName = &companyName
		}
		if designation != "" {
			u.Designation = &designation
		}
		if industry != "" {
			u.IndustrySegment = &industry
		}
		if address1 != "" {
			u.Address1 = &address1
		}
		if address2 != "" {
			u.Address2 = &address2
		}
		if address3 != "" {
			u.Address3 = &address3
		}
		if state != "" {
			u.State = &state
		}
		if country != "" {
			u.Country = &country
		}
		if pincode != "" {
			u.Pincode = &pincode
		}
		if aadhar != "" {
			u.AadharNumber = &aadhar
		}
		if pan != "" {
			u.PANNumber = &pan
		}
		if gstin != "" {
			u.GSTIN = &gstin
		}
		if msme != "" {
			u.MSMENo = &msme
		}
		if bankName != "" {
			u.BankName = &bankName
		}
		if branchName != "" {
			u.BranchName = &branchName
		}
		if branchAddress != "" {
			u.BranchAddress = &branchAddress
		}
		if accountNumber != "" {
			u.AccountNumber = &accountNumber
		}
		if ifscCode != "" {
			u.IFSCCode = &ifscCode
		}
		if emergency != "" {
			u.EmergencyNumber = &emergency
		}
		if alternate != "" {
			u.AlternateNumber = &alternate
		}
		if whatsapp != "" {
			u.WhatsappNumber = &whatsapp
		}

		// Insert user
		if err := usersDB.Create(&u).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: %s", rowNum, err.Error()))
			continue
		}

		imported++
	}

	// Return import result
	return c.JSON(fiber.Map{
		"imported": imported,
		"errors":   errors,
	})
}
