package handler

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Track in-flight requests per API key to prevent concurrent calls
var (
	inflightMutex sync.Mutex
	inflight      = make(map[string]chan struct{})
)

// IndiaMartLeadRequest represents the request body for fetching leads
type IndiaMartLeadRequest struct {
	APIKey string `json:"apiKey" binding:"required"`
	Start  int    `json:"start"`
	Rows   int    `json:"rows"`
}

// IndiaMartAPIResponse represents the response from IndiaMART API
type IndiaMartAPIResponse struct {
	STATUS        string          `json:"STATUS"`
	MESSAGE       string          `json:"MESSAGE"`
	DATA          []IndiaMartLead `json:"DATA"`
	TOTAL_RECORDS int             `json:"TOTAL_RECORDS"`
}

// IndiaMartLead represents a single lead from IndiaMART
type IndiaMartLead struct {
	UNIQUE_QUERY_ID     string `json:"UNIQUE_QUERY_ID"`
	QUERY_TIME          string `json:"QUERY_TIME"`
	SENDER_NAME         string `json:"SENDER_NAME"`
	SENDER_EMAIL        string `json:"SENDER_EMAIL"`
	SENDER_MOBILE       string `json:"SENDER_MOBILE"`
	SENDER_COMPANY      string `json:"SENDER_COMPANY"`
	SENDER_CITY         string `json:"SENDER_CITY"`
	SENDER_STATE        string `json:"SENDER_STATE"`
	QUERY_PRODUCT_NAME  string `json:"QUERY_PRODUCT_NAME"`
	QUERY_MESSAGE       string `json:"QUERY_MESSAGE"`
	QUERY_CATEGORY_NAME string `json:"QUERY_CATEGORY_NAME"`
	STATUS              string `json:"STATUS"`
	// Additional fields from JSON
	LeadID         string   `json:"lead_id"`
	Designation    string   `json:"designation"`
	BuyerAddress   string   `json:"buyer_address"`
	BuyerCountry   string   `json:"buyer_country"`
	GSTIN          string   `json:"gstin"`
	EnquirySource  string   `json:"enquiry_source"`
	LeadStage      string   `json:"lead_stage"`
	LeadCategory   string   `json:"lead_category"`
	EstimatedValue float64  `json:"estimated_value"`
	AssignedTo     string   `json:"assigned_to"`
	NextFollowup   *string  `json:"next_followup"`
	Remarks        string   `json:"remarks"`
	LeadTags       []string `json:"lead_tags"`
}

// JSONLead represents the structure of leads in the JSON file
type JSONLead struct {
	LeadID           string   `json:"lead_id"`
	BuyerCompany     string   `json:"buyer_company"`
	BuyerName        string   `json:"buyer_name"`
	Designation      string   `json:"designation"`
	BuyerMobile      string   `json:"buyer_mobile"`
	BuyerEmail       string   `json:"buyer_email"`
	BuyerAddress     string   `json:"buyer_address"`
	BuyerCity        string   `json:"buyer_city"`
	BuyerState       string   `json:"buyer_state"`
	BuyerCountry     string   `json:"buyer_country"`
	GSTIN            string   `json:"gstin"`
	ProductName      string   `json:"product_name"`
	BuyerRequirement string   `json:"buyer_requirement"`
	EnquirySource    string   `json:"enquiry_source"`
	EnquiryDate      string   `json:"enquiry_date"`
	LeadStage        string   `json:"lead_stage"`
	LeadCategory     string   `json:"lead_category"`
	EstimatedValue   float64  `json:"estimated_value"`
	AssignedTo       string   `json:"assigned_to"`
	NextFollowup     *string  `json:"next_followup"`
	Remarks          string   `json:"remarks"`
	LeadTags         []string `json:"lead_tags"`
}

