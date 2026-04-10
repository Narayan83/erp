package initializers

import (
	"log"
	"os"
)

// CreateRequiredDirectories initializes all necessary directories for the application
func CreateRequiredDirectories() {
	directories := []string{
		"uploads",
		"uploads/documents",
		"uploads/quotations",
	}

	for _, dir := range directories {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err := os.MkdirAll(dir, os.ModePerm)
			if err != nil {
				log.Printf("Warning: Failed to create directory '%s': %v\n", dir, err)
			} else {
				log.Printf("Created directory: %s\n", dir)
			}
		}
	}
}
