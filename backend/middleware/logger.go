package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RequestLogger logs all incoming requests with method, path, and response status
func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Log the incoming request
		method := c.Method()
		path := c.Path()
		ip := c.IP()

		fmt.Printf("[%s] %s %s from %s\n", time.Now().Format("2006-01-02 15:04:05"), method, path, ip)

		// Process request
		err := c.Next()

		// Log the response
		duration := time.Since(start)
		status := c.Response().StatusCode()

		fmt.Printf("[%s] %s %s -> %d (took %v)\n", time.Now().Format("2006-01-02 15:04:05"), method, path, status, duration)

		return err
	}
}
