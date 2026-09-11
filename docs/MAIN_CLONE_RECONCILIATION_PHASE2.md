# MAIN → Enhanced Clone Reconciliation — Phase 2

## Scope
This phase reconciles the MAIN operational ERP/rural capability block represented by migrations 331–404 without importing the MAIN branch wholesale.

## Implemented

- Canonical operational module contract for supply chain, suppliers, logistics, procurement, inventory, quality, warehousing, cold-chain, returns, sustainability, fleet and driver operations.
- Route optimization, delivery, last-mile, visibility, proof-of-delivery, carrier and logistics exception capability keys.
- Agriculture capability keys for soil, crop disease, pests, fertilizer, yield, weather, insurance, finance, inputs, livestock, dairy, poultry, fishery, apiary and certification.
- Rural capability keys for land, water rights, carbon, training, markets, cooperatives, credit, schemes, equipment rental, agri-tourism, employment, education and community.
- Sustainability and impact capabilities including biodiversity, renewable energy, waste, social impact, gender, youth and mentorship.
- Finance/commercial compatibility capabilities including rural finance, microfinance, insurance, pensions, savings, investments, ERP integration, analytics, BI and compliance.
- Explicit operational tables for supply-chain events, procurement orders, inventory movements, delivery events and compliance records.

## Architectural rule
MAIN's generic JSONB module migrations are treated as capability declarations rather than duplicated one-table-per-module databases. The enhanced clone keeps one canonical operational entity contract while preserving explicit high-volume/event-heavy relational structures where relationships and audit history matter.

## Preserved
The existing enhanced-clone AI backbone, security hardening, production audit gates, integration registry and Phase-1 Village/AI/Digital Twin/GDPR/Image/Irrigation persistence are not replaced.

## Not yet claimed complete
The migration layer alone does not prove runtime completion. Services, routes, frontend wiring, transaction boundaries, authorization, observability, integration tests, deployment verification and end-to-end business workflows must still be verified against the reconciled schema.
