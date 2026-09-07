/**
 * Named role groups for route authorization.
 *
 * Roles come from the `user_role` enum in
 * database/migrations/000_base_schema.sql:
 *   admin | farmer | fpo | corporate | consumer | logistics | horeca
 *
 * Many mutation routes were gated on `authMiddleware` alone, which means
 * "any account that managed to log in" — including a `consumer` account
 * created through public self-registration. That let a buyer edit agronomic
 * records, close food-safety recalls or deactivate GST rates. These groups
 * name the intent so the gate on each route reads as a decision rather than
 * an ad-hoc role list, and so widening one is a single, reviewable edit.
 *
 * Where a record has a real owner column, prefer an ownership check over a
 * role group — a role group only narrows *who may act*, not *on whose data*.
 */

'use strict';

// Farm/agronomic operational records (crop, soil, water, land, livestock,
// horticulture, input supply, operations, community, climate monitoring).
// Buyer-side roles (consumer, horeca) are deliberately excluded.
const FARM_OPERATIONS_ROLES = ['admin', 'farmer', 'fpo', 'corporate'];

// Regulated/reference data whose state is a platform-level assertion:
// GST rates, food-safety recalls and CAPA, insurance claim adjudication,
// indigenous-knowledge protection status, biodiversity conservation records.
const PLATFORM_STAFF_ROLES = ['admin'];

// Movement of goods: shipment status, fleet, delivery schedules, cold-storage
// booking state.
const LOGISTICS_ROLES = ['admin', 'logistics'];

// Procurement/contract counterparties.
const PROCUREMENT_ROLES = ['admin', 'corporate', 'fpo'];

module.exports = {
  FARM_OPERATIONS_ROLES,
  PLATFORM_STAFF_ROLES,
  LOGISTICS_ROLES,
  PROCUREMENT_ROLES,
};
