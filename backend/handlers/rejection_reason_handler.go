package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var rejectionReasonDB *gorm.DB

func SetRejectionReasonDB(db *gorm.DB) {
	rejectionReasonDB = db
}

/* ========== DTOs ========== */

type CreateRejectionReasonRequest struct {
	Code        string `json:"code"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Active      *bool  `json:"active"`
}

type UpdateRejectionReasonRequest struct {
	Code        *string `json:"code"`
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Active      *bool   `json:"active"`
}

/* ========== HANDLERS ========== */

func CreateRejectionReason(c *fiber.Ctx) error {
	var body CreateRejectionReasonRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.Code == "" || body.Title == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Code and Title are required"})
	}

	reason := models.RejectionReason{
		Code:        body.Code,
		Title:       body.Title,
		Description: body.Description,
		Active:      true,
	}

	if body.Active != nil {
		reason.Active = *body.Active
	}

	if err := rejectionReasonDB.Create(&reason).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(reason)
}

func GetRejectionReasons(c *fiber.Ctx) error {
	var reasons []models.RejectionReason

	query := rejectionReasonDB.Order("title asc")

	if c.Query("active") == "true" {
		query = query.Where("active = true")
	}

	if err := query.Find(&reasons).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(reasons)
}

func GetRejectionReason(c *fiber.Ctx) error {
	id := c.Params("id")
	var reason models.RejectionReason

	if err := rejectionReasonDB.First(&reason, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Rejection reason not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(reason)
}

func UpdateRejectionReason(c *fiber.Ctx) error {
	id := c.Params("id")

	var body UpdateRejectionReasonRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var reason models.RejectionReason
	if err := rejectionReasonDB.First(&reason, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Rejection reason not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Code != nil {
		reason.Code = *body.Code
	}
	if body.Title != nil {
		reason.Title = *body.Title
	}
	if body.Description != nil {
		reason.Description = *body.Description
	}
	if body.Active != nil {
		reason.Active = *body.Active
	}

	if err := rejectionReasonDB.Save(&reason).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(reason)
}

func DeleteRejectionReason(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := rejectionReasonDB.Delete(&models.RejectionReason{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Rejection reason deleted successfully"})
}
