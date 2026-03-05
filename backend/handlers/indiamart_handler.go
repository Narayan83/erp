package handler

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func encodeIndiaMartParam(value string) string {
	trimmed := strings.TrimSpace(value)
	return strings.ReplaceAll(url.QueryEscape(trimmed), "+", "%20")
}

func FetchIndiaMartLeads(c *fiber.Ctx) error {
	// Parse request - support both query params and JSON body
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")
	apiKey := c.Query("api_key")
	mobile := c.Query("mobile_no")

	var body struct {
		StartTime string `json:"start_time"`
		EndTime   string `json:"end_time"`
		ApiKey    string `json:"api_key"`
		Mobile    string `json:"mobile_no"`
	}

	if err := c.BodyParser(&body); err == nil {
		if startTime == "" {
			startTime = body.StartTime
		}
		if endTime == "" {
			endTime = body.EndTime
		}
		if apiKey == "" {
			apiKey = body.ApiKey
		}
		if mobile == "" {
			mobile = body.Mobile
		}
	} else {
		fmt.Printf("DEBUG - BodyParser error: %v\n", err)
	}

	fmt.Printf("DEBUG - Received request: apiKey=%s, mobile=%s, startTime=%s, endTime=%s\n", apiKey, mobile, startTime, endTime)

	if apiKey == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "API key is required. Received: " + apiKey,
		})
	}

	// Build URL with API key parameter
	apiURL := "https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=" + encodeIndiaMartParam(apiKey)

	// Add mobile if provided
	if mobile != "" {
		apiURL += "&glusr_mobile=" + encodeIndiaMartParam(mobile)
	}

	// Add dates if provided
	if startTime != "" && endTime != "" {
		apiURL += "&start_time=" + encodeIndiaMartParam(startTime) + "&end_time=" + encodeIndiaMartParam(endTime)
	}

	fmt.Println("DEBUG - Calling URL:", apiURL)

	// Make request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(apiURL)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "IndiaMART connection error: " + err.Error(),
		})
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return c.Status(resp.StatusCode).JSON(fiber.Map{
			"success": false,
			"error":   fmt.Sprintf("IndiaMART API returned status code %d", resp.StatusCode),
		})
	}

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(fiber.Map{
			"success": false,
			"error":   "Failed to read response body: " + err.Error(),
		})
	}

	// Return raw response
	return c.JSON(fiber.Map{
		"success":  true,
		"response": string(responseBody),
		"url":      apiURL,
	})
}
