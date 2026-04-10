package handler

import (
	"strings"
	"time"

	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var documentInteractionDB *gorm.DB

func SetDocumentInteractionDB(db *gorm.DB) {
	documentInteractionDB = db
}

type CreateDocumentInteractionRequest struct {
	DocumentID    uint   `json:"document_id"`
	DocumentType  string `json:"document_type"`
	Type          string `json:"type"`
	Notes         string `json:"notes"`
	InteractionOn string `json:"interaction_on"`
}

type UpdateDocumentInteractionRequest struct {
	Type          *string `json:"type"`
	Notes         *string `json:"notes"`
	InteractionOn *string `json:"interaction_on"`
}

func parseDocumentTime(value string) (time.Time, error) {
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed, nil
	}
	return time.ParseInLocation("2006-01-02T15:04:05", value, time.Local)
}

func CreateDocumentInteraction(c *fiber.Ctx) error {
	var body CreateDocumentInteractionRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	body.DocumentType = strings.TrimSpace(strings.ToLower(body.DocumentType))
	body.Type = strings.TrimSpace(body.Type)

	if body.DocumentID == 0 || body.DocumentType == "" || body.Type == "" || body.InteractionOn == "" {
		return c.Status(400).JSON(fiber.Map{"error": "document_id, document_type, type and interaction_on are required"})
	}

	interactionOn, err := parseDocumentTime(body.InteractionOn)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid interaction_on format"})
	}

	interaction := models.DocumentInteraction{
		DocumentID:    body.DocumentID,
		DocumentType:  body.DocumentType,
		Type:          body.Type,
		Notes:         body.Notes,
		InteractionOn: interactionOn,
	}

	if err := documentInteractionDB.Create(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(interaction)
}

func GetDocumentInteractions(c *fiber.Ctx) error {
	var interactions []models.DocumentInteraction
	query := documentInteractionDB

	documentID := c.QueryInt("document_id", 0)
	documentType := strings.TrimSpace(strings.ToLower(c.Query("document_type", "")))

	if documentID != 0 {
		query = query.Where("document_id = ?", documentID)
	}
	if documentType != "" {
		query = query.Where("document_type = ?", documentType)
	}

	if err := query.Order("interaction_on desc").Find(&interactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(interactions)
}

func GetDocumentInteraction(c *fiber.Ctx) error {
	var interaction models.DocumentInteraction

	if err := documentInteractionDB.First(&interaction, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(interaction)
}

func UpdateDocumentInteraction(c *fiber.Ctx) error {
	var body UpdateDocumentInteractionRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var interaction models.DocumentInteraction
	if err := documentInteractionDB.First(&interaction, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.Type != nil {
		interaction.Type = strings.TrimSpace(*body.Type)
	}
	if body.Notes != nil {
		interaction.Notes = *body.Notes
	}
	if body.InteractionOn != nil {
		parsed, err := parseDocumentTime(*body.InteractionOn)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid interaction_on format"})
		}
		interaction.InteractionOn = parsed
	}

	if err := documentInteractionDB.Save(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(interaction)
}

func DeleteDocumentInteraction(c *fiber.Ctx) error {
	var interaction models.DocumentInteraction
	if err := documentInteractionDB.First(&interaction, c.Params("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Document interaction not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := documentInteractionDB.Delete(&interaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Document interaction deleted successfully"})
}
