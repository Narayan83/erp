package handler

import (
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var documentActionDB *gorm.DB

func SetDocumentActionDB(db *gorm.DB) {
	documentActionDB = db
}

type CreateDocumentActionRequest struct {
	DocumentID   uint   `json:"document_id"`
	DocumentType string `json:"document_type"`
	Title        string `json:"title"`
	Notes        string `json:"notes"`
	ActionOn     string `json:"action_on"`
	AssignedToID *uint  `json:"assigned_to_id"`
	Status       string `json:"status"`
}

type UpdateDocumentActionRequest struct {
	Title        *string `json:"title"`
	Notes        *string `json:"notes"`
	ActionOn     *string `json:"action_on"`
	AssignedToID *uint   `json:"assigned_to_id"`
	Status       *string `json:"status"`
	CompletedAt  *string `json:"completed_at"`
}

func CreateDocumentAction(c *fiber.Ctx) error {
	var body CreateDocumentActionRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	body.DocumentType = strings.TrimSpace(strings.ToLower(body.DocumentType))
	body.Title = strings.TrimSpace(body.Title)
	status := strings.TrimSpace(strings.ToLower(body.Status))
	if status == "" {
		status = "pending"
	}

	if body.DocumentID == 0 || body.DocumentType == "" || body.Title == "" || body.ActionOn == "" {
		return c.Status(400).JSON(fiber.Map{"error": "document_id, document_type, title and action_on are required"})
	}

	actionOn, err := parseDocumentTime(body.ActionOn)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid action_on format"})
	}

	action := models.DocumentAction{
		DocumentID:   body.DocumentID,
		DocumentType: body.DocumentType,
		Title:        body.Title,
		Notes:        body.Notes,
		ActionOn:     actionOn,
		AssignedToID: body.AssignedToID,
		Status:       status,
	}

	if err := documentActionDB.Create(&action).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(action)
}

func GetDocumentActions(c *fiber.Ctx) error {
	var actions []models.DocumentAction
	query := documentActionDB.Preload("AssignedTo")

	documentID := c.QueryInt("document_id", 0)
	documentType := strings.TrimSpace(strings.ToLower(c.Query("document_type", "")))
	includeClosed := strings.ToLower(c.Query("include_closed", "false"))

	if documentID != 0 {
		query = query.Where("document_id = ?", documentID)
	}
	if documentType != "" {
		query = query.Where("document_type = ?", documentType)
	}
	if !(includeClosed == "1" || includeClosed == "true") {
		query = query.Where("status NOT IN ?", []string{"done", "cancelled"})
	}

	if err := query.Order("action_on asc").Find(&actions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(actions)
}

func GetDocumentAction(c *fiber.Ctx) error {
	var action models.DocumentAction
	if err := documentActionDB.Preload("AssignedTo").First(&action, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document action not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(action)
}

func UpdateDocumentAction(c *fiber.Ctx) error {
	var body UpdateDocumentActionRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var action models.DocumentAction
	if err := documentActionDB.First(&action, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document action not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Title != nil {
		action.Title = strings.TrimSpace(*body.Title)
	}
	if body.Notes != nil {
		action.Notes = *body.Notes
	}
	if body.ActionOn != nil {
		parsed, err := parseDocumentTime(*body.ActionOn)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid action_on format"})
		}
		action.ActionOn = parsed
	}
	if body.AssignedToID != nil {
		action.AssignedToID = body.AssignedToID
	}
	if body.Status != nil {
		action.Status = strings.TrimSpace(strings.ToLower(*body.Status))
		if action.Status == "done" && action.CompletedAt == nil {
			now := time.Now()
			action.CompletedAt = &now
		}
		if action.Status != "done" {
			action.CompletedAt = nil
		}
	}
	if body.CompletedAt != nil {
		if strings.TrimSpace(*body.CompletedAt) == "" {
			action.CompletedAt = nil
		} else {
			parsed, err := parseDocumentTime(*body.CompletedAt)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid completed_at format"})
			}
			action.CompletedAt = &parsed
		}
	}

	if err := documentActionDB.Save(&action).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(action)
}

func DeleteDocumentAction(c *fiber.Ctx) error {
	var action models.DocumentAction
	if err := documentActionDB.First(&action, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document action not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := documentActionDB.Delete(&action).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Document action deleted successfully"})
}
