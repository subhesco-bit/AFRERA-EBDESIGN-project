-- AFRERA Engineering Platform Database Schema
-- This file contains all database extensions for the AI Engineering, Design & Digital Twin Platform

-- ============================================================================
-- ENGINEERING PROJECTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engineering_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
  
  -- Project Classification
  project_type VARCHAR(100) NOT NULL, -- greenhouse, cold_storage, dairy, solar, water, etc.
  project_subtype VARCHAR(100), -- polyhouse, blast_freezer, dairy_plant, rooftop, irrigation, etc.
  industry_sector VARCHAR(50), -- agriculture, fisheries, food_processing, dairy, etc.
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location JSONB NOT NULL, -- {address, latitude, longitude, pincode, state, district}
  
  -- Project Specifications
  capacity DECIMAL, -- capacity in relevant units (sqm, tons, liters, etc.)
  capacity_unit VARCHAR(20), -- sqm, tons, liters, kwp, etc.
  budget DECIMAL,
  currency VARCHAR(10) DEFAULT 'INR',
  timeline INTEGER, -- in months
  
  -- Project Status
  status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, design, analysis, approval, construction, operation, completed
  phase VARCHAR(50), -- requirement, survey, design, analysis, cost, dpr, tender, construction, operation
  phase_progress INTEGER DEFAULT 0, -- 0-100 percentage
  
  -- Team & Permissions
  team_members JSONB, -- [{user_id, role, permissions}]
  permissions JSONB, -- role-based permissions
  
  -- Metadata
  tags TEXT[],
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes for engineering_projects
CREATE INDEX idx_engineering_projects_user ON engineering_projects(user_id);
CREATE INDEX idx_engineering_projects_fpo ON engineering_projects(fpo_id);
CREATE INDEX idx_engineering_projects_status ON engineering_projects(status);
CREATE INDEX idx_engineering_projects_type ON engineering_projects(project_type);
CREATE INDEX idx_engineering_projects_phase ON engineering_projects(phase);
CREATE INDEX idx_engineering_projects_location ON engineering_projects USING GIN(location);
CREATE INDEX idx_engineering_projects_tags ON engineering_projects USING GIN(tags);
CREATE INDEX idx_engineering_projects_created_at ON engineering_projects(created_at DESC);

-- ============================================================================
-- DESIGN DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS design_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Document Information
  document_type VARCHAR(100) NOT NULL, -- layout, structural, architectural, mep, etc.
  document_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) DEFAULT '1.0',
  description TEXT,
  
  -- File Information
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_format VARCHAR(20), -- dwg, pdf, ifc, rvt, etc.
  file_hash VARCHAR(64), -- SHA-256 hash for integrity
  
  -- Design Metadata
  metadata JSONB, -- {author, software, date, etc.}
  design_parameters JSONB, -- input parameters used for generation
  design_results JSONB, -- output results from AI generation
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, rejected
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Indexes for design_documents
CREATE INDEX idx_design_documents_project ON design_documents(project_id);
CREATE INDEX idx_design_documents_type ON design_documents(document_type);
CREATE INDEX idx_design_documents_status ON design_documents(status);
CREATE INDEX idx_design_documents_version ON design_documents(version);
CREATE INDEX idx_design_documents_created_at ON design_documents(created_at DESC);

-- ============================================================================
-- AI ANALYSIS RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  design_id UUID REFERENCES design_documents(id) ON DELETE SET NULL,
  
  -- Analysis Information
  analysis_type VARCHAR(100) NOT NULL, -- structural, thermal, cfd, solar, water, agriculture, financial, compliance
  analysis_subtype VARCHAR(100), -- beam_optimization, heat_transfer, airflow, etc.
  analysis_version VARCHAR(50),
  
  -- Input/Output
  input_parameters JSONB NOT NULL,
  output_results JSONB NOT NULL,
  confidence_score DECIMAL, -- 0-1
  accuracy_score DECIMAL, -- 0-1
  
  -- Processing Information
  processing_time INTEGER, -- in seconds
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  
  -- Metadata
  ai_model_used VARCHAR(100),
  model_version VARCHAR(50),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for ai_analysis_results
