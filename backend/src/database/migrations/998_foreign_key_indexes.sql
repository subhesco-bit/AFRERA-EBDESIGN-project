-- ============================================================================
-- 998_foreign_key_indexes.sql   (generated 2026-08-03)
--
-- WHY THIS EXISTS
-- PostgreSQL automatically indexes PRIMARY KEY and UNIQUE columns, but NOT the
-- referencing side of a foreign key. This schema had 294 FK columns with no
-- supporting index.
--
-- Two concrete costs:
--   1. Every JOIN across those relationships falls back to a sequential scan.
--   2. More seriously: DELETE or UPDATE of a PARENT row forces PostgreSQL to
--      scan the entire CHILD table to enforce referential integrity, while
--      holding a lock. On a large table this turns a routine delete into a
--      table-wide stall.
--
-- Numbered 998 so it runs after all table creation (including 000_base_schema)
-- but before 999_schema_reconciliation.
--
-- OPERATIONAL NOTE
-- These are plain CREATE INDEX, not CREATE INDEX CONCURRENTLY, because
-- CONCURRENTLY cannot run inside a transaction block and the migration runner
-- wraps each file in one. On an already-populated production database, build
-- these CONCURRENTLY by hand outside the migration instead — a plain CREATE
-- INDEX takes an ACCESS EXCLUSIVE lock for the duration of the build.
--
-- FIXED 2026-08-04: this comment block previously ran on without its "--"
-- prefix and absorbed the first CREATE INDEX statement, leaving an orphaned
-- "ON advances (farmer_id);" that made the whole file a syntax error. Caught
-- by parsing every migration with the real PostgreSQL grammar (pglast).
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_advances_farmer_id
    ON advances (farmer_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_created_by
    ON ai_analysis_results (created_by);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_model_id
    ON anomaly_detection (model_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_company_id
    ON ap_invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_cost_center_id
    ON ap_invoices (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_journal_entry_id
    ON ap_invoices (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_company_id
    ON ar_invoices (company_id);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_journal_entry_id
    ON ar_invoices (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_profit_center_id
    ON ar_invoices (profit_center_id);
CREATE INDEX IF NOT EXISTS idx_ar_vr_assets_created_by
    ON ar_vr_assets (created_by);
CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_created_by
    ON ar_vr_experiences (created_by);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_asset_id
    ON asset_bookings (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_user_id
    ON asset_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_assets_location_id
    ON assets (location_id);
CREATE INDEX IF NOT EXISTS idx_assets_responsible_user_id
    ON assets (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type_id
    ON assets (type_id);
CREATE INDEX IF NOT EXISTS idx_audit_alert_log_acknowledged_by
    ON audit_alert_log (acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_bim_models_uploaded_by
    ON bim_models (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_blockchain_certificates_issuer_id
    ON blockchain_certificates (issuer_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_certificates_transaction_hash
    ON blockchain_certificates (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_boq_items_marketplace_product_id
    ON boq_items (marketplace_product_id);
CREATE INDEX IF NOT EXISTS idx_branches_business_unit_id
    ON branches (business_unit_id);
CREATE INDEX IF NOT EXISTS idx_branches_company_id
    ON branches (company_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_account_id
    ON budget_lines (account_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_id
    ON budget_lines (budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_cost_center_id
    ON budget_lines (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_fiscal_period_id
    ON budget_lines (fiscal_period_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_profit_center_id
    ON budget_lines (profit_center_id);
CREATE INDEX IF NOT EXISTS idx_budgets_company_id
    ON budgets (company_id);
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year_id
    ON budgets (fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_bulk_order_quotations_accepted_by
    ON bulk_order_quotations (accepted_by);
CREATE INDEX IF NOT EXISTS idx_bulk_order_quotations_rejected_by
    ON bulk_order_quotations (rejected_by);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_reviewed_by
    ON bulk_orders (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_business_units_company_id
    ON business_units (company_id);
CREATE INDEX IF NOT EXISTS idx_business_units_parent_unit_id
    ON business_units (parent_unit_id);
CREATE INDEX IF NOT EXISTS idx_cad_files_reviewed_by
    ON cad_files (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_cad_files_uploaded_by
    ON cad_files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cart_product_id
    ON cart (product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id
    ON cart (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
    ON categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_certification_reports_sample_id
    ON certification_reports (sample_id);
CREATE INDEX IF NOT EXISTS idx_certifications_product_id
    ON certifications (product_id);
CREATE INDEX IF NOT EXISTS idx_chain_of_custody_from_holder_id
    ON chain_of_custody (from_holder_id);
CREATE INDEX IF NOT EXISTS idx_chain_of_custody_transaction_hash
    ON chain_of_custody (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_account_id
    ON chart_of_accounts (parent_account_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_uploaded_by
    ON claim_documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id
    ON claims (policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id
    ON claims (user_id);
CREATE INDEX IF NOT EXISTS idx_companies_parent_company_id
    ON companies (parent_company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_verified_by
    ON compliance_records (verified_by);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_reviewed_by
    ON compliance_reports (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_submitted_by
    ON compliance_reports (submitted_by);
CREATE INDEX IF NOT EXISTS idx_construction_progress_reported_by
    ON construction_progress (reported_by);
CREATE INDEX IF NOT EXISTS idx_content_translations_language_id
    ON content_translations (language_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract_id
    ON contract_milestones (contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_id
    ON contracts (buyer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_crop_id
    ON contracts (crop_id);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer_id
    ON contracts (farmer_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_domain_id
    ON conversation_analytics (domain_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_session_id
    ON conversation_analytics (session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_user_id
    ON conversation_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_handoffs_session_id
    ON conversation_handoffs (session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_domain_id
    ON conversation_sessions (domain_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_business_unit_id
    ON cost_centers (business_unit_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_department_id
    ON cost_centers (department_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent_cost_center_id
    ON cost_centers (parent_cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_approved_by
    ON cost_estimates (approved_by);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_created_by
    ON cost_estimates (created_by);
CREATE INDEX IF NOT EXISTS idx_cost_estimates_previous_estimate_id
    ON cost_estimates (previous_estimate_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_farmer_id
    ON credit_scores (farmer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_route_id
    ON delivery_schedules (route_id);
-- 2026-08-30: retargeted from `departments` to `enterprise_departments` -
-- business_unit_id/company_id/parent_department_id only exist on the
-- multi-tenant table (renamed from a name collision with the real, live HR
-- `departments` table - see 996_enterprise_foundation.sql and
-- schema-decisions.json "departments").
CREATE INDEX IF NOT EXISTS idx_departments_business_unit_id
    ON enterprise_departments (business_unit_id);
CREATE INDEX IF NOT EXISTS idx_departments_company_id
    ON enterprise_departments (company_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id
    ON enterprise_departments (parent_department_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_fiscal_period_id
    ON depreciation_schedule (fiscal_period_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_fixed_asset_id
    ON depreciation_schedule (fixed_asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_journal_entry_id
    ON depreciation_schedule (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_design_documents_reviewed_by
    ON design_documents (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_design_documents_uploaded_by
    ON design_documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_device_alerts_acknowledged_by
    ON device_alerts (acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_device_commands_sent_by
    ON device_commands (sent_by);
CREATE INDEX IF NOT EXISTS idx_device_group_members_device_id
    ON device_group_members (device_id);
CREATE INDEX IF NOT EXISTS idx_device_group_members_group_id
    ON device_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_device_groups_created_by
    ON device_groups (created_by);
CREATE INDEX IF NOT EXISTS idx_device_groups_location_id
    ON device_groups (location_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_dispatch_pass_id
    ON dispatch_events (dispatch_pass_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_events_gate_pass_id
    ON dispatch_events (gate_pass_id);
CREATE INDEX IF NOT EXISTS idx_dpr_documents_created_by
    ON dpr_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_dpr_documents_submitted_by
    ON dpr_documents (submitted_by);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle_id
    ON drivers (assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_drone_surveys_created_by
    ON drone_surveys (created_by);
CREATE INDEX IF NOT EXISTS idx_emi_schedule_loan_id
    ON emi_schedule (loan_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_analysis_analyst_id
    ON enterprise_feasibility_analysis (analyst_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_laboratory_id
    ON equipment_calibration (laboratory_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_contract_id
    ON escrow_accounts (contract_id);
CREATE INDEX IF NOT EXISTS idx_eway_bills_invoice_id
    ON eway_bills (invoice_id);
CREATE INDEX IF NOT EXISTS idx_experience_assets_asset_id
    ON experience_assets (asset_id);
CREATE INDEX IF NOT EXISTS idx_facility_operations_operator_id
    ON facility_operations (operator_id);
CREATE INDEX IF NOT EXISTS idx_farm_consumables_supplier_id
    ON farm_consumables (supplier_id);
CREATE INDEX IF NOT EXISTS idx_farmer_certifications_farmer_id
    ON farmer_certifications (farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmers_farm_location_id
    ON farmers (farm_location_id);
CREATE INDEX IF NOT EXISTS idx_financial_needs_assessment_assessed_by
    ON financial_needs_assessment (assessed_by);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id
    ON financial_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_fiscal_year_id
    ON fiscal_periods (fiscal_year_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_company_id
    ON fiscal_years (company_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_branch_id
    ON fixed_assets (branch_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_cost_center_id
    ON fixed_assets (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_food_categories_parent_id
    ON food_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_food_consumption_logs_product_id
    ON food_consumption_logs (product_id);
CREATE INDEX IF NOT EXISTS idx_food_contaminant_tests_contaminant_id
    ON food_contaminant_tests (contaminant_id);
CREATE INDEX IF NOT EXISTS idx_food_contaminant_tests_food_item_id
    ON food_contaminant_tests (food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_freshness_assessments_food_item_id
    ON food_freshness_assessments (food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_items_gi_id
    ON food_items (gi_id);
CREATE INDEX IF NOT EXISTS idx_food_quality_assessments_food_item_id
    ON food_quality_assessments (food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_recalls_food_item_id
    ON food_recalls (food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_safety_certifications_food_item_id
    ON food_safety_certifications (food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_safety_certifications_safety_standard_id
    ON food_safety_certifications (safety_standard_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id
    ON form_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_fpos_address_id
    ON fpos (address_id);
CREATE INDEX IF NOT EXISTS idx_gi_authentication_producer_id
    ON gi_authentication (producer_id);
CREATE INDEX IF NOT EXISTS idx_gi_authentication_product_id
    ON gi_authentication (product_id);
CREATE INDEX IF NOT EXISTS idx_gi_educational_content_gi_product_id
    ON gi_educational_content (gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_marketplace_listings_location_id
    ON gi_marketplace_listings (location_id);
CREATE INDEX IF NOT EXISTS idx_gi_marketplace_listings_product_id
    ON gi_marketplace_listings (product_id);
CREATE INDEX IF NOT EXISTS idx_gi_pricing_rules_gi_product_id
    ON gi_pricing_rules (gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_producers_farmer_id
    ON gi_producers (farmer_id);
CREATE INDEX IF NOT EXISTS idx_gi_producers_fpo_id
    ON gi_producers (fpo_id);
CREATE INDEX IF NOT EXISTS idx_gi_producers_production_location_id
    ON gi_producers (production_location_id);
CREATE INDEX IF NOT EXISTS idx_gi_product_pricing_gi_product_id
    ON gi_product_pricing (gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_product_quality_ratings_gi_product_id
    ON gi_product_quality_ratings (gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_product_quality_ratings_product_id
    ON gi_product_quality_ratings (product_id);
CREATE INDEX IF NOT EXISTS idx_gi_product_quality_ratings_quality_tier_id
    ON gi_product_quality_ratings (quality_tier_id);
CREATE INDEX IF NOT EXISTS idx_gi_quality_tiers_gi_product_id
    ON gi_quality_tiers (gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gift_hamper_orders_hamper_id
    ON gift_hamper_orders (hamper_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_lines_po_line_id
    ON goods_receipt_lines (po_line_id);
CREATE INDEX IF NOT EXISTS idx_gst_compliance_tracking_user_id
    ON gst_compliance_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_gst_itc_ledger_user_id
    ON gst_itc_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_gst_returns_history_user_id
    ON gst_returns_history (user_id);
CREATE INDEX IF NOT EXISTS idx_household_orders_household_economy_id
    ON household_orders (household_economy_id);
CREATE INDEX IF NOT EXISTS idx_intents_domain_id
    ON intents (domain_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_from_location_id
    ON inventory_movements (from_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_to_location_id
    ON inventory_movements (to_location_id);
CREATE INDEX IF NOT EXISTS idx_invoice_match_results_grn_id
    ON invoice_match_results (grn_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_location_id
    ON iot_devices (location_id);
-- 2026-08-30: removed 3 indexes on journal_entries(fiscal_period_id/
-- reversed_by_entry_id/reverses_entry_id) - none exist on the real (winner)
-- journal_entries table, a deferred collision loser situation (see
-- schema-decisions.json "journal_entries").
CREATE INDEX IF NOT EXISTS idx_journal_lines_branch_id
    ON journal_lines (branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_business_unit_id
    ON journal_lines (business_unit_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_department_id
    ON journal_lines (department_id);
CREATE INDEX IF NOT EXISTS idx_laboratories_location_id
    ON laboratories (location_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_analysts_laboratory_id
    ON laboratory_analysts (laboratory_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_analysts_user_id
    ON laboratory_analysts (user_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_invoices_billed_to
    ON laboratory_invoices (billed_to);
CREATE INDEX IF NOT EXISTS idx_laboratory_invoices_sample_id
    ON laboratory_invoices (sample_id);
CREATE INDEX IF NOT EXISTS idx_land_records_verified_by
    ON land_records (verified_by);
CREATE INDEX IF NOT EXISTS idx_language_detection_logs_detected_language_id
    ON language_detection_logs (detected_language_id);
CREATE INDEX IF NOT EXISTS idx_loans_farmer_id
    ON loans (farmer_id);
CREATE INDEX IF NOT EXISTS idx_locales_language_id
    ON locales (language_id);
CREATE INDEX IF NOT EXISTS idx_machinery_access_crop_id
    ON machinery_access (crop_id);
CREATE INDEX IF NOT EXISTS idx_machinery_access_operator_id
    ON machinery_access (operator_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset_id
    ON maintenance_records (asset_id);
-- Retargeted 2026-08-10: assigned_to/completed_by only exist on
-- engineering_maintenance_records (see 023_engineering_schema.sql, renamed
-- from maintenance_records to resolve a collision with the real,
-- winning maintenance_records table in 000_base_schema.sql, which has
-- neither column).
CREATE INDEX IF NOT EXISTS idx_engineering_maintenance_records_assigned_to
    ON engineering_maintenance_records (assigned_to);
CREATE INDEX IF NOT EXISTS idx_engineering_maintenance_records_completed_by
    ON engineering_maintenance_records (completed_by);
CREATE INDEX IF NOT EXISTS idx_market_access_logistics_provider_id
    ON market_access (logistics_provider_id);
CREATE INDEX IF NOT EXISTS idx_network_status_tracking_user_id
    ON network_status_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_payment_cards_user_id
    ON nfc_payment_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_non_conformances_inspection_id
    ON non_conformances (inspection_id);
CREATE INDEX IF NOT EXISTS idx_nutrients_category_id
    ON nutrients (category_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_comparisons_product_a_id
    ON nutrition_comparisons (product_a_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_comparisons_product_b_id
    ON nutrition_comparisons (product_b_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_comparisons_winner_product_id
    ON nutrition_comparisons (winner_product_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_labels_product_id
    ON nutrition_labels (product_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_recommendations_dietary_profile_id
    ON nutrition_recommendations (dietary_profile_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_recommendations_user_id
    ON nutrition_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_offline_data_snapshots_user_id
    ON offline_data_snapshots (user_id);
CREATE INDEX IF NOT EXISTS idx_offline_payment_analytics_transaction_id
    ON offline_payment_analytics (transaction_id);
CREATE INDEX IF NOT EXISTS idx_offline_payment_analytics_user_id
    ON offline_payment_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_offline_transactions_payer_id
    ON offline_transactions (payer_id);
CREATE INDEX IF NOT EXISTS idx_offline_transactions_payment_request_id
    ON offline_transactions (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_orders_billing_address_id
    ON orders (billing_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_address_id
    ON orders (shipping_address_id);
CREATE INDEX IF NOT EXISTS idx_organic_audits_organic_farm_id
    ON organic_audits (organic_farm_id);
CREATE INDEX IF NOT EXISTS idx_organic_consumer_transparency_product_id
    ON organic_consumer_transparency (product_id);
CREATE INDEX IF NOT EXISTS idx_organic_crops_organic_plot_id
    ON organic_crops (organic_plot_id);
CREATE INDEX IF NOT EXISTS idx_organic_farms_certification_standard_id
    ON organic_farms (certification_standard_id);
CREATE INDEX IF NOT EXISTS idx_organic_farms_location_id
    ON organic_farms (location_id);
CREATE INDEX IF NOT EXISTS idx_organic_harvests_organic_crop_id
    ON organic_harvests (organic_crop_id);
CREATE INDEX IF NOT EXISTS idx_organic_input_usage_organic_input_id
    ON organic_input_usage (organic_input_id);
CREATE INDEX IF NOT EXISTS idx_organic_input_usage_organic_plot_id
    ON organic_input_usage (organic_plot_id);
CREATE INDEX IF NOT EXISTS idx_organic_inputs_input_type_id
    ON organic_inputs (input_type_id);
CREATE INDEX IF NOT EXISTS idx_organic_packaging_records_packaging_material_id
    ON organic_packaging_records (packaging_material_id);
CREATE INDEX IF NOT EXISTS idx_organic_packaging_records_transport_record_id
    ON organic_packaging_records (transport_record_id);
CREATE INDEX IF NOT EXISTS idx_organic_processing_batches_harvest_id
    ON organic_processing_batches (harvest_id);
CREATE INDEX IF NOT EXISTS idx_organic_processing_batches_processing_facility_id
    ON organic_processing_batches (processing_facility_id);
CREATE INDEX IF NOT EXISTS idx_organic_processing_facilities_location_id
    ON organic_processing_facilities (location_id);
CREATE INDEX IF NOT EXISTS idx_organic_storage_facilities_location_id
    ON organic_storage_facilities (location_id);
CREATE INDEX IF NOT EXISTS idx_organic_storage_records_processing_batch_id
    ON organic_storage_records (processing_batch_id);
CREATE INDEX IF NOT EXISTS idx_organic_storage_records_storage_facility_id
    ON organic_storage_records (storage_facility_id);
CREATE INDEX IF NOT EXISTS idx_organic_transport_records_storage_record_id
    ON organic_transport_records (storage_record_id);
CREATE INDEX IF NOT EXISTS idx_packing_units_pick_list_id
    ON packing_units (pick_list_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_ap_invoice_id
    ON payment_allocations (ap_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_ar_invoice_id
    ON payment_allocations (ar_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id
    ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_policies_farmer_id
    ON policies (farmer_id);
CREATE INDEX IF NOT EXISTS idx_policies_product_id
    ON policies (product_id);
CREATE INDEX IF NOT EXISTS idx_policies_user_id
    ON policies (user_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_nutrition_profile_id
    ON product_nutrition (nutrition_profile_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_pricing_nutrition_score_id
    ON product_nutrition_pricing (nutrition_score_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_pricing_pricing_rule_id
    ON product_nutrition_pricing (pricing_rule_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_pricing_product_id
    ON product_nutrition_pricing (product_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrition_scores_scoring_model_id
    ON product_nutrition_scores (scoring_model_id);
CREATE INDEX IF NOT EXISTS idx_product_value_pricing_pricing_rule_id
    ON product_value_pricing (pricing_rule_id);
CREATE INDEX IF NOT EXISTS idx_product_value_pricing_value_score_id
    ON product_value_pricing (value_score_id);
CREATE INDEX IF NOT EXISTS idx_product_value_scores_calculation_model_id
    ON product_value_scores (calculation_model_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
    ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_products_created_by
    ON products (created_by);
CREATE INDEX IF NOT EXISTS idx_products_unit_id
    ON products (unit_id);
CREATE INDEX IF NOT EXISTS idx_profit_centers_business_unit_id
    ON profit_centers (business_unit_id);
CREATE INDEX IF NOT EXISTS idx_profit_centers_parent_profit_center_id
    ON profit_centers (parent_profit_center_id);
CREATE INDEX IF NOT EXISTS idx_project_schedules_created_by
    ON project_schedules (created_by);
-- 2026-08-30: removed 2 indexes on purchase_orders(requisition_id/rfq_id) -
-- neither exists on the real (winner) purchase_orders table, same deferred-
-- collision situation as journal_entries above.
CREATE INDEX IF NOT EXISTS idx_quality_checks_approved_by
    ON quality_checks (approved_by);
CREATE INDEX IF NOT EXISTS idx_quality_checks_inspected_by
    ON quality_checks (inspected_by);
CREATE INDEX IF NOT EXISTS idx_quality_control_samples_sample_id
    ON quality_control_samples (sample_id);
CREATE INDEX IF NOT EXISTS idx_query_results_executed_by
    ON query_results (executed_by);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id
    ON recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_financing_id
    ON renewable_energy_systems (financing_id);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_installer_id
    ON renewable_energy_systems (installer_id);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_maintenance_provider_id
    ON renewable_energy_systems (maintenance_provider_id);
CREATE INDEX IF NOT EXISTS idx_reverse_logistics_logistics_partner_id
    ON reverse_logistics (logistics_partner_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter_id
    ON review_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reviewed_by
    ON review_reports (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_rfq_headers_requisition_id
    ON rfq_headers (requisition_id);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_dpr_id
    ON rural_enterprises (dpr_id);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_insurance_id
    ON rural_enterprises (insurance_id);
CREATE INDEX IF NOT EXISTS idx_rural_finance_insurance_policy_id
    ON rural_finance (insurance_policy_id);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reporter_id
    ON safety_incidents (reporter_id);
CREATE INDEX IF NOT EXISTS idx_sample_registrations_submitted_by
    ON sample_registrations (submitted_by);
CREATE INDEX IF NOT EXISTS idx_semantic_search_index_node_id
    ON semantic_search_index (node_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_location_id
    ON sensor_data (location_id);
CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_crop_id
    ON shared_infrastructure_access (crop_id);
CREATE INDEX IF NOT EXISTS idx_shipments_mode_id
    ON shipments (mode_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id
    ON shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_executed_by
    ON smart_contracts (executed_by);
CREATE INDEX IF NOT EXISTS idx_sod_violations_rule_id
    ON sod_violations (rule_id);
CREATE INDEX IF NOT EXISTS idx_speech_recognition_logs_session_id
    ON speech_recognition_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_farmer_id
    ON subsidy_claims (farmer_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_scheme_id
    ON subsidy_claims (scheme_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_log_user_id
    ON sync_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id
    ON sync_conflicts (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id
    ON sync_queue (user_id);
CREATE INDEX IF NOT EXISTS idx_sync_statistics_user_id
    ON sync_statistics (user_id);
CREATE INDEX IF NOT EXISTS idx_temperature_alert_log_alert_id
    ON temperature_alert_log (alert_id);
-- Retargeted 2026-08-10: evaluated_by only exists on engineering_tender_bids
-- (see 023_engineering_schema.sql, renamed from tender_bids to resolve the
-- collision with the real, mounted tender_bids table in
-- 030_institutional_procurement_schema.sql, which has no evaluated_by column).
CREATE INDEX IF NOT EXISTS idx_engineering_tender_bids_evaluated_by
    ON engineering_tender_bids (evaluated_by);
CREATE INDEX IF NOT EXISTS idx_tender_documents_created_by
    ON tender_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_test_assignments_test_method_id
    ON test_assignments (test_method_id);
CREATE INDEX IF NOT EXISTS idx_test_categories_parent_id
    ON test_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_test_methods_category_id
    ON test_methods (category_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_assignment_id
    ON test_results (test_assignment_id);
CREATE INDEX IF NOT EXISTS idx_traceability_events_actor_id
    ON traceability_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_traceability_events_location_id
    ON traceability_events (location_id);
CREATE INDEX IF NOT EXISTS idx_training_records_farmer_id
    ON training_records (farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_translation_memory_target_language_id
    ON translation_memory (target_language_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_memory_match_id
    ON translation_requests (memory_match_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_source_language_id
    ON translation_requests (source_language_id);
CREATE INDEX IF NOT EXISTS idx_translation_requests_target_language_id
    ON translation_requests (target_language_id);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_generated_by_model_id
    ON trend_analysis (generated_by_model_id);
CREATE INDEX IF NOT EXISTS idx_user_language_preferences_primary_language_id
    ON user_language_preferences (primary_language_id);
CREATE INDEX IF NOT EXISTS idx_user_language_preferences_secondary_language_id
    ON user_language_preferences (secondary_language_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_settings_user_id
    ON user_payment_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by
    ON user_roles (assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
    ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
    ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sync_preferences_user_id
    ON user_sync_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id
    ON user_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_ussd_payment_requests_user_id
    ON ussd_payment_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_performed_by
    ON vehicle_maintenance (performed_by);
CREATE INDEX IF NOT EXISTS idx_verification_requests_certificate_id
    ON verification_requests (certificate_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_requested_by
    ON verification_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_voice_command_analytics_user_id
    ON voice_command_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversation_turns_conversation_id
    ON voice_conversation_turns (conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversation_turns_user_id
    ON voice_conversation_turns (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_user_id
    ON voice_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_conversation_id
    ON voice_feedback (conversation_id);
CREATE INDEX IF NOT EXISTS idx_voice_feedback_user_id
    ON voice_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_language_preferences_user_id
    ON voice_language_preferences (user_id);
CREATE INDEX IF NOT EXISTS idx_voice_responses_command_id
    ON voice_responses (command_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_recipient_id
    ON wallet_transactions (recipient_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_processed_by
    ON warehouse_shipments (processed_by);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_model_id
    ON what_if_scenarios (model_id);
