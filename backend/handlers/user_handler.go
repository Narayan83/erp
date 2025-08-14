package handler

import (
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

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	query := usersDB.Model(&models.User{})

	if filter != "" {
		query = query.Where("firstname ILIKE ? OR lastname ILIKE ? OR email ILIKE ?", "%"+filter+"%", "%"+filter+"%", "%"+filter+"%")
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

func AssignCustomerToEmployee(c *fiber.Ctx) error {
	var payload struct {
		EmployeeID uint `json:"employee_id"`
		CustomerID uint `json:"customer_id"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	// Check employee exists
	var employee models.User
	if err := usersDB.First(&employee, payload.EmployeeID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
	}
	if !employee.IsEmployee {
		return c.Status(400).JSON(fiber.Map{"error": "User is not an employee"})
	}

	// Check customer exists
	var customer models.User
	if err := usersDB.First(&customer, payload.CustomerID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Customer not found"})
	}
	if !customer.IsCustomer {
		return c.Status(400).JSON(fiber.Map{"error": "User is not a customer"})
	}

	// Save assignment
	assignment := models.EmployeeCustomer{
		EmployeeID: payload.EmployeeID,
		CustomerID: payload.CustomerID,
	}
	if err := usersDB.Create(&assignment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to assign customer"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message":    "Customer assigned successfully",
		"assignment": assignment,
	})
}

func GetCustomersByEmployee(c *fiber.Ctx) error {
	employeeID := c.Params("id")

	var assignments []models.EmployeeCustomer
	if err := usersDB.Preload("Customer").
		Where("employee_id = ?", employeeID).
		Find(&assignments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch customers"})
	}

	return c.JSON(assignments)
}

func GetEmployeesByCustomer(c *fiber.Ctx) error {
	customerID := c.Params("id")

	var assignments []models.EmployeeCustomer
	if err := usersDB.Preload("Employee").
		Where("customer_id = ?", customerID).
		Find(&assignments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch employees"})
	}

	return c.JSON(assignments)
}