CREATE INDEX idx_ai_analysis_project ON ai_analysis_results(project_id);
CREATE INDEX idx_ai_analysis_design ON ai_analysis_results(design_id);
CREATE INDEX idx_ai_analysis_type ON ai_analysis_results(analysis_type);
CREATE INDEX idx_ai_analysis_status ON ai_analysis_results(processing_status);
CREATE INDEX idx_ai_analysis_created_at ON ai_analysis_results(created_at DESC);

-- ============================================================================
-- BOQ ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  boq_id UUID NOT NULL, -- Reference to BOQ document
  
  -- Item Classification
  category VARCHAR(100) NOT NULL, -- civil, structural, electrical, mechanical, automation
  subcategory VARCHAR(100),
  item_code VARCHAR(50),
  
  -- Item Details
  description TEXT NOT NULL,
  specifications JSONB, -- detailed specifications
  brand VARCHAR(100),
  model VARCHAR(100),
  
  -- Quantity & Pricing
  unit VARCHAR(20) NOT NULL, -- nos, sqm, cum, kg, etc.
  quantity DECIMAL NOT NULL,
  unit_rate DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  
  -- Sourcing
  source_type VARCHAR(50), -- marketplace, vendor, custom
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  marketplace_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for boq_items
CREATE INDEX idx_boq_items_project ON boq_items(project_id);
CREATE INDEX idx_boq_items_boq ON boq_items(boq_id);
CREATE INDEX idx_boq_items_category ON boq_items(category);
CREATE INDEX idx_boq_items_vendor ON boq_items(vendor_id);

-- ============================================================================
-- COST ESTIMATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Estimate Information
  estimate_type VARCHAR(100) NOT NULL, -- preliminary, detailed, final
  version VARCHAR(50) DEFAULT '1.0',
  region VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Cost Breakdown
  total_capex DECIMAL NOT NULL,
  total_opex DECIMAL NOT NULL,
  breakdown JSONB NOT NULL, -- {civil: {}, structural: {}, electrical: {}, etc.}
  
  -- Assumptions & Factors
  assumptions JSONB, -- material prices, labor rates, etc.
  contingency_percentage DECIMAL DEFAULT 10,
  contingency_amount DECIMAL,
  inflation_factor DECIMAL DEFAULT 1.0,
  
  -- Comparison
  previous_estimate_id UUID REFERENCES cost_estimates(id) ON DELETE SET NULL,
  variance_percentage DECIMAL,
  variance_reason TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cost_estimates
CREATE INDEX idx_cost_estimates_project ON cost_estimates(project_id);
CREATE INDEX idx_cost_estimates_type ON cost_estimates(estimate_type);
CREATE INDEX idx_cost_estimates_version ON cost_estimates(version);
CREATE INDEX idx_cost_estimates_created_at ON cost_estimates(created_at DESC);

-- ============================================================================
-- MATERIAL PRICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Material Information
  material_code VARCHAR(50) UNIQUE NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  grade VARCHAR(50),
  
  -- Pricing
  unit VARCHAR(20) NOT NULL,
  base_price DECIMAL NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Regional Variations
  regional_prices JSONB, -- {assam: 100, maharashtra: 120, etc.}
  
  -- Market Factors
  supplier VARCHAR(100),
  availability VARCHAR(50), -- available, limited, out_of_stock
  lead_time INTEGER, -- in days
  
  -- Historical Data
  price_history JSONB, -- [{date, price, region}]
  
  -- Metadata
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for material_prices
CREATE INDEX idx_material_prices_code ON material_prices(material_code);
CREATE INDEX idx_material_prices_category ON material_prices(category);
CREATE INDEX idx_material_prices_validity ON material_prices(valid_from, valid_until);

-- ============================================================================
-- LABOR RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Labor Classification
  labor_type VARCHAR(100) NOT NULL, -- skilled, semi-skilled, unskilled
  skill_category VARCHAR(100) NOT NULL, -- mason, carpenter, electrician, etc.
  
  -- Regional Rates
  region VARCHAR(100) NOT NULL,
  daily_rate DECIMAL NOT NULL,
  hourly_rate DECIMAL NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Factors
  productivity_factor DECIMAL DEFAULT 1.0,
  overtime_multiplier DECIMAL DEFAULT 1.5,
  
  -- Metadata
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for labor_rates
CREATE INDEX idx_labor_rates_type ON labor_rates(labor_type);
CREATE INDEX idx_labor_rates_category ON labor_rates(skill_category);
CREATE INDEX idx_labor_rates_region ON labor_rates(region);
CREATE INDEX idx_labor_rates_validity ON labor_rates(valid_from, valid_until);

