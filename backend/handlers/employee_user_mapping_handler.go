package handler

import (
	"errors"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type employeeMappingJSON struct {
	ID         uint                   `json:"id"`
	EmployeeID uint                   `json:"employee_id"`
	UserID     uint                   `json:"user_id"`
	Employee   map[string]interface{} `json:"employee"`
	User       models.User            `json:"user"`
}

func flattenEmployeeForAssignJSON(e models.Employee) map[string]interface{} {
	u := e.User
	row := map[string]interface{}{
		"id":         e.ID,
		"user_id":    e.UserID,
		"firstname":  u.Firstname,
		"lastname":   u.Lastname,
		"work_email": e.WorkEmail,
	}
	if u.Salutation != nil {
		row["salutation"] = *u.Salutation
	}
	if u.Usercode != nil {
		row["usercode"] = *u.Usercode
	} else {
		row["usercode"] = nil
	}
	if e.EmpCode != nil {
		row["empcode"] = *e.EmpCode
	} else {
		row["empcode"] = nil
	}
	return row
}

// GetAllEmployeeUserMappings returns all employee–user mappings for the Assign User to Employee UI.
func GetAllEmployeeUserMappings(c *fiber.Ctx) error {
	var rels []models.EmployeeUserRelation
	if err := employeeDB.
		Preload("Employee.User").
		Preload("User").
		Order("id asc").
		Find(&rels).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	out := make([]employeeMappingJSON, 0, len(rels))
	for _, r := range rels {
		emp := r.Employee
		if emp.ID == 0 {
			_ = employeeDB.Preload("User").First(&emp, r.EmployeeID).Error
		}
		u := r.User
		if u.ID == 0 {
			_ = userDB.First(&u, r.UserID).Error
		}
		out = append(out, employeeMappingJSON{
			ID:         r.ID,
			EmployeeID: r.EmployeeID,
			UserID:     r.UserID,
			Employee:   flattenEmployeeForAssignJSON(emp),
			User:       u,
		})
	}
	return c.JSON(out)
}

type assignUserToEmployeeRequest struct {
	EmployeeID uint `json:"employee_id"`
	UserID     uint `json:"user_id"`
}

// AssignUserToEmployee creates a mapping (one user → one employee row in this table).
func AssignUserToEmployee(c *fiber.Ctx) error {
	var body assignUserToEmployeeRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if body.EmployeeID == 0 || body.UserID == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "employee_id and user_id are required"})
	}

	var emp models.Employee
	if err := employeeDB.First(&emp, body.EmployeeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Employee not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var usr models.User
	if err := userDB.First(&usr, body.UserID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	var existing models.EmployeeUserRelation
	err := employeeDB.Where("user_id = ?", body.UserID).First(&existing).Error
	if err == nil {
		return c.Status(409).JSON(fiber.Map{"error": "User already assigned to an employee", "message": "User already assigned to an employee"})
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	rel := models.EmployeeUserRelation{
		EmployeeID: body.EmployeeID,
		UserID:     body.UserID,
	}
	if err := employeeDB.Create(&rel).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "User assigned to employee", "id": rel.ID})
}

// RemoveUserFromEmployee deletes by relation id (?id=) or by user_id (?user_id=).
func RemoveUserFromEmployee(c *fiber.Ctx) error {
	idStr := c.Query("id")
	userIDStr := c.Query("user_id")

	if idStr != "" {
		res := employeeDB.Delete(&models.EmployeeUserRelation{}, idStr)
		if res.Error != nil {
			return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
		}
		if res.RowsAffected == 0 {
			return c.Status(404).JSON(fiber.Map{"error": "Mapping not found"})
		}
		return c.JSON(fiber.Map{"message": "Mapping removed"})
	}

	if userIDStr != "" {
		res := employeeDB.Where("user_id = ?", userIDStr).Delete(&models.EmployeeUserRelation{})
		if res.Error != nil {
			return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
		}
		if res.RowsAffected == 0 {
			return c.Status(404).JSON(fiber.Map{"error": "No mapping for this user"})
		}
		return c.JSON(fiber.Map{"message": "Mapping removed"})
	}

	return c.Status(400).JSON(fiber.Map{"error": "Provide id or user_id query parameter"})
}

type shiftUsersRequest struct {
	UserIDs      []uint `json:"user_ids"`
	ToEmployeeID uint   `json:"to_employee_id"`
}

// ShiftUsersToEmployee updates employee_id for the given users' mappings.
func ShiftUsersToEmployee(c *fiber.Ctx) error {
	var body shiftUsersRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if body.ToEmployeeID == 0 || len(body.UserIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "to_employee_id and user_ids are required"})
	}

	var emp models.Employee
	if err := employeeDB.First(&emp, body.ToEmployeeID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Target employee not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := employeeDB.Model(&models.EmployeeUserRelation{}).
		Where("user_id IN ?", body.UserIDs).
		Update("employee_id", body.ToEmployeeID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Users shifted successfully"})
}
