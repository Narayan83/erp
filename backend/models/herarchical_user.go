package models

type HierarchicalUser struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	UserID      uint    `gorm:"not null" json:"user_id"`                    // Current user
	UserType    string  `gorm:"type:varchar(50);not null" json:"user_type"` // Role (e.g., Customer, Dealer, Distributor, Supplier)
	ParentID    *uint   `json:"parent_id,omitempty"`                        // Parent user (e.g., dealer/distributor)
	SubID       *uint   `json:"sub_id,omitempty"`                           // Optional direct sub user
	Description *string `gorm:"type:text" json:"description,omitempty"`     // Optional note

	// --- Relationships ---
	User   User  `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	Parent *User `gorm:"foreignKey:ParentID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"parent,omitempty"`
	Sub    *User `gorm:"foreignKey:SubID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"sub,omitempty"`
}
