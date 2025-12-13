package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("cannot convert %v to StringArray", value)
	}
	return json.Unmarshal(bytes, s)
}