-- ============================================================================
-- EQUIPMENT RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Equipment Information
  equipment_code VARCHAR(50) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  
  -- Rental Rates
  daily_rate DECIMAL NOT NULL,
  weekly_rate DECIMAL,
  monthly_rate DECIMAL NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  
  -- Regional Variations
  regional_rates JSONB, -- {assam: {daily: 1000}, maharashtra: {daily: 1200}}
  
  -- Availability
  availability VARCHAR(50),
  lead_time INTEGER, -- in days
  
  -- Metadata
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for equipment_rates
CREATE INDEX idx_equipment_rates_code ON equipment_rates(equipment_code);
CREATE INDEX idx_equipment_rates_category ON equipment_rates(category);
CREATE INDEX idx_equipment_rates_validity ON equipment_rates(valid_from, valid_until);

-- ============================================================================
-- PROJECT SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Schedule Information
  schedule_type VARCHAR(50) DEFAULT 'cpm', -- cpm, pert, gantt
  version VARCHAR(50) DEFAULT '1.0',
  
  -- Schedule Data
  activities JSONB NOT NULL, -- [{id, name, duration, predecessors, resources}]
  milestones JSONB, -- [{id, name, date, status}]
  critical_path JSONB, -- [activity_ids]
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_duration INTEGER, -- in days
  
  -- Resources
  resources JSONB, -- {labor: [], equipment: [], materials: []}
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for project_schedules
CREATE INDEX idx_project_schedules_project ON project_schedules(project_id);
CREATE INDEX idx_project_schedules_type ON project_schedules(schedule_type);
CREATE INDEX idx_project_schedules_version ON project_schedules(version);

-- ============================================================================
-- SCHEDULE ACTIVITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedule_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES project_schedules(id) ON DELETE CASCADE,
  
  -- Activity Information
  activity_code VARCHAR(50) NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50), -- task, milestone, summary
  
  -- Duration
  duration INTEGER NOT NULL, -- in days
  start_date DATE,
  end_date DATE,
  
  -- Dependencies
  predecessors JSONB, -- [activity_ids]
  successors JSONB, -- [activity_ids]
  
  -- Resources
  resources JSONB, -- {labor: [], equipment: []}
  cost DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed, delayed
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Critical Path
  is_critical BOOLEAN DEFAULT false,
  float INTEGER DEFAULT 0, -- slack time in days
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for schedule_activities
CREATE INDEX idx_schedule_activities_schedule ON schedule_activities(schedule_id);
CREATE INDEX idx_schedule_activities_status ON schedule_activities(status);
CREATE INDEX idx_schedule_activities_critical ON schedule_activities(is_critical);

-- ============================================================================
-- BIM MODELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  design_id UUID REFERENCES design_documents(id) ON DELETE SET NULL,
  
  -- Model Information
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(50), -- architectural, structural, mep, coordination
  lod_level INTEGER NOT NULL, -- 100, 200, 300, 400, 500
  
  -- File Information
  file_url TEXT NOT NULL,
  file_format VARCHAR(20), -- ifc, rvt, skp, etc.
  file_size BIGINT,
  
  -- Model Metadata
  software VARCHAR(100), -- Revit, ArchiCAD, Tekla, etc.
  software_version VARCHAR(50),
  author VARCHAR(100),
  
  -- Model Statistics
  elements_count INTEGER,
  surfaces_count INTEGER,
  volume DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, published
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for bim_models
CREATE INDEX idx_bim_models_project ON bim_models(project_id);
CREATE INDEX idx_bim_models_design ON bim_models(design_id);
CREATE INDEX idx_bim_models_type ON bim_models(model_type);
CREATE INDEX idx_bim_models_lod ON bim_models(lod_level);
CREATE INDEX idx_bim_models_status ON bim_models(status);

