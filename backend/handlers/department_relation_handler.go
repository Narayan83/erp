package handler

import (
	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var departmentRelationDB *gorm.DB

func SetDepartmentRelationDB(db *gorm.DB) {
	departmentRelationDB = db
}

type AssignEmployeeRequest struct {
	DepartmentID uint  `json:"department_id"`
	EmployeeID   uint  `json:"employee_id"`
	AssignedByID *uint `json:"assigned_by_id"`
}

// ✅ Assign Employee under Department Head
func AssignEmployeeToDepartment(c *fiber.Ctx) error {
	var body AssignEmployeeRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	relation := models.DepartmentRelation{
		DepartmentID: body.DepartmentID,
		EmployeeID:   body.EmployeeID,
		AssignedByID: body.AssignedByID,
	}

	if err := departmentRelationDB.Create(&relation).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(relation)
}

// ✅ Get Employees under Department
func GetDepartmentEmployees(c *fiber.Ctx) error {
	deptID := c.Params("id")
	var relations []models.DepartmentRelation

	if err := departmentRelationDB.
		Where("department_id = ?", deptID).
		Preload("Employee").
		Preload("AssignedBy").
		Find(&relations).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(relations)
}

// ✅ Remove Employee from Department
func RemoveEmployeeFromDepartment(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := departmentRelationDB.Delete(&models.DepartmentRelation{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Employee removed from department"})
}
