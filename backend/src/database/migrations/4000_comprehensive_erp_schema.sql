-- ============================================================================
-- COMPREHENSIVE ERP DATABASE SCHEMA - ORACLE/SAP STANDARDS
-- Migration: 4000_comprehensive_erp_schema.sql
-- Date: August 12, 2026
-- Standards: Oracle E-Business Suite / SAP S/4HANA
-- ============================================================================

-- ============================================================================
-- FINANCIAL ACCOUNTING (FI) / GENERAL LEDGER (GL) TABLES
-- ============================================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS erp_chart_of_accounts (
  chart_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  fiscal_year_variant VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- General Ledger Accounts
CREATE TABLE IF NOT EXISTS erp_gl_accounts (
  account_code VARCHAR(20) PRIMARY KEY,
  account_name VARCHAR(200) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  chart_id VARCHAR(50) NOT NULL REFERENCES erp_chart_of_accounts(chart_id),
  description TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  posting_blocked BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Headers
CREATE TABLE IF NOT EXISTS erp_journal_headers (
  journal_id VARCHAR(50) PRIMARY KEY,
  document_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  reference VARCHAR(100),
  document_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'created',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Lines
CREATE TABLE IF NOT EXISTS erp_journal_lines (
  id SERIAL PRIMARY KEY,
  journal_id VARCHAR(50) NOT NULL REFERENCES erp_journal_headers(journal_id),
  line_number INTEGER NOT NULL,
  account_code VARCHAR(20) NOT NULL REFERENCES erp_gl_accounts(account_code),
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  cost_center VARCHAR(20),
  profit_center VARCHAR(20),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONTROLLING (CO) TABLES
-- ============================================================================

-- Cost Centers
CREATE TABLE IF NOT EXISTS erp_cost_centers (
  cost_center_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  profit_center_code VARCHAR(20),
  person_responsible VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profit Centers
CREATE TABLE IF NOT EXISTS erp_profit_centers (
  profit_center_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  hierarchy_level INTEGER,
  parent_profit_center VARCHAR(20),
  person_responsible VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost Allocations
CREATE TABLE IF NOT EXISTS erp_cost_allocations (
  allocation_id VARCHAR(50) PRIMARY KEY,
  from_cost_center VARCHAR(20) NOT NULL REFERENCES erp_cost_centers(cost_center_code),
  to_cost_center VARCHAR(20) NOT NULL REFERENCES erp_cost_centers(cost_center_code),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  allocation_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'posted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MATERIALS MANAGEMENT (MM) TABLES
-- ============================================================================

-- Material Master
CREATE TABLE IF NOT EXISTS erp_material_master (
  material_code VARCHAR(20) PRIMARY KEY,
  material_type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  base_unit VARCHAR(10) NOT NULL,
  material_group VARCHAR(20),
  weight DECIMAL(10,2),
  weight_unit VARCHAR(10),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders Header
CREATE TABLE IF NOT EXISTS erp_purchase_orders (
  po_number VARCHAR(50) PRIMARY KEY,
  vendor_code VARCHAR(20) NOT NULL,
  purchase_org VARCHAR(20),
  purchase_group VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'USD',
  document_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS erp_po_items (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL REFERENCES erp_purchase_orders(po_number),
  item_number INTEGER NOT NULL,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipts Header
CREATE TABLE IF NOT EXISTS erp_goods_receipts (
  gr_number VARCHAR(50) PRIMARY KEY,
  po_number VARCHAR(50) REFERENCES erp_purchase_orders(po_number),
  movement_type VARCHAR(10),
  posting_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'posted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipt Items
CREATE TABLE IF NOT EXISTS erp_gr_items (
  id SERIAL PRIMARY KEY,
  gr_number VARCHAR(50) NOT NULL REFERENCES erp_goods_receipts(gr_number),
  item_number INTEGER NOT NULL,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  storage_location VARCHAR(20),
  batch VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory
CREATE TABLE IF NOT EXISTS erp_inventory (
  id SERIAL PRIMARY KEY,
  material_code VARCHAR(20) NOT NULL REFERENCES erp_material_master(material_code),
  storage_location VARCHAR(20),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  batch VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(material_code, storage_location, batch)
);

-- ============================================================================
-- SALES AND DISTRIBUTION (SD) TABLES
-- ============================================================================

-- Customers
CREATE TABLE IF NOT EXISTS erp_customers (
  customer_code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_terms VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders Header
CREATE TABLE IF NOT EXISTS erp_sales_orders (
  so_number VARCHAR(50) PRIMARY KEY,
  customer_code VARCHAR(20) NOT NULL REFERENCES erp_customers(customer_code),
  sales_org VARCHAR(20),
  distribution_channel VARCHAR(20),
  division VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'USD',
  document_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Order Items
CREATE TABLE IF NOT EXISTS erp_so_items (
  id SERIAL PRIMARY KEY,
  so_number VARCHAR(50) NOT NULL REFERENCES erp_sales_orders(so_number),
  item_number INTEGER NOT NULL,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries Header
CREATE TABLE IF NOT EXISTS erp_deliveries (
  delivery_number VARCHAR(50) PRIMARY KEY,
  so_number VARCHAR(50) REFERENCES erp_sales_orders(so_number),
  shipping_point VARCHAR(20),
  loading_date DATE,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Items
CREATE TABLE IF NOT EXISTS erp_delivery_items (
  id SERIAL PRIMARY KEY,
  delivery_number VARCHAR(50) NOT NULL REFERENCES erp_deliveries(delivery_number),
  item_number INTEGER NOT NULL,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  batch VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Header
CREATE TABLE IF NOT EXISTS erp_invoices (
  invoice_number VARCHAR(50) PRIMARY KEY,
  so_number VARCHAR(50) REFERENCES erp_sales_orders(so_number),
  delivery_number VARCHAR(50) REFERENCES erp_deliveries(delivery_number),
  customer_code VARCHAR(20) REFERENCES erp_customers(customer_code),
  currency VARCHAR(3) DEFAULT 'USD',
  document_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS erp_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL REFERENCES erp_invoices(invoice_number),
  item_number INTEGER NOT NULL,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  tax_code VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCTION PLANNING (PP) TABLES
-- ============================================================================

-- Production Orders
CREATE TABLE IF NOT EXISTS erp_production_orders (
  production_order VARCHAR(50) PRIMARY KEY,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  production_quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  planned_start_date DATE,
  planned_finish_date DATE,
  production_plant VARCHAR(20),
  status VARCHAR(20) DEFAULT 'created',
  actual_quantity DECIMAL(15,2),
  actual_start_date DATE,
  actual_finish_date DATE,
  confirmation_text TEXT,
  released_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUALITY MANAGEMENT (QM) TABLES
-- ============================================================================

-- Inspection Lots
CREATE TABLE IF NOT EXISTS erp_inspection_lots (
  inspection_lot VARCHAR(50) PRIMARY KEY,
  material_code VARCHAR(20) REFERENCES erp_material_master(material_code),
  inspection_type VARCHAR(20),
  origin VARCHAR(50),
  quantity DECIMAL(15,2),
  unit VARCHAR(10),
  lot_status VARCHAR(20) DEFAULT 'created',
  decision_code VARCHAR(20),
  decision_text TEXT,
  inspector VARCHAR(100),
  decision_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inspection Results
CREATE TABLE IF NOT EXISTS erp_inspection_results (
  id SERIAL PRIMARY KEY,
  inspection_lot VARCHAR(50) NOT NULL REFERENCES erp_inspection_lots(inspection_lot),
  characteristic_code VARCHAR(50) NOT NULL,
  actual_value DECIMAL(15,2),
  unit VARCHAR(10),
  inspector VARCHAR(100),
  inspection_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PLANT MAINTENANCE (PM) TABLES
-- ============================================================================

-- Equipment
CREATE TABLE IF NOT EXISTS erp_equipment (
  equipment_code VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL,
  equipment_category VARCHAR(20),
  plant VARCHAR(20),
  location VARCHAR(100),
  serial_number VARCHAR(50),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Orders
CREATE TABLE IF NOT EXISTS erp_maintenance_orders (
  maintenance_order VARCHAR(50) PRIMARY KEY,
  equipment_code VARCHAR(50) REFERENCES erp_equipment(equipment_code),
  order_type VARCHAR(20),
  description TEXT,
  planned_start_date DATE,
  planned_finish_date DATE,
  plant VARCHAR(20),
  work_center VARCHAR(20),
  status VARCHAR(20) DEFAULT 'created',
  actual_finish_date DATE,
  actual_work_hours DECIMAL(10,2),
  confirmation_text TEXT,
  technician VARCHAR(100),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HUMAN RESOURCES (HR) TABLES
-- ============================================================================

-- Employees
CREATE TABLE IF NOT EXISTS erp_employees (
  employee_code VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(50),
  email VARCHAR(200),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizational Units
CREATE TABLE IF NOT EXISTS erp_org_units (
  org_unit_code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_org_unit VARCHAR(50),
  org_level INTEGER,
  person_responsible VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS erp_payroll_runs (
  payroll_run VARCHAR(50) PRIMARY KEY,
  period INTEGER NOT NULL,
  year INTEGER NOT NULL,
  processing_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'processed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Items
CREATE TABLE IF NOT EXISTS erp_payroll_items (
  id SERIAL PRIMARY KEY,
  payroll_run VARCHAR(50) NOT NULL REFERENCES erp_payroll_runs(payroll_run),
  employee_code VARCHAR(20) NOT NULL REFERENCES erp_employees(employee_code),
  gross_pay DECIMAL(15,2) NOT NULL,
  deductions DECIMAL(15,2) NOT NULL,
  net_pay DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROJECT SYSTEM (PS) TABLES
-- ============================================================================

-- Projects
CREATE TABLE IF NOT EXISTS erp_projects (
  project_code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_manager VARCHAR(100),
  project_type VARCHAR(20),
  start_date DATE,
  finish_date DATE,
  actual_finish_date DATE,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'created',
  completion_percentage DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WBS Elements
CREATE TABLE IF NOT EXISTS erp_wbs_elements (
  wbs_code VARCHAR(50) PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL REFERENCES erp_projects(project_code),
  description TEXT,
  parent_wbs VARCHAR(50),
  responsible_person VARCHAR(100),
  budget DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TREASURY (TR) TABLES
-- ============================================================================

-- Bank Accounts
CREATE TABLE IF NOT EXISTS erp_bank_accounts (
  bank_account_code VARCHAR(50) PRIMARY KEY,
  bank_name VARCHAR(200) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  account_type VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cash Flows
CREATE TABLE IF NOT EXISTS erp_cash_flows (
  cash_flow_id VARCHAR(50) PRIMARY KEY,
  bank_account_code VARCHAR(50) NOT NULL REFERENCES erp_bank_accounts(bank_account_code),
  flow_type VARCHAR(20) NOT NULL CHECK (flow_type IN ('inflow', 'outflow')),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  reference VARCHAR(100),
  flow_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSET MANAGEMENT (AM) TABLES
-- ============================================================================

-- Fixed Assets
CREATE TABLE IF NOT EXISTS erp_fixed_assets (
  asset_code VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL,
  asset_class VARCHAR(20),
  acquisition_date DATE,
  cost DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  depreciation_method VARCHAR(20),
  useful_life INTEGER,
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depreciation
CREATE TABLE IF NOT EXISTS erp_depreciation (
  id SERIAL PRIMARY KEY,
  asset_code VARCHAR(50) NOT NULL REFERENCES erp_fixed_assets(asset_code),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  depreciation_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- General Ledger Indexes
CREATE INDEX IF NOT EXISTS idx_journal_headers_date ON erp_journal_headers(posting_date);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON erp_journal_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_journal_lines_cost_center ON erp_journal_lines(cost_center);
CREATE INDEX IF NOT EXISTS idx_journal_lines_profit_center ON erp_journal_lines(profit_center);

-- Materials Management Indexes
CREATE INDEX IF NOT EXISTS idx_po_vendor ON erp_purchase_orders(vendor_code);
CREATE INDEX IF NOT EXISTS idx_po_items_material ON erp_po_items(material_code);
CREATE INDEX IF NOT EXISTS idx_inventory_material ON erp_inventory(material_code);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON erp_inventory(storage_location);

-- Sales and Distribution Indexes
CREATE INDEX IF NOT EXISTS idx_so_customer ON erp_sales_orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_so_items_material ON erp_so_items(material_code);
CREATE INDEX IF NOT EXISTS idx_invoice_customer ON erp_invoices(customer_code);

-- Production Planning Indexes
CREATE INDEX IF NOT EXISTS idx_production_orders_material ON erp_production_orders(material_code);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON erp_production_orders(status);

-- Quality Management Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_lots_material ON erp_inspection_lots(material_code);
CREATE INDEX IF NOT EXISTS idx_inspection_lots_status ON erp_inspection_lots(lot_status);

-- Plant Maintenance Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_equipment ON erp_maintenance_orders(equipment_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_orders_status ON erp_maintenance_orders(status);

-- Human Resources Indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON erp_employees(status);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON erp_payroll_items(employee_code);

-- Project System Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON erp_projects(status);
CREATE INDEX IF NOT EXISTS idx_wbs_elements_project ON erp_wbs_elements(project_code);

-- Treasury Indexes
CREATE INDEX IF NOT EXISTS idx_cash_flows_account ON erp_cash_flows(bank_account_code);
CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON erp_cash_flows(flow_date);

-- Asset Management Indexes
CREATE INDEX IF NOT EXISTS idx_fixed_assets_class ON erp_fixed_assets(asset_class);
CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON erp_depreciation(asset_code);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE erp_chart_of_accounts IS 'Chart of Accounts - Master record for accounting structure';
COMMENT ON TABLE erp_gl_accounts IS 'General Ledger Accounts - Account master data';
COMMENT ON TABLE erp_journal_headers IS 'Journal Headers - Journal entry headers';
COMMENT ON TABLE erp_journal_lines IS 'Journal Lines - Journal entry line items';
COMMENT ON TABLE erp_cost_centers IS 'Cost Centers - Internal cost accounting units';
COMMENT ON TABLE erp_profit_centers IS 'Profit Centers - Internal profit accounting units';
COMMENT ON TABLE erp_cost_allocations IS 'Cost Allocations - Cost allocation transactions';
COMMENT ON TABLE erp_material_master IS 'Material Master - Product/material master data';
COMMENT ON TABLE erp_purchase_orders IS 'Purchase Orders - Purchase order headers';
COMMENT ON TABLE erp_po_items IS 'Purchase Order Items - Purchase order line items';
COMMENT ON TABLE erp_goods_receipts IS 'Goods Receipts - Goods receipt headers';
COMMENT ON TABLE erp_gr_items IS 'Goods Receipt Items - Goods receipt line items';
COMMENT ON TABLE erp_inventory IS 'Inventory - Current inventory levels';
COMMENT ON TABLE erp_customers IS 'Customers - Customer master data';
COMMENT ON TABLE erp_sales_orders IS 'Sales Orders - Sales order headers';
COMMENT ON TABLE erp_so_items IS 'Sales Order Items - Sales order line items';
COMMENT ON TABLE erp_deliveries IS 'Deliveries - Delivery headers';
COMMENT ON TABLE erp_delivery_items IS 'Delivery Items - Delivery line items';
COMMENT ON TABLE erp_invoices IS 'Invoices - Invoice headers';
COMMENT ON TABLE erp_invoice_items IS 'Invoice Items - Invoice line items';
COMMENT ON TABLE erp_production_orders IS 'Production Orders - Production order management';
COMMENT ON TABLE erp_inspection_lots IS 'Inspection Lots - Quality inspection lots';
COMMENT ON TABLE erp_inspection_results IS 'Inspection Results - Quality inspection results';
COMMENT ON TABLE erp_equipment IS 'Equipment - Equipment master data';
COMMENT ON TABLE erp_maintenance_orders IS 'Maintenance Orders - Maintenance order management';
COMMENT ON TABLE erp_employees IS 'Employees - Employee master data';
COMMENT ON TABLE erp_org_units IS 'Organizational Units - Org structure';
COMMENT ON TABLE erp_payroll_runs IS 'Payroll Runs - Payroll processing runs';
COMMENT ON TABLE erp_payroll_items IS 'Payroll Items - Payroll line items';
COMMENT ON TABLE erp_projects IS 'Projects - Project master data';
COMMENT ON TABLE erp_wbs_elements IS 'WBS Elements - Work breakdown structure';
COMMENT ON TABLE erp_bank_accounts IS 'Bank Accounts - Bank account master data';
COMMENT ON TABLE erp_cash_flows IS 'Cash Flows - Cash flow transactions';
COMMENT ON TABLE erp_fixed_assets IS 'Fixed Assets - Fixed asset master data';
COMMENT ON TABLE erp_depreciation IS 'Depreciation - Asset depreciation records';
