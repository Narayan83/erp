package handler

import (
	"erp.local/backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var printerHeaderDB *gorm.DB

func SetPrinterHeaderDB(db *gorm.DB) {
	printerHeaderDB = db
}

/* ================= REQUEST DTO ================= */

type CreatePrinterHeaderRequest struct {
	HeaderTitle    string `json:"header_title"`
	HeaderSubtitle string `json:"header_subtitle"`
	Address        string `json:"address"`
	Pin            string `json:"pin"`
	GSTIN          string `json:"gstin"`
	Mobile         string `json:"mobile"`
	Email          string `json:"email"`
	Website        string `json:"website"`
	LogoData       string `json:"logo_data"`
	Alignment      string `json:"alignment"`
}

type UpdatePrinterHeaderRequest struct {
	HeaderTitle    *string `json:"header_title"`
	HeaderSubtitle *string `json:"header_subtitle"`
	Address        *string `json:"address"`
	Pin            *string `json:"pin"`
	GSTIN          *string `json:"gstin"`
	Mobile         *string `json:"mobile"`
	Email          *string `json:"email"`
	Website        *string `json:"website"`
	LogoData       *string `json:"logo_data"`
	Alignment      *string `json:"alignment"`
}

/* ================= HANDLERS ================= */

func CreatePrinterHeader(c *fiber.Ctx) error {
	var body CreatePrinterHeaderRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if body.HeaderTitle == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Header title is required"})
	}

	var bodyAlignment = body.Alignment
	if bodyAlignment == "" {
		bodyAlignment = "center"
	}

	var existing models.PrinterHeader
	if err := printerHeaderDB.Order("id desc").First(&existing).Error; err != nil && err != gorm.ErrRecordNotFound {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	} else if err == nil {
		existing.HeaderTitle = body.HeaderTitle
		existing.HeaderSubtitle = body.HeaderSubtitle
		existing.Address = body.Address
		existing.Pin = body.Pin
		existing.GSTIN = body.GSTIN
		existing.Mobile = body.Mobile
		existing.Email = body.Email
		existing.Website = body.Website
		existing.LogoData = body.LogoData
		existing.Alignment = bodyAlignment
		if err := printerHeaderDB.Save(&existing).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(existing)
	}

	header := models.PrinterHeader{
		HeaderTitle:    body.HeaderTitle,
		HeaderSubtitle: body.HeaderSubtitle,
		Address:        body.Address,
		Pin:            body.Pin,
		GSTIN:          body.GSTIN,
		Mobile:         body.Mobile,
		Email:          body.Email,
		Website:        body.Website,
		LogoData:       body.LogoData,
		Alignment:      bodyAlignment,
	}

	if err := printerHeaderDB.Create(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(201).JSON(header)
}

func GetPrinterHeaders(c *fiber.Ctx) error {
	var headers []models.PrinterHeader
	printerHeaderDB.Order("id desc").Find(&headers)
	return c.JSON(headers)
}

func GetPrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")
	var header models.PrinterHeader

	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(header)
}

func UpdatePrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdatePrinterHeaderRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var header models.PrinterHeader
	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if body.HeaderTitle != nil {
		header.HeaderTitle = *body.HeaderTitle
	}
	if body.HeaderSubtitle != nil {
		header.HeaderSubtitle = *body.HeaderSubtitle
	}
	if body.Address != nil {
		header.Address = *body.Address
	}
	if body.Pin != nil {
		header.Pin = *body.Pin
	}
	if body.GSTIN != nil {
		header.GSTIN = *body.GSTIN
	}
	if body.Mobile != nil {
		header.Mobile = *body.Mobile
	}
	if body.Email != nil {
		header.Email = *body.Email
	}
	if body.Website != nil {
		header.Website = *body.Website
	}
	if body.LogoData != nil {
		header.LogoData = *body.LogoData
	}
	if body.Alignment != nil {
		header.Alignment = *body.Alignment
	}

	if err := printerHeaderDB.Save(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(header)
}

func DeletePrinterHeader(c *fiber.Ctx) error {
	id := c.Params("id")

	var header models.PrinterHeader
	if err := printerHeaderDB.First(&header, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(404).JSON(fiber.Map{"error": "Header not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	if err := printerHeaderDB.Delete(&header).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Printer header deleted"})
}