// FetchIndiaMartLeads fetches leads from IndiaMART API via backend proxy
func FetchIndiaMartLeads(c *fiber.Ctx) error {
	var req IndiaMartLeadRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate API key
	if req.APIKey == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "API key is required",
		})
	}

	// Manage in-flight requests per API key (deduplication)
	inflightMutex.Lock()
	if ch, exists := inflight[req.APIKey]; exists {
		// Another request for this API key is in progress; wait for it to complete
		inflightMutex.Unlock()
		fmt.Printf("Request for API key already in-flight; waiting for completion...\n")
		<-ch
		// After waiting, re-acquire the lock
		inflightMutex.Lock()
	}

	// Mark this API key as in-flight
	done := make(chan struct{})
	inflight[req.APIKey] = done
	inflightMutex.Unlock()

	// Ensure we clean up the in-flight marker when done
	defer func() {
		inflightMutex.Lock()
		delete(inflight, req.APIKey)
		inflightMutex.Unlock()
		close(done)
	}()

	// Set defaults
	if req.Rows == 0 {
		req.Rows = 50
	}

	// Build IndiaMART API URL
	// IndiaMART Mobile API endpoint (most commonly used)
	url := fmt.Sprintf(
		"https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=%s&start=%d&end=%d",
		req.APIKey,
		req.Start,
		req.Start+req.Rows,
	)

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make request to IndiaMART API with retry on 429 (rate limiting)
	const maxRetries = 3
	backoff := time.Second
	var resp *http.Response
	var err error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		resp, err = client.Get(url)
		if err != nil {
			fmt.Printf("Error fetching from IndiaMART (attempt %d): %v\n", attempt+1, err)
			// if last attempt, return error
			if attempt == maxRetries {
				return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
					"error":   "Failed to connect to IndiaMART API",
					"details": err.Error(),
				})
			}
			time.Sleep(backoff)
			backoff *= 2
			continue
		}

		// If IndiaMART responded, but with 429, respect Retry-After header and retry
		if resp.StatusCode == http.StatusTooManyRequests {
			retryAfter := resp.Header.Get("Retry-After")
			fmt.Printf("IndiaMART returned 429 (attempt %d). Retry-After: %s\n", attempt+1, retryAfter)
			io.Copy(io.Discard, resp.Body)
			resp.Body.Close()

			// parse Retry-After as seconds if possible
			wait := backoff
			if retryAfter != "" {
				if secs, perr := time.ParseDuration(retryAfter + "s"); perr == nil {
					wait = secs
				}
			}

			if attempt == maxRetries {
				// Try fallback: load cached leads from local JSON and return those
				fmt.Printf("Max retries reached; attempting JSON fallback for leads\n")

				// Try multiple possible paths for the fallback JSON
				fallbackPaths := []string{"../frontend/src/CRM/Components/IndiaMart/leads.json", "./frontend/src/CRM/Components/IndiaMart/leads.json", "frontend/src/CRM/Components/IndiaMart/leads.json"}
				var leads []IndiaMartLead
				var lerr error

				for _, path := range fallbackPaths {
					leads, lerr = loadFallbackLeadsFromJSON(path)
					if lerr == nil && len(leads) > 0 {
						fmt.Printf("Successfully loaded fallback leads from %s\n", path)
						break
					}
				}

				if len(leads) > 0 {
					fallbackResp := IndiaMartAPIResponse{
						STATUS:        "OK-FALLBACK",
						MESSAGE:       "Returned cached leads due to IndiaMART rate limit",
						DATA:          leads,
						TOTAL_RECORDS: len(leads),
					}
					// include a header so frontend can detect fallback
					c.Set("X-IndiaMart-Fallback", "true")
					return c.JSON(fallbackResp)
				}

				// if fallback not available, return 429 to client with IndiaMART response info
				fmt.Printf("Fallback failed: %v (leads count: %d)\n", lerr, len(leads))
				return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
					"error":      "IndiaMART API rate limit exceeded and fallback failed",
					"statusCode": resp.StatusCode,
				})
			}

			fmt.Printf("Waiting %v before retry...\n", wait)
			time.Sleep(wait)
			backoff *= 2
			continue
		}

		// Successful non-429 response, break loop and proceed
		break
	}

	if resp == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "No response from IndiaMART",
		})
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read IndiaMART response",
		})
	}

	// Check HTTP status
	if resp.StatusCode != http.StatusOK {
		return c.Status(resp.StatusCode).JSON(fiber.Map{
			"error":      "IndiaMART API returned error",
			"statusCode": resp.StatusCode,
			"response":   string(body),
		})
	}

	// Parse IndiaMART response
	var apiResponse IndiaMartAPIResponse
	if err := json.Unmarshal(body, &apiResponse); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":    "Failed to parse IndiaMART response",
			"response": string(body),
		})
	}

	// Return the response to frontend
	return c.JSON(apiResponse)
}

