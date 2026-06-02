package handler

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
)

// GetGSTINDetails proxies the request to the GST API to avoid CORS issues
func GetGSTINDetails(c *fiber.Ctx) error {
	gstin := c.Params("gstin")
	if gstin == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "GSTIN is required",
		})
	}

	// External API configuration
	// Note: In a real app, these should ideally spend time in .env or a database
	aspid := "1649731521"
	password := "NNNar@988675"
	gstinParam := "34AACCC1596Q002" // From user's provided URL

	apiURL := fmt.Sprintf("https://deprecatedgstapi.charteredinfo.com/commonapi/v1.1/search?aspid=%s&password=%s&Action=TP&Gstin=%s&SearchGstin=%s",
		aspid, password, gstinParam, gstin)

	fmt.Printf("DEBUG - Calling GST API for: %s\n", gstin)

	// Make request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "GST API connection error: " + err.Error(),
		})
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to read GST API response: " + err.Error(),
		})
	}

	// Return the raw response from the external API to the frontend
	// We set the status code from the external API or 200 if OK
	statusCode := resp.StatusCode
	if statusCode == 0 {
		statusCode = fiber.StatusOK
	}

	c.Set("Content-Type", "application/json")
	return c.Status(statusCode).Send(responseBody)
}
