-- GST Service Database Schema
-- CAP-XXX: GST Calculation, GST Invoicing, GST Compliance

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GST RATES CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_rates (
    id SERIAL PRIMARY KEY,
    product_category VARCHAR(100) UNIQUE NOT NULL,
    gst_rate DECIMAL(5,2) NOT NULL,
    hsn_code VARCHAR(50),
    description TEXT,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_rates_category ON gst_rates(product_category);
CREATE INDEX idx_gst_rates_active ON gst_rates(is_active);
CREATE INDEX idx_gst_rates_hsn ON gst_rates(hsn_code);

-- ============================================================================
-- GST CALCULATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_calculations (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    total_gst DECIMAL(15,2) NOT NULL,
    cgst_amount DECIMAL(15,2),
    sgst_amount DECIMAL(15,2),
    igst_amount DECIMAL(15,2),
    gst_breakdown JSONB,
    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_calculations_order ON gst_calculations(order_id);
CREATE INDEX idx_gst_calculations_date ON gst_calculations(calculation_date);

-- ============================================================================
-- GST INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    invoice_type VARCHAR(50) DEFAULT 'tax_invoice',
    invoice_date DATE NOT NULL,
    due_date DATE,
    customer_name VARCHAR(255),
    customer_gst_number VARCHAR(50),
    customer_address TEXT,
    customer_state VARCHAR(100),
    customer_state_code VARCHAR(10),
    supplier_name VARCHAR(255),
    supplier_gst_number VARCHAR(50),
    supplier_address TEXT,
    supplier_state VARCHAR(100),
    supplier_state_code VARCHAR(10),
    supply_type VARCHAR(50),
    total_amount DECIMAL(15,2),
    total_gst DECIMAL(15,2),
    cgst_amount DECIMAL(15,2),
    sgst_amount DECIMAL(15,2),
    igst_amount DECIMAL(15,2),
    round_off_amount DECIMAL(15,2),
    grand_total DECIMAL(15,2),
    invoice_status VARCHAR(50) DEFAULT 'generated',
    payment_status VARCHAR(50) DEFAULT 'pending',
    generated_by INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_invoices_number ON gst_invoices(invoice_number);
CREATE INDEX idx_gst_invoices_order ON gst_invoices(order_id);
CREATE INDEX idx_gst_invoices_date ON gst_invoices(invoice_date);
CREATE INDEX idx_gst_invoices_status ON gst_invoices(invoice_status);
CREATE INDEX idx_gst_invoices_customer_gst ON gst_invoices(customer_gst_number);

-- ============================================================================
-- GST INVOICE ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES gst_invoices(id) ON DELETE CASCADE,
    order_item_id INTEGER,
    product_id INTEGER,
    product_name VARCHAR(255),
    hsn_code VARCHAR(50),
    product_category VARCHAR(100),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    unit_price DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    gst_rate DECIMAL(5,2),
    cgst_rate DECIMAL(5,2),
    sgst_rate DECIMAL(5,2),
    igst_rate DECIMAL(5,2),
    cgst_amount DECIMAL(15,2),
    sgst_amount DECIMAL(15,2),
    igst_amount DECIMAL(15,2),
    total_gst_amount DECIMAL(15,2),
    item_total DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_invoice_items_invoice ON gst_invoice_items(invoice_id);
CREATE INDEX idx_gst_invoice_items_product ON gst_invoice_items(product_id);

-- ============================================================================
-- GST RETURNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_returns (
    id SERIAL PRIMARY KEY,
    return_period VARCHAR(50) NOT NULL,
    return_type VARCHAR(50) NOT NULL,
    taxpayer_gst_number VARCHAR(50) NOT NULL,
    taxpayer_name VARCHAR(255),
    taxpayer_state VARCHAR(100),
    filing_date DATE,
    due_date DATE NOT NULL,
    return_status VARCHAR(50) DEFAULT 'pending',
    total_turnover DECIMAL(15,2),
    total_tax liability DECIMAL(15,2),
    total_tax_paid DECIMAL(15,2),
    refund_claimed DECIMAL(15,2),
    acknowledgment_number VARCHAR(100),
    filed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_returns_period ON gst_returns(return_period);
CREATE INDEX idx_gst_returns_taxpayer ON gst_returns(taxpayer_gst_number);
CREATE INDEX idx_gst_returns_status ON gst_returns(return_status);
CREATE INDEX idx_gst_returns_filing_date ON gst_returns(filing_date);

-- ============================================================================
-- GST PAYMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_payments (
    id SERIAL PRIMARY KEY,
    return_id INTEGER REFERENCES gst_returns(id) ON DELETE SET NULL,
    payment_type VARCHAR(50) NOT NULL,
    tax_type VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    challan_number VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_payments_return ON gst_payments(return_id);
CREATE INDEX idx_gst_payments_type ON gst_payments(payment_type);
CREATE INDEX idx_gst_payments_status ON gst_payments(payment_status);
CREATE INDEX idx_gst_payments_date ON gst_payments(payment_date);

-- ============================================================================
-- GST NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_notifications (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL,
    recipient_gst_number VARCHAR(50),
    notification_title VARCHAR(255),
    notification_text TEXT,
    priority VARCHAR(50),
    read_status BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_required BOOLEAN DEFAULT false,
    action_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_notifications_recipient ON gst_notifications(recipient_gst_number);
CREATE INDEX idx_gst_notifications_type ON gst_notifications(notification_type);
CREATE INDEX idx_gst_notifications_read ON gst_notifications(read_status);

-- ============================================================================
-- GST COMPLIANCE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_compliance_records (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    gst_number VARCHAR(50),
    compliance_type VARCHAR(50) NOT NULL,
    compliance_date DATE NOT NULL,
    compliance_status VARCHAR(50),
    compliance_score DECIMAL(5,4),
    violations JSONB,
    corrective_actions JSONB,
    next_compliance_date DATE,
    assessed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_compliance_entity ON gst_compliance_records(entity_id, entity_type);
CREATE INDEX idx_gst_compliance_type ON gst_compliance_records(compliance_type);
CREATE INDEX idx_gst_compliance_date ON gst_compliance_records(compliance_date);
CREATE INDEX idx_gst_compliance_gst ON gst_compliance_records(gst_number);

-- ============================================================================
-- GST AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gst_audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER,
    change_reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gst_audit_entity ON gst_audit_logs(entity_type, entity_id);
CREATE INDEX idx_gst_audit_action ON gst_audit_logs(action_type);
CREATE INDEX idx_gst_audit_date ON gst_audit_logs(created_at);
CREATE INDEX idx_gst_audit_user ON gst_audit_logs(changed_by);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_gst_rates_updated_at BEFORE UPDATE ON gst_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_invoices_updated_at BEFORE UPDATE ON gst_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_returns_updated_at BEFORE UPDATE ON gst_returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_payments_updated_at BEFORE UPDATE ON gst_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_compliance_records_updated_at BEFORE UPDATE ON gst_compliance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for GST summary by period
CREATE OR REPLACE VIEW gst_monthly_summary AS
SELECT 
    DATE_TRUNC('month', gi.invoice_date) as month,
    COUNT(DISTINCT gi.id) as total_invoices,
    SUM(gi.total_amount) as total_taxable_value,
    SUM(gi.total_gst) as total_gst_collected,
    SUM(gi.cgst_amount) as total_cgst,
    SUM(gi.sgst_amount) as total_sgst,
    SUM(gi.igst_amount) as total_igst,
    COUNT(DISTINCT gi.customer_gst_number) as unique_customers
FROM gst_invoices gi
WHERE gi.invoice_status = 'generated'
GROUP BY DATE_TRUNC('month', gi.invoice_date)
ORDER BY month DESC;

-- View for pending GST payments
CREATE OR REPLACE VIEW gst_pending_payments AS
SELECT 
    gp.*,
    gr.return_period,
    gr.taxpayer_gst_number,
    gr.taxpayer_name
FROM gst_payments gp
LEFT JOIN gst_returns gr ON gp.return_id = gr.id
WHERE gp.payment_status = 'pending'
ORDER BY gp.payment_date ASC;

-- View for GST compliance status
CREATE OR REPLACE VIEW gst_compliance_status AS
SELECT 
    gcr.entity_id,
    gcr.entity_type,
    gcr.gst_number,
    gcr.compliance_type,
    gcr.compliance_status,
    gcr.compliance_score,
    gcr.compliance_date,
    gcr.next_compliance_date,
    CASE 
        WHEN gcr.next_compliance_date < CURRENT_DATE THEN 'overdue'
        WHEN gcr.next_compliance_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'on_track'
    END as urgency_status
FROM gst_compliance_records gcr
WHERE gcr.compliance_date = (
    SELECT MAX(compliance_date) 
    FROM gst_compliance_records gcr2 
    WHERE gcr2.entity_id = gcr.entity_id 
    AND gcr2.entity_type = gcr.entity_type
    AND gcr2.compliance_type = gcr.compliance_type
);
