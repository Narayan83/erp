package handler

import (
	"errors"
	"strconv"
	"time"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var departmentDB *gorm.DB

func SetDepartmentDB(db *gorm.DB) {
	departmentDB = db
}

// 🧾 DTOs
type CreateDepartmentRequest struct {
	Name        string  `json:"name"`
	Designation *string `json:"designation"`
	HeadID      *uint   `json:"head_id"`
}

type UpdateDepartmentRequest struct {
	Name        *string `json:"name"`
	Designation *string `json:"designation"`
	HeadID      *uint   `json:"head_id"`
}

// ✅ Create Department
func CreateDepartment(c *fiber.Ctx) error {
	var body CreateDepartmentRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	dept := models.Department{
		Name:        body.Name,
		Designation: body.Designation,
		Active:      true,
		HeadID:      body.HeadID,
	}

	if err := departmentDB.Create(&dept).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(dept)
}

// ✅ Get Departments
func GetDepartments(c *fiber.Ctx) error {
	search := c.Query("search")
	name := c.Query("name")
	designation := c.Query("designation")
	employeeID := c.Query("employee_id")
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	var depts []models.Department
	var total int64

	query := departmentDB.Model(&models.Department{})

	if search != "" {
		// Also search by head (user) fields: firstname, lastname and usercode
		query = query.Joins("LEFT JOIN users h ON h.id = departments.head_id").
			Where("departments.name ILIKE ? OR departments.description ILIKE ? OR h.firstname ILIKE ? OR h.lastname ILIKE ? OR h.usercode ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if name != "" {
		query = query.Where("name ILIKE ?", "%"+name+"%")
	}

	if designation != "" {
		query = query.Where("designation ILIKE ?", "%"+designation+"%")
	}

	if employeeID != "" {
		query = query.Joins("JOIN department_relations dr ON dr.department_id = departments.id").
			Where("dr.employee_id = ?", employeeID)
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	if err := query.
		Preload("Head").
		Preload("Employees.Employee").
		Offset(offset).
		Limit(limit).
		Find(&depts).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"departments": depts,
		"total":       total,
		"page":        page,
		"limit":       limit,
	})
}

// ✅ Get Department by ID
func GetDepartment(c *fiber.Ctx) error {
	id := c.Params("id")

	var dept models.Department
	if err := departmentDB.
		Preload("Head").
		Preload("Employees.Employee").
		First(&dept, id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{"error": "Department not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dept)
}

// ✅ Update Department or Assign Head
func UpdateDepartment(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateDepartmentRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var dept models.Department
	if err := departmentDB.First(&dept, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Department not found"})
	}

	updateData := map[string]interface{}{}

	if body.Name != nil {
		updateData["name"] = *body.Name
	}
	if body.Designation != nil {
		updateData["designation"] = *body.Designation
	}
	if body.HeadID != nil {
		updateData["head_id"] = *body.HeadID
	}
	updateData["updated_at"] = time.Now()

	if err := departmentDB.Model(&dept).Updates(updateData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dept)
}

// ✅ Delete Department
func DeleteDepartment(c *fiber.Ctx) error {
	id := c.Params("id")

	// Prevent deletion if department has assigned employees (relations)
	var relCount int64
	if err := departmentDB.Model(&models.DepartmentRelation{}).Where("department_id = ?", id).Count(&relCount).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	if relCount > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot delete department: employees are assigned to this department. Remove department relations first."})
	}

	if err := departmentDB.Delete(&models.Department{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "Department deleted"})
}
