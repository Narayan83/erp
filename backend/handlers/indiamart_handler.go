package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
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
		log.Printf("indiamart fetch-leads: BodyParser note: %v", err)
	}

	log.Printf("indiamart fetch-leads: request apiKey(len)=%d mobile=%s startTime=%s endTime=%s",
		len(strings.TrimSpace(apiKey)), mobile, startTime, endTime)

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

	log.Printf("indiamart fetch-leads: calling upstream URL (key redacted): %s", redactIndiaMartURL(apiURL))

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

	bodyStr := string(responseBody)
	logIndiaMartResponseBody(bodyStr)

	var parsed interface{}
	parseErr := json.Unmarshal(responseBody, &parsed)

	out := fiber.Map{
		"success":          true,
		"response":         bodyStr,
		"url":              apiURL,
		"upstream_http":    resp.StatusCode,
		"response_bytes":   len(responseBody),
		"response_is_json": parseErr == nil,
	}
	if parseErr == nil {
		out["data"] = parsed
	} else {
		out["data"] = nil
		out["parse_error"] = parseErr.Error()
	}

	return c.JSON(out)
}

// redactIndiaMartURL hides glusr_crm_key in logs.
func redactIndiaMartURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return "[unparseable-url]"
	}
	q := u.Query()
	if q.Get("glusr_crm_key") != "" {
		q.Set("glusr_crm_key", "***REDACTED***")
		u.RawQuery = q.Encode()
	}
	return u.String()
}

// logIndiaMartResponseBody prints the full IndiaMART body to server logs (pretty JSON when valid).
func logIndiaMartResponseBody(body string) {
	if body == "" {
		log.Print("indiamart fetch-leads: upstream empty body")
		return
	}
	var tmp interface{}
	if err := json.Unmarshal([]byte(body), &tmp); err != nil {
		log.Printf("indiamart fetch-leads: upstream body is not JSON (%v), full raw body:\n%s", err, body)
		return
	}
	pretty, err := json.MarshalIndent(tmp, "", "  ")
	if err != nil {
		log.Printf("indiamart fetch-leads: could not indent JSON, raw body:\n%s", body)
		return
	}
	log.Printf("indiamart fetch-leads: upstream JSON response (full, %d bytes):\n%s", len(body), string(pretty))
}
