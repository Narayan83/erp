package handler

import (
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadFollowupDB *gorm.DB

func SetLeadFollowupDB(db *gorm.DB) {
	leadFollowupDB = db
}

/* ================= REQUEST DTOs ================= */

type CreateLeadFollowUpRequest struct {
	LeadID       uint   `json:"lead_id"`
	Title        string `json:"title"`
	Notes        string `json:"notes"`
	FollowUpOn   string `json:"followup_on"`
	AssignedToID *uint  `json:"assigned_to_id"`
}

type UpdateLeadFollowUpRequest struct {
	Title        *string `json:"title"`
	Notes        *string `json:"notes"`
	FollowUpOn   *string `json:"followup_on"`
	Status       *string `json:"status"`
	AssignedToID *uint   `json:"assigned_to_id"`
}

/* ================= HANDLERS ================= */

func CreateLeadFollowUp(c *fiber.Ctx) error {
	var body CreateLeadFollowUpRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.LeadID == 0 || body.Title == "" || body.FollowUpOn == "" {
		return c.Status(400).JSON(fiber.Map{"error": "LeadID, Title, FollowUpOn required"})
	}

	fup := models.LeadFollowUp{
		LeadID:       body.LeadID,
		Title:        body.Title,
		Notes:        body.Notes,
		AssignedToID: body.AssignedToID,
	}

	followTime, err := time.Parse(time.RFC3339, body.FollowUpOn)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid FollowUpOn date format"})
	}
	fup.FollowUpOn = followTime

	if err := leadFollowupDB.Create(&fup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(fup)
}

func GetLeadFollowUps(c *fiber.Ctx) error {
	leadID := c.QueryInt("lead_id", 0)
	var followups []models.LeadFollowUp

	query := leadFollowupDB.Preload("AssignedTo")

	if leadID != 0 {
		query = query.Where("lead_id = ?", leadID)
	}

	query.Order("follow_up_on asc").Find(&followups)
	return c.JSON(followups)
}

func GetLeadFollowUp(c *fiber.Ctx) error {
	id := c.Params("id")
	var fup models.LeadFollowUp

	if err := leadFollowupDB.Preload("AssignedTo").First(&fup, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Follow-up not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fup)
}

func UpdateLeadFollowUp(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateLeadFollowUpRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var fup models.LeadFollowUp
	if err := leadFollowupDB.First(&fup, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Follow-up not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Title != nil {
		fup.Title = *body.Title
	}
	if body.Notes != nil {
		fup.Notes = *body.Notes
	}
	if body.Status != nil {
		fup.Status = *body.Status
	}
	if body.FollowUpOn != nil {
		t, err := time.Parse(time.RFC3339, *body.FollowUpOn)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid FollowUpOn format"})
		}
		fup.FollowUpOn = t
	}
	if body.AssignedToID != nil {
		fup.AssignedToID = body.AssignedToID
	}

	if err := leadFollowupDB.Save(&fup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fup)
}

func DeleteLeadFollowUp(c *fiber.Ctx) error {
	id := c.Params("id")

	var fup models.LeadFollowUp
	if err := leadFollowupDB.First(&fup, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Follow-up not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := leadFollowupDB.Delete(&fup).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Follow-up deleted successfully"})
}