// loadFallbackLeadsFromCSV loads a simple CSV with known headers and maps to IndiaMartLead
func loadFallbackLeadsFromCSV(path string) ([]IndiaMartLead, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.TrimLeadingSpace = true

	// read header
	headers, err := r.Read()
	if err != nil {
		return nil, err
	}

	// build index map
	idx := make(map[string]int)
	for i, h := range headers {
		idx[strings.TrimSpace(strings.ToLower(h))] = i
	}

	var leads []IndiaMartLead
	for {
		rec, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return leads, err
		}

		// helper to safely get a column
		get := func(name string) string {
			if i, ok := idx[name]; ok && i < len(rec) {
				return strings.TrimSpace(rec[i])
			}
			return ""
		}

		lead := IndiaMartLead{
			SENDER_NAME:         get("name"),
			SENDER_EMAIL:        get("email"),
			SENDER_MOBILE:       get("mobile"),
			SENDER_COMPANY:      get("business"),
			SENDER_CITY:         get("city"),
			SENDER_STATE:        get("state"),
			QUERY_PRODUCT_NAME:  get("product"),
			QUERY_MESSAGE:       get("requirement"),
			QUERY_CATEGORY_NAME: get("category"),
			STATUS:              get("stage"),
		}

		leads = append(leads, lead)
	}

	return leads, nil
}

// loadFallbackLeadsFromJSON loads sample leads from a JSON file and maps to IndiaMartLead
func loadFallbackLeadsFromJSON(path string) ([]IndiaMartLead, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var jsonLeads []JSONLead
	if err := json.NewDecoder(f).Decode(&jsonLeads); err != nil {
		return nil, err
	}

	var leads []IndiaMartLead
	for _, jl := range jsonLeads {
		lead := IndiaMartLead{
			UNIQUE_QUERY_ID:     jl.LeadID,
			QUERY_TIME:          jl.EnquiryDate,
			SENDER_NAME:         jl.BuyerName,
			SENDER_EMAIL:        jl.BuyerEmail,
			SENDER_MOBILE:       jl.BuyerMobile,
			SENDER_COMPANY:      jl.BuyerCompany,
			SENDER_CITY:         jl.BuyerCity,
			SENDER_STATE:        jl.BuyerState,
			QUERY_PRODUCT_NAME:  jl.ProductName,
			QUERY_MESSAGE:       jl.BuyerRequirement,
			QUERY_CATEGORY_NAME: jl.LeadCategory,
			STATUS:              jl.LeadStage,
			// Map additional fields
			LeadID:         jl.LeadID,
			Designation:    jl.Designation,
			BuyerAddress:   jl.BuyerAddress,
			BuyerCountry:   jl.BuyerCountry,
			GSTIN:          jl.GSTIN,
			EnquirySource:  jl.EnquirySource,
			LeadStage:      jl.LeadStage,
			LeadCategory:   jl.LeadCategory,
			EstimatedValue: jl.EstimatedValue,
			AssignedTo:     jl.AssignedTo,
			NextFollowup:   jl.NextFollowup,
			Remarks:        jl.Remarks,
			LeadTags:       jl.LeadTags,
		}
		leads = append(leads, lead)
	}

	return leads, nil
}