-- ============================================================================
-- CAD FILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cad_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  design_id UUID REFERENCES design_documents(id) ON DELETE SET NULL,
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  drawing_type VARCHAR(100) NOT NULL, -- architectural, structural, mep, layout
  drawing_number VARCHAR(50),
  
  -- File Details
  file_url TEXT NOT NULL,
  file_format VARCHAR(20) NOT NULL, -- dwg, dxf, pdf, etc.
  file_size BIGINT,
  
  -- Drawing Metadata
  scale VARCHAR(20),
  sheet_size VARCHAR(20), -- A1, A2, A3, A4
  layers JSONB, -- [{name, color, line_type}]
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, issued
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cad_files
CREATE INDEX idx_cad_files_project ON cad_files(project_id);
CREATE INDEX idx_cad_files_design ON cad_files(design_id);
CREATE INDEX idx_cad_files_type ON cad_files(drawing_type);
CREATE INDEX idx_cad_files_status ON cad_files(status);

-- ============================================================================
-- DIGITAL TWIN SENSORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS digital_twin_sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Sensor Information
  sensor_id VARCHAR(100) UNIQUE NOT NULL,
  sensor_name VARCHAR(255) NOT NULL,
  sensor_type VARCHAR(100) NOT NULL, -- temperature, humidity, co2, energy, flow, etc.
  sensor_category VARCHAR(50), -- environmental, energy, structural, operational
  
  -- Location
  location JSONB NOT NULL, -- {zone, position, coordinates}
  installation_date DATE,
  
  -- Specifications
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  specifications JSONB, -- {range, accuracy, resolution}
  
  -- Configuration
  sampling_interval INTEGER, -- in seconds
  alert_thresholds JSONB, -- {min, max, critical}
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance, failed
  last_calibration DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for digital_twin_sensors
CREATE INDEX idx_digital_twin_sensors_project ON digital_twin_sensors(project_id);
CREATE INDEX idx_digital_twin_sensors_id ON digital_twin_sensors(sensor_id);
CREATE INDEX idx_digital_twin_sensors_type ON digital_twin_sensors(sensor_type);
CREATE INDEX idx_digital_twin_sensors_status ON digital_twin_sensors(status);

-- ============================================================================
-- DIGITAL TWIN DATA (Time-Series)
-- ============================================================================

CREATE TABLE IF NOT EXISTS digital_twin_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  sensor_id VARCHAR(100) NOT NULL,
  
  -- Reading
  reading_value DECIMAL NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quality VARCHAR(20) DEFAULT 'good', -- good, uncertain, bad
  
  -- Timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  metadata JSONB
);

-- Indexes for digital_twin_data
CREATE INDEX idx_digital_twin_data_project ON digital_twin_data(project_id);
CREATE INDEX idx_digital_twin_data_sensor ON digital_twin_data(sensor_id);
CREATE INDEX idx_digital_twin_data_timestamp ON digital_twin_data(timestamp DESC);
-- Composite index for efficient time-series queries
CREATE INDEX idx_digital_twin_data_sensor_time ON digital_twin_data(sensor_id, timestamp DESC);

-- Partitioning for large time-series data (to be implemented based on data volume)
-- CREATE TABLE IF NOT EXISTS digital_twin_data_y2024 PARTITION OF digital_twin_data
-- FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- ============================================================================
-- COMPLIANCE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Standard Information
  standard_code VARCHAR(50) NOT NULL,
  standard_name VARCHAR(255) NOT NULL,
  standard_category VARCHAR(100), -- building, structural, electrical, fire, environmental
  
  -- Compliance Status
  compliance_status VARCHAR(50) NOT NULL, -- compliant, non_compliant, partial, pending
  compliance_score DECIMAL, -- 0-100
  
  -- Gap Analysis
  gap_analysis JSONB, -- [{requirement, status, gap, recommendation}]
  required_actions TEXT,
  
  -- Verification
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  -- Documents
  compliance_documents JSONB, -- [{document_id, document_name, url}]
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for compliance_records
CREATE INDEX idx_compliance_records_project ON compliance_records(project_id);
CREATE INDEX idx_compliance_records_code ON compliance_records(standard_code);
CREATE INDEX idx_compliance_records_status ON compliance_records(compliance_status);
CREATE INDEX idx_compliance_records_category ON compliance_records(standard_category);

-- ============================================================================
-- DPR DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- DPR Information
  dpr_type VARCHAR(50) NOT NULL, -- bank, government, investor, internal
  dpr_purpose VARCHAR(100), -- loan, subsidy, grant, approval
  
  -- Document Details
  document_name VARCHAR(255) NOT NULL,
  document_url TEXT NOT NULL,
  file_format VARCHAR(20) DEFAULT 'pdf',
  
  -- Financial Summary
  total_project_cost DECIMAL NOT NULL,
  subsidy_amount DECIMAL DEFAULT 0,
  loan_amount DECIMAL DEFAULT 0,
  own_contribution DECIMAL DEFAULT 0,
  
  -- Target Information
  target_institution VARCHAR(255), -- bank name, government department
  submission_status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for dpr_documents
