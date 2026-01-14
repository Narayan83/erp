package handler

import (
	"strconv"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var leadInteractionDB *gorm.DB

func SetLeadInteractionDB(db *gorm.DB) {
	leadInteractionDB = db
}

/* ================= REQUEST DTOs ================= */

type CreateLeadInteractionRequest struct {
	LeadID       uint   `json:"lead_id"`
	Type         string `json:"type"`
	Summary      string `json:"summary"`
	Details      string `json:"details"`
	AssignedToID *uint  `json:"assigned_to_id"`
}

type UpdateLeadInteractionRequest struct {
	Type         *string `json:"type"`
	Summary      *string `json:"summary"`
	Details      *string `json:"details"`
	AssignedToID *uint   `json:"assigned_to_id"`
}

/* ================= HANDLERS ================= */

func CreateLeadInteraction(c *fiber.Ctx) error {
	var body CreateLeadInteractionRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.LeadID == 0 || body.Type == "" {
		return c.Status(400).JSON(fiber.Map{"error": "LeadID and Type are required"})
	}

	interaction := models.LeadInteraction{
		LeadID:       body.LeadID,
		Type:         body.Type,
		Summary:      body.Summary,
		Details:      body.Details,
		AssignedToID: body.AssignedToID,
		Timestamp:    time.Now(),
	}

	if err := leadInteractionDB.Create(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(interaction)
}

func GetLeadInteractions(c *fiber.Ctx) error {
	leadID := c.QueryInt("lead_id", 0)
	var interactions []models.LeadInteraction

	query := leadInteractionDB.Preload("AssignedTo")

	if leadID != 0 {
		query = query.Where("lead_id = ?", leadID)
	}

	query.Order("timestamp desc").Find(&interactions)

	return c.JSON(interactions)
}

func GetLeadInteraction(c *fiber.Ctx) error {
	id := c.Params("id")
	var interaction models.LeadInteraction

	if err := leadInteractionDB.Preload("AssignedTo").First(&interaction, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(interaction)
}

func UpdateLeadInteraction(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateLeadInteractionRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var interaction models.LeadInteraction
	if err := leadInteractionDB.First(&interaction, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Type != nil {
		interaction.Type = *body.Type
	}
	if body.Summary != nil {
		interaction.Summary = *body.Summary
	}
	if body.Details != nil {
		interaction.Details = *body.Details
	}
	if body.AssignedToID != nil {
		interaction.AssignedToID = body.AssignedToID
	}

	if err := leadInteractionDB.Save(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(interaction)
}

func DeleteLeadInteraction(c *fiber.Ctx) error {
	id := c.Params("id")

	var interaction models.LeadInteraction
	if err := leadInteractionDB.First(&interaction, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := leadInteractionDB.Delete(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Interaction deleted successfully"})
}

// POST /api/leads/:id/interactions
// Accepts payload from frontend InteractionModal and creates a LeadInteraction and optional LeadFollowUp
func CreateLeadInteractionForLead(c *fiber.Ctx) error {
	leadIDParam := c.Params("id")
	if leadIDParam == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing lead id"})
	}

	// parse body
	var payload struct {
		Interaction struct {
			Date        string `json:"date"`
			Time        string `json:"time"`
			TagLocation bool   `json:"tagLocation"`
			Type        string `json:"type"`
			Note        string `json:"note"`
		} `json:"interaction"`
		NextAppointment *struct {
			Date         string      `json:"date"`
			Time         string      `json:"time"`
			Assignee     interface{} `json:"assignee"`
			Type         string      `json:"type"`
			Note         string      `json:"note"`
			SendWhatsApp bool        `json:"sendWhatsApp"`
		} `json:"nextAppointment"`
	}

	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// parse lead id into uint
	var lid uint
	if id64, err := strconv.ParseUint(leadIDParam, 10, 64); err == nil {
		lid = uint(id64)
	} else {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid lead id"})
	}

	// Ensure lead exists
	var lead models.Lead
	if err := leadInteractionDB.First(&lead, lid).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Lead not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to validate lead", "detail": err.Error()})
	}

	// Decide whether to create an interaction (frontend may send `interaction: null` or empty fields)
	createInteraction := false
	if payload.Interaction.Type != "" || payload.Interaction.Note != "" || payload.Interaction.Date != "" || payload.Interaction.Time != "" {
		createInteraction = true
	}

	var interaction models.LeadInteraction
	if createInteraction {
		// Build interaction timestamp
		interactionTime := time.Now()
		if payload.Interaction.Date != "" {
			// combine date and time (if provided)
			if payload.Interaction.Time != "" {
				combined := payload.Interaction.Date + "T" + payload.Interaction.Time + ":00"
				if t, err := time.ParseInLocation("2006-01-02T15:04:05", combined, time.Local); err == nil {
					interactionTime = t
				}
			} else {
				if t, err := time.Parse("2006-01-02", payload.Interaction.Date); err == nil {
					interactionTime = t
				}
			}
		}

		interaction = models.LeadInteraction{
			LeadID:    lid,
			Type:      payload.Interaction.Type,
			Summary:   payload.Interaction.Note,
			Details:   "",
			Timestamp: interactionTime,
		}
	}

	// Use transaction so both creations succeed or both fail
	tx := leadInteractionDB.Begin()
	if tx.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start DB transaction", "detail": tx.Error.Error()})
	}

	if createInteraction {
		if interaction.Type == "" {
			// default to Other if frontend didn't send a type
			interaction.Type = "Other"
		}

		if err := tx.Create(&interaction).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create interaction", "detail": err.Error()})
		}
	}

	var fup models.LeadFollowUp
	createdFup := false
	// If next appointment provided, create lead follow-up
	if payload.NextAppointment != nil && payload.NextAppointment.Date != "" {
		fup = models.LeadFollowUp{
			LeadID: lid,
			Title:  payload.NextAppointment.Type,
			Notes:  payload.NextAppointment.Note,
			Status: "pending",
		}
		// parse follow-up datetime
		if payload.NextAppointment.Time != "" {
			combined := payload.NextAppointment.Date + "T" + payload.NextAppointment.Time + ":00"
			if t, err := time.ParseInLocation("2006-01-02T15:04:05", combined, time.Local); err == nil {
				fup.FollowUpOn = t
			} else {
				// If parsing fails, rollback and return error
				tx.Rollback()
				return c.Status(400).JSON(fiber.Map{"error": "Invalid next appointment datetime"})
			}
		} else {
			if t, err := time.Parse("2006-01-02", payload.NextAppointment.Date); err == nil {
				fup.FollowUpOn = t
			} else {
				tx.Rollback()
				return c.Status(400).JSON(fiber.Map{"error": "Invalid next appointment date"})
			}
		}

		// resolve assignee id if possible
		if payload.NextAppointment.Assignee != nil {
			switch v := payload.NextAppointment.Assignee.(type) {
			case float64:
				uid := uint(v)
				fup.AssignedToID = &uid
			case string:
				// try parse numeric
				if n, err := strconv.ParseUint(v, 10, 64); err == nil {
					u := uint(n)
					fup.AssignedToID = &u
				}
			}
		}

		if err := tx.Create(&fup).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "failed to create follow-up", "detail": err.Error()})
		}
		createdFup = true
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to commit transaction", "detail": err.Error()})
	}

	resp := fiber.Map{}
	if createInteraction {
		resp["interaction"] = interaction
	}
	if createdFup {
		resp["followup"] = fup
	}

	return c.Status(201).JSON(resp)
}
