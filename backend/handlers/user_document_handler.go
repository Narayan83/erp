package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"erp.local/backend/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var userDocumentDB *gorm.DB

// DB instance for User Documents

// Set DB
func SetUserDocumentDB(db *gorm.DB) {
	userDocumentDB = db
}

// Create User Document
func CreateUserDocument(c *fiber.Ctx) error {
	userID := c.FormValue("user_id")
	docType := c.FormValue("doc_type")
	docNumber := c.FormValue("doc_number")

	if userID == "" || docType == "" {
		return c.Status(400).JSON(fiber.Map{"error": "user_id and doc_type are required"})
	}

	// Read uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "File is required"})
	}

	// Create uploads folder path
	uploadDir := "./uploads/documents/"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload folder"})
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("doc_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	// Save file to uploads/documents
	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save file"})
	}

	// Convert user_id to uint
	uid, _ := strconv.Atoi(userID)

	// Save in DB
	doc := models.UserDocument{
		UserID:    uint(uid),
		DocType:   docType,
		DocNumber: docNumber,
		FileURL:   filePath, // local file path
	}

	if err := userDocumentDB.Create(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to store document info"})
	}

	return c.JSON(fiber.Map{
		"message": "Document uploaded successfully",
		"data":    doc,
	})
}

// Get All Documents
func GetUserDocuments(c *fiber.Ctx) error {
	var docs []models.UserDocument
	if err := userDocumentDB.Find(&docs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch documents"})
	}
	return c.JSON(docs)
}

// Get Single Document by ID
func GetUserDocumentByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var doc models.UserDocument

	if err := userDocumentDB.First(&doc, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Document not found"})
	}
	return c.JSON(doc)
}

// Update Document
func UpdateUserDocument(c *fiber.Ctx) error {
	id := c.Params("id")

	// Fetch existing document
	var doc models.UserDocument
	if err := userDocumentDB.First(&doc, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Document not found"})
	}

	// Get form values
	docType := c.FormValue("doc_type")
	docNumber := c.FormValue("doc_number")
	// Update text fields only if provided
	if docType != "" {
		doc.DocType = docType
	}
	if docNumber != "" {
		doc.DocNumber = docNumber
	}

	// Check if file is uploaded
	file, err := c.FormFile("file")
	if err == nil {
		// Create upload path if not exists
		uploadDir := "./uploads/documents/"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create upload folder"})
		}

		// Delete old file (optional but recommended)
		if doc.FileURL != "" {
			_ = os.Remove(doc.FileURL)
		}

		// Save new file
		ext := filepath.Ext(file.Filename)
		fileName := fmt.Sprintf("doc_%d%s", time.Now().UnixNano(), ext)
		filePath := filepath.Join(uploadDir, fileName)

		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save new file"})
		}

		doc.FileURL = filePath // update DB path
	}

	// Save updates
	if err := userDocumentDB.Save(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update document"})
	}

	return c.JSON(fiber.Map{
		"message": "Document updated successfully",
		"data":    doc,
	})
}

// Delete Document
func DeleteUserDocument(c *fiber.Ctx) error {
	id := c.Params("id")
	var doc models.UserDocument

	if err := userDocumentDB.First(&doc, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Document not found"})
	}

	if err := userDocumentDB.Delete(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete document"})
	}

	return c.JSON(fiber.Map{"message": "Document deleted successfully"})
}
