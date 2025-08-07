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
func CreateUser(c *fiber.Ctx) error {
	// Define request structure
	type RegisterUserRequest struct {
		models.User
		ConfirmPassword string  `json:"confirmPassword"`
		SameAsPermanent bool    `json:"same_as_permanent"`
		DOB             *string `json:"dob"` // Override the embedded model.User.DOB
	}

	var req RegisterUserRequest

	// Parse JSON body into struct
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid input format",
			"details": err.Error(),
		})
	}

	// Parse DOB string to time.Time and assign to model
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

	// Save user to database
	if err := usersDB.Create(&req.User).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to create user",
			"details": err.Error(),
		})
	}

	// Return response (without password ideally)
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
