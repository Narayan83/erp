package main

import (
	"log"

	"erp.local/backend/initializers"
	"erp.local/backend/models"
)

func init() {
	initializers.LoadEnviromentVariables()
	initializers.ConnectToDb()
}

func main() {
	// Note: Employee is now a separate table
	// Uncomment below if you need to drop and recreate the table
	// initializers.DB.Exec(`DROP TABLE IF EXISTS employees CASCADE;`)
	initializers.DB.Exec(`DROP TABLE IF EXISTS employee_user_relations CASCADE;`)

	err := initializers.DB.AutoMigrate(
		&models.Category{},
		&models.Subcategory{},
		&models.Unit{},
		&models.Store{},
		&models.Tax{},
		&models.Tag{},
		&models.Product{},
		&models.ProductVariant{},
		&models.User{},
		&models.UserAddress{},
		&models.UserBankAccount{},
		&models.UserDocument{},
		&models.Quotation{},
		&models.QuotationItem{},
		&models.SalesOrder{},
		&models.SalesOrderItem{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},

		&models.HsnCode{},
		&models.Size{},
		&models.Lead{},
		&models.RoleManagement{},
		&models.Role{},
		&models.Menu{},

		&models.Employee{},
		&models.Supplier{},
		&models.Dealer{},
		&models.Distributor{},

		// &models.Bank{},

		//30/9/2025
		&models.TandC{},

		&models.QuotationTable{},
		&models.QuotationTableItems{},
		&models.QutationTemplates{},

		// User and Employee Relations
		&models.UserHierarchy{},
		&models.UserRoleMapping{},
		&models.Department{},
		&models.DepartmentRelation{},
		&models.EmployeeUserRelation{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	// Ensure ON DELETE CASCADE for product_variants.product_id -> products.id
	// and clean up many2many join table constraints for product_tags to cascade on product delete.
	// Note: AutoMigrate does not change existing FK constraints, so we enforce them explicitly here for Postgres.

	// product_variants -> products CASCADE
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
	`)
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS product_variants DROP CONSTRAINT IF EXISTS fk_products_variants;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE product_variants
			ADD CONSTRAINT product_variants_product_id_fkey
			FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// product_tags (many2many) -> products CASCADE
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS product_tags DROP CONSTRAINT IF EXISTS product_tags_product_id_fkey;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE product_tags
			ADD CONSTRAINT product_tags_product_id_fkey
			FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// Ensure employee_user_relations.employee_id FK references users(id)
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS employee_user_relations DROP CONSTRAINT IF EXISTS employee_user_relations_employee_id_fkey;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE employee_user_relations
			ADD CONSTRAINT employee_user_relations_employee_id_fkey
			FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE;
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// Fixup: ensure user_addresses.user_id references users(id).
	// Historical model tags sometimes caused GORM to create an incorrect
	// FK referencing employees(id) (constraint names like fk_employees_addresses).
	// Drop any such constraint and add the correct FK to users(id) with CASCADE.
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS user_addresses DROP CONSTRAINT IF EXISTS fk_employees_addresses;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE IF EXISTS user_addresses
			ADD CONSTRAINT user_addresses_user_id_fkey
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
		exCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// Fixup: ensure user_bank_accounts.user_id references users(id).
	// Similar to user_addresses, drop any legacy FK to employees table.
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS user_bank_accounts DROP CONSTRAINT IF EXISTS fk_employees_bank_accounts;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE IF EXISTS user_bank_accounts
			ADD CONSTRAINT user_bank_accounts_user_id_fkey
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// Fixup: ensure user_documents.user_id references users(id).
	initializers.DB.Exec(`
		ALTER TABLE IF EXISTS user_documents DROP CONSTRAINT IF EXISTS fk_employees_documents;
	`)
	initializers.DB.Exec(`
		DO $$ BEGIN
			ALTER TABLE IF EXISTS user_documents
			ADD CONSTRAINT user_documents_user_id_fkey
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
		EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	`)

	// Add indexes for performance
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_is_employee ON users(is_employee);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_is_customer ON users(is_customer);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_is_supplier ON users(is_supplier);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_is_dealer ON users(is_dealer);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_users_is_distributor ON users(is_distributor);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_employee_user_relations_user_id ON employee_user_relations(user_id);
	`)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_departments_head_id ON departments(head_id);
	`)
}