CREATE INDEX idx_dpr_documents_project ON dpr_documents(project_id);
CREATE INDEX idx_dpr_documents_type ON dpr_documents(dpr_type);
CREATE INDEX idx_dpr_documents_status ON dpr_documents(submission_status);
CREATE INDEX idx_dpr_documents_created_at ON dpr_documents(created_at DESC);

-- ============================================================================
-- TENDER DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tender_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Tender Information
  tender_number VARCHAR(50) UNIQUE NOT NULL,
  tender_name VARCHAR(255) NOT NULL,
  tender_type VARCHAR(50), -- open, limited, global
  
  -- Tender Details
  work_description TEXT NOT NULL,
  estimated_cost DECIMAL NOT NULL,
  bid_security_amount DECIMAL,
  
  -- Timeline
  bid_submission_deadline TIMESTAMP NOT NULL,
  bid_opening_date TIMESTAMP NOT NULL,
  estimated_start_date DATE,
  estimated_completion_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed, awarded, cancelled
  published_at TIMESTAMP,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tender_documents
CREATE INDEX idx_tender_documents_project ON tender_documents(project_id);
CREATE INDEX idx_tender_documents_number ON tender_documents(tender_number);
CREATE INDEX idx_tender_documents_status ON tender_documents(status);
CREATE INDEX idx_tender_documents_deadline ON tender_documents(bid_submission_deadline);

-- ============================================================================
-- TENDER BIDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tender_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tender_documents(id) ON DELETE CASCADE,
  
  -- Bidder Information
  bidder_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bidder_name VARCHAR(255) NOT NULL,
  bidder_company VARCHAR(255),
  
  -- Bid Details
  bid_amount DECIMAL NOT NULL,
  bid_security_amount DECIMAL,
  technical_score DECIMAL,
  commercial_score DECIMAL,
  total_score DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, qualified, disqualified, awarded, rejected
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Evaluation
  evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  evaluated_at TIMESTAMP,
  evaluation_notes TEXT,
  
  -- Documents
  bid_documents JSONB, -- [{document_name, url}]
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tender_bids
CREATE INDEX idx_tender_bids_tender ON tender_bids(tender_id);
CREATE INDEX idx_tender_bids_bidder ON tender_bids(bidder_id);
CREATE INDEX idx_tender_bids_status ON tender_bids(status);
CREATE INDEX idx_tender_bids_score ON tender_bids(total_score DESC);

-- ============================================================================
-- CONSTRUCTION PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS construction_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  schedule_activity_id UUID REFERENCES schedule_activities(id) ON DELETE SET NULL,
  
  -- Progress Information
  report_date DATE NOT NULL,
  progress_percentage INTEGER NOT NULL, -- 0-100
  status VARCHAR(50) NOT NULL, -- on_track, delayed, ahead, completed
  
  -- Details
  work_completed TEXT,
  issues_encountered TEXT,
  mitigation_plan TEXT,
  
  -- Resources
  labor_on_site INTEGER,
  equipment_on_site JSONB, -- [{type, count}]
  materials_consumed JSONB, -- [{material, quantity}]
  
  -- Photos
  photo_urls JSONB, -- [url1, url2, ...]
  
  -- Metadata
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for construction_progress
CREATE INDEX idx_construction_progress_project ON construction_progress(project_id);
CREATE INDEX idx_construction_progress_activity ON construction_progress(schedule_activity_id);
CREATE INDEX idx_construction_progress_date ON construction_progress(report_date DESC);

-- ============================================================================
-- QUALITY CHECKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Check Information
  check_type VARCHAR(100) NOT NULL, -- material, workmanship, safety, documentation
  check_category VARCHAR(100),
  check_name VARCHAR(255) NOT NULL,
  
  -- Check Details
  check_date DATE NOT NULL,
  location JSONB,
  
  -- Results
  check_status VARCHAR(50) NOT NULL, -- pass, fail, conditional
  check_score DECIMAL,
  observations TEXT,
  
  -- Non-Conformance
  non_conformances JSONB, -- [{description, severity, action}]
  corrective_actions TEXT,
  
  -- Personnel
  inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for quality_checks
