package initializers

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnviromentVariables() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file ")
	}
}
