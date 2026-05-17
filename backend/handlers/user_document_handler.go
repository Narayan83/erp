package handler

import (
	"strconv"

	"erp.local/backend/cloudinaryutil"
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

	// Upload file to Cloudinary
	resourceType := cloudinaryutil.ResourceTypeForFile(file.Filename)
	upResult, err := cloudinaryutil.UploadFile(file, "documents", resourceType)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to upload file: " + err.Error()})
	}

	// Convert user_id to uint
	uid, _ := strconv.Atoi(userID)

	// Save in DB
	doc := models.UserDocument{
		UserID:    uint(uid),
		DocType:   docType,
		DocNumber: docNumber,
		FileURL:   upResult.SecureURL,
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
		// Delete old file from Cloudinary if it was uploaded there
		if doc.FileURL != "" {
			oldLower := doc.FileURL
			if len(oldLower) >= 4 && oldLower[:4] == "http" {
				pubID := cloudinaryutil.ExtractPublicID(doc.FileURL)
				_ = cloudinaryutil.DeleteFile(pubID, cloudinaryutil.ResourceTypeForFile(doc.FileURL))
			}
		}

		// Upload new file to Cloudinary
		resourceType := cloudinaryutil.ResourceTypeForFile(file.Filename)
		upResult, err := cloudinaryutil.UploadFile(file, "documents", resourceType)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upload new file: " + err.Error()})
		}
		doc.FileURL = upResult.SecureURL
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

	// Delete file from Cloudinary before removing DB record
	cloudinaryutil.DeleteByURL(doc.FileURL)

	if err := userDocumentDB.Delete(&doc).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete document"})
	}

	return c.JSON(fiber.Map{"message": "Document deleted successfully"})
}
