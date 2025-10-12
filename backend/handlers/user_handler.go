package handler

import (
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

// GET /api/users/role/:role?page=1&limit=10
func GetUsersByType(c *fiber.Ctx) error {
	role := c.Params("role") // e.g., "customer", "supplier"
	var users []models.User
	var total int64

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 10)
	filter := c.Query("filter") // new filter parameter
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := usersDB.Model(&models.User{})

	switch role {
	case "customer":
		query = query.Where("is_customer = ?", true)
	case "supplier":
		query = query.Where("is_supplier = ?", true)
	case "employee":
		query = query.Where("is_employee = ?", true)
	default:
		return c.Status(400).JSON(fiber.Map{"error": "Invalid role"})
	}

	// filter by name/email if provided
	if filter != "" {
		likeQuery := "%" + filter + "%"
		query = query.Where("firstname ILIKE ? OR lastname ILIKE ? OR email ILIKE ?", likeQuery, likeQuery, likeQuery)
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
