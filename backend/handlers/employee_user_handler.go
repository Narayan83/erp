package handler

import (
	"errors"
	"log"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var employeeUserDB *gorm.DB

func SetEmployeeUserDB(db *gorm.DB) {
	employeeUserDB = db
}

func AssignUserToEmployee(c *fiber.Ctx) error {
	var req struct {
		EmployeeID uint `json:"employee_id"`
		UserID     uint `json:"user_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	log.Printf("AssignUserToEmployee: request body employee_id=%d user_id=%d", req.EmployeeID, req.UserID)

	// Check employee exists (employees are stored in users table with is_employee = true)
	var employee models.User
	if err := employeeUserDB.Where("is_employee = ?", true).First(&employee, req.EmployeeID).Error; err != nil {
		log.Printf("AssignUserToEmployee: employee lookup failed: %v", err)
		return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
	}
	log.Printf("AssignUserToEmployee: found employee id=%d", employee.ID)

	// Check user exists
	var user models.User
	if err := employeeUserDB.First(&user, req.UserID).Error; err != nil {
		log.Printf("AssignUserToEmployee: user lookup failed: %v", err)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	log.Printf("AssignUserToEmployee: found user id=%d", user.ID)

	// Check if user already assigned to some employee
	var existingRel models.EmployeeUserRelation
	err := employeeUserDB.Where("user_id = ?", req.UserID).First(&existingRel).Error
	if err == nil {
		return c.Status(400).JSON(fiber.Map{"error": "User already assigned to another employee"})
	}

	// Create relation
	rel := models.EmployeeUserRelation{
		EmployeeID: req.EmployeeID,
		UserID:     req.UserID,
	}

	if err := employeeUserDB.Create(&rel).Error; err != nil {
		log.Printf("AssignUserToEmployee: failed to create relation: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to assign user to employee"})
	}

	return c.JSON(fiber.Map{"message": "User assigned to employee successfully"})
}

func RemoveUserFromEmployee(c *fiber.Ctx) error {
	// Support deleting by relation id, user_id, employee_id, or combination
	relID := c.QueryInt("id")
	userID := c.QueryInt("user_id")
	employeeID := c.QueryInt("employee_id")

	var err error

	if relID != 0 {
		// delete specific relation by primary key
		err = employeeUserDB.Delete(&models.EmployeeUserRelation{}, relID).Error
	} else if userID != 0 && employeeID != 0 {
		// delete specific pairing
		err = employeeUserDB.Where("user_id = ? AND employee_id = ?", userID, employeeID).Delete(&models.EmployeeUserRelation{}).Error
	} else if userID != 0 {
		// delete relations for a given user
		err = employeeUserDB.Where("user_id = ?", userID).Delete(&models.EmployeeUserRelation{}).Error
	} else if employeeID != 0 {
		// fallback: delete all relations for an employee (legacy behaviour)
		err = employeeUserDB.Where("employee_id = ?", employeeID).Delete(&models.EmployeeUserRelation{}).Error
	} else {
		return c.Status(400).JSON(fiber.Map{"error": "No identifier provided to remove relation"})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to remove user relation"})
	}

	return c.JSON(fiber.Map{"message": "User mapping removed"})
}

func GetEmployeesWithUsers(c *fiber.Ctx) error {
	var rels []models.EmployeeUserRelation

	err := employeeUserDB.Preload("Employee").Preload("User").Find(&rels).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch mappings"})
	}

	return c.JSON(rels)
}

func GetEmployeesWithoutUsers(c *fiber.Ctx) error {
	var employees []models.User

	// Get employees (users marked as employees) who are not department heads
	err := employeeUserDB.Raw(`
		SELECT * FROM users
		WHERE is_employee = true
		AND id NOT IN (SELECT head_id FROM departments WHERE head_id IS NOT NULL)
	`).Scan(&employees).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch employees"})
	}

	return c.JSON(employees)
}

func GetUnassignedUsers(c *fiber.Ctx) error {
	var users []models.User

	// Get all users (customers, suppliers, dealers, distributors) not assigned to any employee
	err := employeeUserDB.Model(&models.User{}).
		Joins("LEFT JOIN employee_user_relations eur ON users.id = eur.user_id").
		Where("eur.user_id IS NULL AND (users.is_customer = true OR users.is_supplier = true OR users.is_dealer = true OR users.is_distributor = true)").
		Find(&users).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch unassigned users"})
	}

	return c.JSON(users)
}

func GetEmployeeUser(c *fiber.Ctx) error {
	empID := c.Params("id")
	var rel models.EmployeeUserRelation

	err := employeeUserDB.Preload("User").Preload("Employee").Where("employee_id = ?", empID).First(&rel).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(404).JSON(fiber.Map{"error": "Mapping not found"})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch mapping"})
	}

	return c.JSON(rel)
}

func GetAllEmployeeUserMappings(c *fiber.Ctx) error {
	var rels []models.EmployeeUserRelation

	err := employeeUserDB.Joins("Employee").Joins("User").Find(&rels).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch mappings"})
	}

	return c.JSON(rels)
}

// Shift/transfer users from one employee to another
func ShiftUsersToEmployee(c *fiber.Ctx) error {
	var req struct {
		UserIDs      []uint `json:"user_ids"`       // Array of user IDs to shift
		ToEmployeeID uint   `json:"to_employee_id"` // Target employee
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if len(req.UserIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No users selected"})
	}

	// Check if target employee exists (stored as user with is_employee = true)
	var targetEmployee models.User
	if err := employeeUserDB.Where("is_employee = ?", true).First(&targetEmployee, req.ToEmployeeID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Target employee not found"})
	}

	// Update all user assignments to the new employee
	for _, userID := range req.UserIDs {
		if err := employeeUserDB.Model(&models.EmployeeUserRelation{}).
			Where("user_id = ?", userID).
			Update("employee_id", req.ToEmployeeID).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to shift users"})
		}
	}

	return c.JSON(fiber.Map{"message": "Users shifted successfully"})
}