CREATE INDEX idx_quality_checks_project ON quality_checks(project_id);
CREATE INDEX idx_quality_checks_type ON quality_checks(check_type);
CREATE INDEX idx_quality_checks_status ON quality_checks(check_status);
CREATE INDEX idx_quality_checks_date ON quality_checks(check_date DESC);

-- ============================================================================
-- DRONE SURVEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS drone_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Survey Information
  survey_name VARCHAR(255) NOT NULL,
  survey_type VARCHAR(50) NOT NULL, -- topographic, progress, inspection
  flight_date DATE NOT NULL,
  
  -- Flight Details
  flight_plan JSONB, -- {waypoints, altitude, speed}
  drone_model VARCHAR(100),
  pilot_name VARCHAR(255),
  
  -- Data
  image_count INTEGER,
  coverage_area DECIMAL, -- in sqm
  ground_resolution DECIMAL, -- in cm/pixel
  
  -- Processing
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  orthophoto_url TEXT,
  dsm_url TEXT, -- Digital Surface Model
  dtm_url TEXT, -- Digital Terrain Model
  point_cloud_url TEXT,
  model_3d_url TEXT,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for drone_surveys
CREATE INDEX idx_drone_surveys_project ON drone_surveys(project_id);
CREATE INDEX idx_drone_surveys_type ON drone_surveys(survey_type);
CREATE INDEX idx_drone_surveys_date ON drone_surveys(flight_date DESC);
CREATE INDEX idx_drone_surveys_status ON drone_surveys(processing_status);

-- ============================================================================
-- FACILITY OPERATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS facility_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Operation Information
  operation_date DATE NOT NULL,
  operation_type VARCHAR(50) NOT NULL, -- production, maintenance, inspection, cleaning
  
  -- Details
  description TEXT,
  duration_hours DECIMAL,
  
  -- Performance
  output_quantity DECIMAL,
  quality_score DECIMAL,
  energy_consumption DECIMAL, -- in kWh
  water_consumption DECIMAL, -- in liters
  
  -- Issues
  issues_encountered TEXT,
  actions_taken TEXT,
  
  -- Personnel
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for facility_operations
CREATE INDEX idx_facility_operations_project ON facility_operations(project_id);
CREATE INDEX idx_facility_operations_type ON facility_operations(operation_type);
CREATE INDEX idx_facility_operations_date ON facility_operations(operation_date DESC);

-- ============================================================================
-- MAINTENANCE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES engineering_projects(id) ON DELETE CASCADE,
  
  -- Maintenance Information
  maintenance_type VARCHAR(50) NOT NULL, -- preventive, corrective, predictive
  equipment_id VARCHAR(100),
  equipment_name VARCHAR(255),
  
  -- Scheduling
  scheduled_date DATE,
  completed_date DATE,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Details
  description TEXT NOT NULL,
  work_performed TEXT,
  parts_used JSONB, -- [{part, quantity, cost}]
  labor_hours DECIMAL,
  cost DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  
  -- Personnel
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for maintenance_records
CREATE INDEX idx_maintenance_records_project ON maintenance_records(project_id);
CREATE INDEX idx_maintenance_records_type ON maintenance_records(maintenance_type);
CREATE INDEX idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_records_scheduled ON maintenance_records(scheduled_date);

-- ============================================================================
-- VENDORS (Engineering Specific)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Contact Information
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  
  -- Vendor Classification
  vendor_type VARCHAR(100) NOT NULL, -- material_supplier, equipment_supplier, contractor, consultant
  categories JSONB, -- [categories]
  
  -- Capabilities
  capabilities JSONB, -- {services, products, regions}
  
  -- Performance
  rating DECIMAL, -- 0-5
  total_orders INTEGER DEFAULT 0,
  total_value DECIMAL DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, blacklisted
  verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendors
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_type ON vendors(vendor_type);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);

