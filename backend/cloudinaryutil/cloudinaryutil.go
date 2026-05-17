package cloudinaryutil

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// newClient creates a Cloudinary client from environment variables.
func newClient() (*cloudinary.Cloudinary, error) {
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		return nil, fmt.Errorf("cloudinary init: %w", err)
	}
	return cld, nil
}

// baseFolder returns the root folder from env (defaults to "ERP").
func baseFolder() string {
	f := os.Getenv("CLOUDINARY_FOLDER")
	if f == "" {
		f = "ERP"
	}
	return f
}

// UploadResult holds the Cloudinary response fields we care about.
type UploadResult struct {
	SecureURL string
	PublicID  string
}

// UploadFile uploads a multipart file to Cloudinary under baseFolder/subFolder.
// resourceType should be "image" for images, "raw" for documents/PDFs.
func UploadFile(fileHeader *multipart.FileHeader, subFolder string, resourceType string) (UploadResult, error) {
	cld, err := newClient()
	if err != nil {
		return UploadResult{}, err
	}

	f, err := fileHeader.Open()
	if err != nil {
		return UploadResult{}, fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	folder := baseFolder()
	if subFolder != "" {
		folder = folder + "/" + subFolder
	}

	rt := strings.ToLower(resourceType)

	params := uploader.UploadParams{
		Folder:         folder,
		ResourceType:   rt,
		UseFilename:    api.Bool(true),
		UniqueFilename: api.Bool(true),
	}

	ctx := context.Background()
	resp, err := cld.Upload.Upload(ctx, f, params)
	if err != nil {
		return UploadResult{}, fmt.Errorf("cloudinary upload: %w", err)
	}

	return UploadResult{
		SecureURL: resp.SecureURL,
		PublicID:  resp.PublicID,
	}, nil
}

// DeleteFile deletes a file from Cloudinary by its public ID.
// resourceType should be "image" or "raw".
func DeleteFile(publicID string, resourceType string) error {
	if publicID == "" {
		return nil
	}
	cld, err := newClient()
	if err != nil {
		return err
	}

	rt := strings.ToLower(resourceType)

	ctx := context.Background()
	_, err = cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: rt,
	})
	return err
}

// DeleteByURL deletes a Cloudinary asset identified by its full secure URL.
// The resource type (image/raw) is inferred from the URL path.
// No-op if the URL is not a Cloudinary URL.
func DeleteByURL(url string) {
	lower := strings.ToLower(url)
	if !strings.HasPrefix(lower, "https://res.cloudinary.com/") {
		return
	}
	pubID := ExtractPublicID(url)
	if pubID == "" {
		return
	}
	rt := "image"
	if strings.Contains(lower, "/raw/upload/") {
		rt = "raw"
	}
	_ = DeleteFile(pubID, rt)
}

// ExtractPublicID extracts the Cloudinary public_id from a secure URL.
// Cloudinary URL format:
//
//	https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{version}/{public_id}.{ext}
//
// Returns "" if the URL is not a Cloudinary URL.
func ExtractPublicID(secureURL string) string {
	// Look for "/upload/" marker
	idx := strings.Index(secureURL, "/upload/")
	if idx == -1 {
		return ""
	}
	// Everything after "/upload/"
	rest := secureURL[idx+len("/upload/"):]
	// Strip optional version segment "v12345678/"
	if len(rest) > 1 && rest[0] == 'v' {
		slash := strings.Index(rest, "/")
		if slash != -1 {
			// Check that the part between 'v' and '/' is numeric
			candidate := rest[1:slash]
			isVer := true
			for _, ch := range candidate {
				if ch < '0' || ch > '9' {
					isVer = false
					break
				}
			}
			if isVer {
				rest = rest[slash+1:]
			}
		}
	}
	// Strip file extension
	dot := strings.LastIndex(rest, ".")
	if dot != -1 {
		rest = rest[:dot]
	}
	return rest
}

// ResourceTypeForFile returns "image" for image files, "raw" for everything else.
func ResourceTypeForFile(filename string) string {
	ext := strings.ToLower(filename)
	if strings.HasSuffix(ext, ".jpg") ||
		strings.HasSuffix(ext, ".jpeg") ||
		strings.HasSuffix(ext, ".png") ||
		strings.HasSuffix(ext, ".gif") ||
		strings.HasSuffix(ext, ".webp") ||
		strings.HasSuffix(ext, ".svg") ||
		strings.HasSuffix(ext, ".bmp") ||
		strings.HasSuffix(ext, ".tiff") {
		return "image"
	}
	return "raw"
}
