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

	// Pre-migration: Handle new NOT NULL columns for existing quotation_tables records
	// This section handles columns that were added after initial data was inserted

	// Check if quotation_tables exists
	var tableExists bool
	initializers.DB.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables 
			WHERE table_name = 'quotation_tables'
		)
	`).Scan(&tableExists)

	if tableExists {
		// Check if table has any records
		var recordCount int64
		initializers.DB.Raw(`SELECT COUNT(*) FROM quotation_tables`).Scan(&recordCount)

		if recordCount > 0 {
			log.Printf("Found %d existing records in quotation_tables, preparing migration...", recordCount)

			// Ensure dependent tables exist first (handle `series.name` safely below)
			initializers.DB.AutoMigrate(&models.Company{}, &models.CompanyBranch{})

			// Ensure `series` table exists and add `name` column safely if missing.
			var seriesTableExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.tables 
					WHERE table_name = 'series'
				)
			`).Scan(&seriesTableExists)

			if seriesTableExists {
				var seriesNameColExists bool
				initializers.DB.Raw(`
					SELECT EXISTS (
						SELECT 1 FROM information_schema.columns 
						WHERE table_name = 'series' AND column_name = 'name'
					)
				`).Scan(&seriesNameColExists)

				if !seriesNameColExists {
					log.Println("Adding nullable 'name' column to series table for migration...")
					initializers.DB.Exec(`ALTER TABLE series ADD COLUMN name varchar(50)`)
					// Populate existing rows to avoid NOT NULL violation. Prefer prefix if available.
					initializers.DB.Exec(`UPDATE series SET name = COALESCE(prefix, '') WHERE name IS NULL`)
					initializers.DB.Exec(`ALTER TABLE series ALTER COLUMN name SET NOT NULL`)
				}
				// Ensure prefix column exists (some older rows may be missing it)
				var seriesPrefixColExists bool
				initializers.DB.Raw(`
					SELECT EXISTS (
						SELECT 1 FROM information_schema.columns 
						WHERE table_name = 'series' AND column_name = 'prefix'
					)
				`).Scan(&seriesPrefixColExists)

				if !seriesPrefixColExists {
					log.Println("Adding nullable 'prefix' column to series table for migration...")
					initializers.DB.Exec(`ALTER TABLE series ADD COLUMN prefix varchar(50)`)
					initializers.DB.Exec(`UPDATE series SET prefix = '' WHERE prefix IS NULL`)
					initializers.DB.Exec(`ALTER TABLE series ALTER COLUMN prefix SET NOT NULL`)
				}

				// Ensure postfix column exists
				var seriesPostfixColExists bool
				initializers.DB.Raw(`
					SELECT EXISTS (
						SELECT 1 FROM information_schema.columns 
						WHERE table_name = 'series' AND column_name = 'postfix'
					)
				`).Scan(&seriesPostfixColExists)

				if !seriesPostfixColExists {
					log.Println("Adding nullable 'postfix' column to series table for migration...")
					initializers.DB.Exec(`ALTER TABLE series ADD COLUMN postfix varchar(50)`)
					initializers.DB.Exec(`UPDATE series SET postfix = '' WHERE postfix IS NULL`)
					initializers.DB.Exec(`ALTER TABLE series ALTER COLUMN postfix SET NOT NULL`)
				}
			}

			// Get or create default values for foreign keys
			var defaultSeriesID, defaultCompanyID, defaultBranchID uint

			// Get/Create default series
			initializers.DB.Raw(`SELECT id FROM series ORDER BY id LIMIT 1`).Scan(&defaultSeriesID)
			if defaultSeriesID == 0 {
				log.Println("Creating default series for migration...")
				initializers.DB.Exec(`
					INSERT INTO series (prefix, prefix_number, remarks, is_active) 
					VALUES ('QT', 1, 'Default quotation series', true)
				`)
				initializers.DB.Raw(`SELECT id FROM series ORDER BY id LIMIT 1`).Scan(&defaultSeriesID)
			}

			// Get/Create default company
			initializers.DB.Raw(`SELECT id FROM companies ORDER BY id LIMIT 1`).Scan(&defaultCompanyID)
			if defaultCompanyID == 0 {
				log.Println("Creating default company for migration...")
				initializers.DB.Exec(`
					INSERT INTO companies (name, code) 
					VALUES ('Default Company', 'DEFAULT')
				`)
				initializers.DB.Raw(`SELECT id FROM companies ORDER BY id LIMIT 1`).Scan(&defaultCompanyID)
			}

			// Get/Create default company branch
			initializers.DB.Raw(`SELECT id FROM company_branches ORDER BY id LIMIT 1`).Scan(&defaultBranchID)
			if defaultBranchID == 0 && defaultCompanyID > 0 {
				log.Println("Creating default company branch for migration...")
				initializers.DB.Exec(`
					INSERT INTO company_branches (company_id, name, is_head_office) 
					VALUES (?, 'Main Branch', true)
				`, defaultCompanyID)
				initializers.DB.Raw(`SELECT id FROM company_branches ORDER BY id LIMIT 1`).Scan(&defaultBranchID)
			}

			// Handle series_id column
			var seriesColExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'series_id'
				)
			`).Scan(&seriesColExists)

			if !seriesColExists && defaultSeriesID > 0 {
				log.Println("Adding and populating series_id column...")
				initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN series_id bigint`)
				initializers.DB.Exec(`UPDATE quotation_tables SET series_id = ? WHERE series_id IS NULL`, defaultSeriesID)
				// keep it not null for newly created column to not break older code paths
				initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN series_id SET NOT NULL`)
			} else if seriesColExists {
				// If column exists and is NOT NULL, allow NULLs now so series becomes optional going forward
				log.Println("Ensuring series_id column is nullable (DROP NOT NULL)")
				initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN series_id DROP NOT NULL`)
			}

			// Handle company_id column
			var companyColExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'company_id'
				)
			`).Scan(&companyColExists)

			if !companyColExists && defaultCompanyID > 0 {
				log.Println("Adding and populating company_id column...")
				initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN company_id bigint`)
				initializers.DB.Exec(`UPDATE quotation_tables SET company_id = ? WHERE company_id IS NULL`, defaultCompanyID)
				initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN company_id SET NOT NULL`)
			}

			// Handle company_branch_id column
			var branchColExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'company_branch_id'
				)
			`).Scan(&branchColExists)

			if !branchColExists && defaultBranchID > 0 {
				log.Println("Adding and populating company_branch_id column...")
				initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN company_branch_id bigint`)
				initializers.DB.Exec(`UPDATE quotation_tables SET company_branch_id = ? WHERE company_branch_id IS NULL`, defaultBranchID)
				initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN company_branch_id SET NOT NULL`)
			}

			// Handle quotation_scp_count column (default to 0)
			// First, detect if a misspelled column exists from older schema versions
			var typoExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'qutation_scp_count'
				)
			`).Scan(&typoExists)

			var scpCountExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'quotation_scp_count'
				)
			`).Scan(&scpCountExists)

			if typoExists {
				if !scpCountExists {
					log.Println("Renaming typo column qutation_scp_count -> quotation_scp_count...")
					initializers.DB.Exec(`ALTER TABLE quotation_tables RENAME COLUMN qutation_scp_count TO quotation_scp_count`)
					scpCountExists = true
				} else {
					log.Println("Copying values from qutation_scp_count to quotation_scp_count and dropping typo column...")
					initializers.DB.Exec(`UPDATE quotation_tables SET quotation_scp_count = qutation_scp_count WHERE quotation_scp_count IS NULL`)
					initializers.DB.Exec(`ALTER TABLE quotation_tables DROP COLUMN qutation_scp_count`)
				}
			}

			if !scpCountExists {
				log.Println("Adding and populating quotation_scp_count column...")
				initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN quotation_scp_count bigint`)
				initializers.DB.Exec(`UPDATE quotation_tables SET quotation_scp_count = 0 WHERE quotation_scp_count IS NULL`)
				initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN quotation_scp_count SET NOT NULL`)
			}

			// Handle billing_address_id column (use default value 1 if user_addresses exist)
			var billingAddrExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'billing_address_id'
				)
			`).Scan(&billingAddrExists)

			if !billingAddrExists {
				var defaultAddressID uint
				initializers.DB.Raw(`SELECT id FROM user_addresses ORDER BY id LIMIT 1`).Scan(&defaultAddressID)
				if defaultAddressID > 0 {
					log.Println("Adding and populating billing_address_id column...")
					initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN billing_address_id bigint`)
					initializers.DB.Exec(`UPDATE quotation_tables SET billing_address_id = ? WHERE billing_address_id IS NULL`, defaultAddressID)
					initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN billing_address_id SET NOT NULL`)
				}
			}

			// Handle shipping_address_id column (use default value 1 if user_addresses exist)
			var shippingAddrExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'quotation_tables' AND column_name = 'shipping_address_id'
				)
			`).Scan(&shippingAddrExists)

			if !shippingAddrExists {
				var defaultAddressID uint
				initializers.DB.Raw(`SELECT id FROM user_addresses ORDER BY id LIMIT 1`).Scan(&defaultAddressID)
				if defaultAddressID > 0 {
					log.Println("Adding and populating shipping_address_id column...")
					initializers.DB.Exec(`ALTER TABLE quotation_tables ADD COLUMN shipping_address_id bigint`)
					initializers.DB.Exec(`UPDATE quotation_tables SET shipping_address_id = ? WHERE shipping_address_id IS NULL`, defaultAddressID)
					initializers.DB.Exec(`ALTER TABLE quotation_tables ALTER COLUMN shipping_address_id SET NOT NULL`)
				}
			}

			log.Println("Pre-migration column setup completed.")
		}
	}

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

		&models.QuotationItem{},
		&models.SalesOrder{},
		&models.SalesOrderItem{},
		&models.PurchaseOrder{},
		&models.PurchaseOrderItem{},

		&models.HsnCode{},
		&models.Size{},
		&models.Lead{},
		&models.LeadInteraction{},
		&models.LeadFollowUp{},
		&models.RoleManagement{},
		&models.Role{},
		&models.Menu{},

		&models.Employee{},
		&models.Supplier{},
		&models.Dealer{},
		&models.Distributor{},

		// Company and Branches
		&models.Company{},
		&models.CompanyBranch{},
		&models.CompanyBranchBank{},

		//30/9/2025
		&models.TandC{},
		&models.Series{},
		&models.PrinterHeader{},

		&models.QuotationTable{},
		&models.QuotationTableItems{},
		&models.QutationTemplates{},

		// User and Employee Relations
		&models.UserHierarchy{},
		&models.UserRoleMapping{},
		&models.Department{},

		&models.Designation{},
		&models.Department{},
		&models.OrganizationUnit{},
		&models.Employee{},
		&models.EmployeeHierarchy{},
		&models.EmployeeOrganizationUnit{},
		&models.Integration{},

		// CRM Configuration
		&models.CRMTag{},
		&models.LeadSource{},
		&models.RejectionReason{},
		&models.ServiceItem{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	// Handle PrinterHeader column rename: logo_path -> logo_data
	var printerHeaderTableExists bool
	initializers.DB.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables 
			WHERE table_name = 'printer_headers'
		)
	`).Scan(&printerHeaderTableExists)

	if printerHeaderTableExists {
		// Check if old logo_path column exists
		var oldLogoPathExists bool
		initializers.DB.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'printer_headers' AND column_name = 'logo_path'
			)
		`).Scan(&oldLogoPathExists)

		if oldLogoPathExists {
			// Check if new logo_data column exists
			var newLogoDataExists bool
			initializers.DB.Raw(`
				SELECT EXISTS (
					SELECT 1 FROM information_schema.columns 
					WHERE table_name = 'printer_headers' AND column_name = 'logo_data'
				)
			`).Scan(&newLogoDataExists)

			if newLogoDataExists {
				// Both exist, copy old to new then drop old
				log.Println("Both logo_path and logo_data exist. Copying data from logo_path to logo_data...")
				initializers.DB.Exec(`UPDATE printer_headers SET logo_data = logo_path WHERE logo_data IS NULL`)
				initializers.DB.Exec(`ALTER TABLE printer_headers DROP COLUMN logo_path`)
			} else {
				// Only old exists, rename it
				log.Println("Renaming logo_path to logo_data...")
				initializers.DB.Exec(`ALTER TABLE printer_headers RENAME COLUMN logo_path TO logo_data`)
			}
		}
	}

	// Post-migration cleanup: drop typo column if it still exists
	var typoStillExists bool
	initializers.DB.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'quotation_tables' AND column_name = 'qutation_scp_count'
		)
	`).Scan(&typoStillExists)

	if typoStillExists {
		log.Println("Dropping typo column qutation_scp_count from quotation_tables...")
		initializers.DB.Exec(`ALTER TABLE quotation_tables DROP COLUMN IF EXISTS qutation_scp_count`)
	}

	// Ensure quotation_table_items.product_id is nullable (allow service/non-stock items)
	var quotationItemsTableExists bool
	initializers.DB.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables 
			WHERE table_name = 'quotation_table_items'
		)
	`).Scan(&quotationItemsTableExists)

	if quotationItemsTableExists {
		var productColExists bool
		initializers.DB.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'quotation_table_items' AND column_name = 'product_id'
			)
		`).Scan(&productColExists)

		if productColExists {
			var isNullable string
			initializers.DB.Raw(`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'quotation_table_items' AND column_name = 'product_id'`).Scan(&isNullable)
			if isNullable == "NO" {
				log.Println("Making product_id nullable in quotation_table_items...")
				initializers.DB.Exec(`ALTER TABLE quotation_table_items ALTER COLUMN product_id DROP NOT NULL`)
			}
		}

		// Add is_service column if missing (default false)
		var isServiceColExists bool
		initializers.DB.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'quotation_table_items' AND column_name = 'is_service'
			)
		`).Scan(&isServiceColExists)

		if !isServiceColExists {
			log.Println("Adding is_service column to quotation_table_items...")
			initializers.DB.Exec(`ALTER TABLE quotation_table_items ADD COLUMN is_service boolean DEFAULT false`)
			initializers.DB.Exec(`ALTER TABLE quotation_table_items ALTER COLUMN is_service SET NOT NULL`)
		}
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
	// initializers.DB.Exec(`
	// 	ALTER TABLE IF EXISTS employee_user_relations DROP CONSTRAINT IF EXISTS employee_user_relations_employee_id_fkey;
	// `)
	// initializers.DB.Exec(`
	// 	DO $$ BEGIN
	// 		ALTER TABLE employee_user_relations
	// 		ADD CONSTRAINT employee_user_relations_employee_id_fkey
	// 		FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE;
	// 	EXCEPTION WHEN duplicate_object THEN NULL; END $$;
	// `)

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
	// initializers.DB.Exec(`
	// 	CREATE INDEX IF NOT EXISTS idx_employee_user_relations_user_id ON employee_user_relations(user_id);
	// `)
	initializers.DB.Exec(`
		CREATE INDEX IF NOT EXISTS idx_departments_head_id ON departments(head_id);
	`)
}