-- ============================================================================
-- ENGINEERING AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS engineering_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action Information
  project_id UUID REFERENCES engineering_projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL, -- project, design, analysis, boq, etc.
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for engineering_audit_log
CREATE INDEX idx_engineering_audit_project ON engineering_audit_log(project_id);
CREATE INDEX idx_engineering_audit_user ON engineering_audit_log(user_id);
CREATE INDEX idx_engineering_audit_entity ON engineering_audit_log(entity_type, entity_id);
CREATE INDEX idx_engineering_audit_timestamp ON engineering_audit_log(timestamp DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_engineering_projects_updated_at BEFORE UPDATE ON engineering_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_documents_updated_at BEFORE UPDATE ON design_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boq_items_updated_at BEFORE UPDATE ON boq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_estimates_updated_at BEFORE UPDATE ON cost_estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_prices_updated_at BEFORE UPDATE ON material_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_labor_rates_updated_at BEFORE UPDATE ON labor_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_rates_updated_at BEFORE UPDATE ON equipment_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_schedules_updated_at BEFORE UPDATE ON project_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_activities_updated_at BEFORE UPDATE ON schedule_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bim_models_updated_at BEFORE UPDATE ON bim_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cad_files_updated_at BEFORE UPDATE ON cad_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_twin_sensors_updated_at BEFORE UPDATE ON digital_twin_sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON compliance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpr_documents_updated_at BEFORE UPDATE ON dpr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_documents_updated_at BEFORE UPDATE ON tender_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_bids_updated_at BEFORE UPDATE ON tender_bids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_checks_updated_at BEFORE UPDATE ON quality_checks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_surveys_updated_at BEFORE UPDATE ON drone_surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate project number
CREATE OR REPLACE FUNCTION generate_project_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part INTEGER;
    project_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM 12 FOR 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM engineering_projects
    WHERE project_number LIKE 'ENG-' || year_part || '-%';
    
    project_number := 'ENG-' || year_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    NEW.project_number := project_number;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger for project number generation
CREATE TRIGGER generate_project_number_trigger BEFORE INSERT ON engineering_projects
    FOR EACH ROW
    WHEN (NEW.project_number IS NULL)
    EXECUTE FUNCTION generate_project_number();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for project summary
CREATE OR REPLACE VIEW engineering_project_summary AS
SELECT 
    p.id,
    p.project_number,
    p.name,
    p.project_type,
    p.project_subtype,
    p.location,
    p.capacity,
    p.budget,
    p.status,
    p.phase,
    p.phase_progress,
    p.created_at,
    p.updated_at,
    u.name as user_name,
    u.email as user_email,
    f.name as fpo_name
FROM engineering_projects p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN fpos f ON p.fpo_id = f.id
WHERE p.deleted_at IS NULL;

-- View for project cost summary
CREATE OR REPLACE VIEW engineering_project_cost_summary AS
SELECT 
    p.id as project_id,
    p.project_number,
    p.name as project_name,
    c.total_capex,
    c.total_opex,
    c.contingency_amount,
    c.breakdown,
    c.created_at as cost_date
FROM engineering_projects p
LEFT JOIN cost_estimates c ON p.id = c.project_id
WHERE p.deleted_at IS NULL;

-- View for digital twin sensor summary
CREATE OR REPLACE VIEW digital_twin_sensor_summary AS
SELECT 
    s.id,
    s.sensor_id,
    s.sensor_name,
    s.sensor_type,
    s.sensor_category,
    s.location,
    s.status,
    p.project_number,
    p.name as project_name,
    MAX(d.timestamp) as last_reading_time,
    d.reading_value as last_reading_value,
    d.unit
FROM digital_twin_sensors s
JOIN engineering_projects p ON s.project_id = p.id
LEFT JOIN digital_twin_data d ON s.sensor_id = d.sensor_id
GROUP BY s.id, s.sensor_id, s.sensor_name, s.sensor_type, s.sensor_category, 
         s.location, s.status, p.project_number, p.name, d.reading_value, d.unit;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- This schema provides a comprehensive database structure for the AFRERA Engineering OS
-- It supports all the major modules including project management, design, analysis,
-- BOQ, cost estimation, scheduling, BIM/CAD, digital twin, compliance, DPR,
-- tender management, construction monitoring, and facility management.

-- The schema is designed with:
-- 1. Proper indexing for performance
-- 2. Foreign key relationships for data integrity
-- 3. JSONB columns for flexible data storage
-- 4. Audit logging for compliance
-- 5. Timestamps for tracking
-- 6. Soft deletes for data recovery
-- 7. Views for common queries
-- 8. Triggers for automated updates
