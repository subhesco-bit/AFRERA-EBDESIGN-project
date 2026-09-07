# DEVELOPER 1 ASSIGNMENT: WAVE 2 WORKFLOW ARCHITECTURE
**Role:** Backend Architect / Database Designer  
**Track:** B (Wave 2 Preparation)  
**Timeline:** Sep 6-8, 2026 (3 days, 20 hours)  
**Goal:** Complete database schemas + API contracts for all 5 workflows

---

## YOUR MISSION

You are building the **complete technical specification** for 5 critical workflows so that on Sep 9, the implementation team can code immediately with zero ambiguity.

**Success = Developers can code without asking "what's the API?"**

---

## DELIVERABLES CHECKLIST

**By Sep 8 17:00, you must deliver:**

### Booking Workflow
- [ ] `booking_schema.sql` (complete, tested migration)
- [ ] `booking_api_contract.md` (all endpoints documented)
- [ ] `booking_business_rules.md` (state machine, validation rules)
- [ ] `booking_integration_spec.md` (how it connects to other workflows)

### Policy Workflow
- [ ] `policy_schema.sql`
- [ ] `policy_api_contract.md`
- [ ] `policy_business_rules.md`
- [ ] `policy_integration_spec.md`

### Claim Workflow
- [ ] `claim_schema.sql`
- [ ] `claim_api_contract.md`
- [ ] `claim_business_rules.md`
- [ ] `claim_integration_spec.md`

### Logistics Workflow
- [ ] `logistics_schema.sql`
- [ ] `logistics_api_contract.md`
- [ ] `logistics_business_rules.md`
- [ ] `logistics_integration_spec.md`

### Loyalty Workflow
- [ ] `loyalty_schema.sql`
- [ ] `loyalty_api_contract.md`
- [ ] `loyalty_business_rules.md`
- [ ] `loyalty_integration_spec.md`

### Master Integration Guide
- [ ] `WAVE2-MASTER-IMPLEMENTATION-GUIDE.md` (consolidated specs)
- [ ] `database_migration_deployment.sh` (automated setup)
- [ ] `e2e_testing_plan.md` (comprehensive test scenarios)

---

## DAY-BY-DAY BREAKDOWN

### **DAY 1: THURSDAY, SEP 6**

#### Morning (4 hours): Booking Workflow Foundation
**09:00 - 09:30: Kickoff & Context**
- Review EBDESIGN database (`.ai/architecture/DATABASE_CURRENT_STATE.md`)
- Understand existing 523 tables
- Check naming conventions, audit patterns

**09:30 - 11:30: Booking Database Schema (2 hours)**
```sql
-- booking_schema.sql

-- Core booking table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties involved
  farmer_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  
  -- Product details
  product_id UUID NOT NULL,
  product_name VARCHAR(255),
  product_quantity INT NOT NULL,
  product_unit VARCHAR(50), -- kg, tons, etc
  
  -- Pricing
  unit_price DECIMAL(12,2) NOT NULL,
  total_value DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Logistics
  logistics_quote_id UUID,
  logistics_cost DECIMAL(12,2),
  delivery_address TEXT,
  delivery_pincode VARCHAR(10),
  estimated_delivery DATE,
  
  -- Status & workflow
  status ENUM('quote_requested', 'quote_provided', 'accepted', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'quote_requested',
  
  -- Audit trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  -- Soft delete
  deleted_at TIMESTAMP NULL,
  
  CONSTRAINT booking_quantity_positive CHECK (product_quantity > 0),
  CONSTRAINT booking_price_positive CHECK (unit_price > 0)
);

-- Supporting tables for booking items, history, documents, etc.
-- (add 2-3 more tables as needed)

-- Indexes
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_farmer ON bookings(farmer_id);
CREATE INDEX idx_bookings_buyer ON bookings(buyer_id);
CREATE INDEX idx_bookings_created ON bookings(created_at DESC);
```

**Acceptance Criteria:**
- ✅ Schema runs without errors
- ✅ All constraints enforced
- ✅ Indexes on high-query fields
- ✅ Audit trail complete

**11:30 - 13:00: Booking API Contracts (1.5 hours)**
```markdown
# Booking API Contract

## Endpoints

### 1. Request Quote
POST /api/v1/bookings/quote

Request:
{
  "product_id": "uuid",
  "quantity": 100,
  "unit": "kg",
  "delivery_pincode": "110001"
}

Response (200):
{
  "quote_id": "uuid",
  "shipping_cost": 5000,
  "estimated_days": 3,
  "total_estimate": 55000,
  "valid_until": "2026-09-10"
}

### 2. Create Booking
POST /api/v1/bookings

Request:
{
  "quote_id": "uuid",
  "buyer_id": "uuid",
  "payment_method": "escrow"
}

Response (201):
{
  "booking_id": "uuid",
  "status": "confirmed",
  "created_at": "2026-09-06T..."
}

### 3-5. Get, Update, Cancel (similar format)
```

**13:00 - 14:00: Lunch Break** ☕

#### Afternoon (4 hours): Policy Workflow Foundation
**14:00 - 18:00: Policy Database + API (4 hours)**
- Policy schema (coverage types, premiums, terms)
- API contract (create policy, list, update, cancel)
- Integration with Booking (reference booking in policy)

**Focus:** Same rigor as Booking

---

### **DAY 2: FRIDAY, SEP 7**

#### Morning (4 hours): Claim Workflow + Database Integration
**09:00 - 13:00: Claim Schema + API (4 hours)**
- Claim table (links to policy, assessment status)
- Assessment table (assessor notes, photos)
- Payout table (resolution + payment)
- API contracts (submit, assess, approve, reject)

**Integration Points:**
- Links to Policy workflow
- Triggers Logistics if replacement needed
- Notification to Loyalty (claim resolution = points)

#### Afternoon (4 hours): Logistics Workflow
**14:00 - 18:00: Logistics Schema + API (4 hours)**
- Shipment table (tracking, custody)
- Custody chain table (who held when)
- Real-time update mechanism
- API contracts (create, track, transfer, sign, complete)

**Integration Points:**
- Consumes Booking data
- Provides tracking to customer
- Logs custody for compliance

---

### **DAY 3: SATURDAY, SEP 8**

#### Morning (3 hours): Loyalty Workflow + Consolidation
**09:00 - 12:00: Loyalty Schema + Final Integration (3 hours)**
- Points table (accrual per workflow)
- Rewards catalog
- Redemption tracking
- API contracts (earn, redeem, list)

**Integration:** References all workflows (1 point per booking, 5 per claim resolved, etc.)

#### Afternoon (2 hours): Master Guide Compilation
**13:00 - 15:00: WAVE2-MASTER-IMPLEMENTATION-GUIDE.md (2 hours)**
- Consolidate all 5 workflow specs
- Create database migration sequence
- Document deployment steps
- Write E2E test scenarios

**15:00 - 17:00: Deployment Scripts + Documentation**
- `database_migration_deployment.sh` (automated setup)
- `testing_checklist.md` (QA sign-off)

**17:00 - 17:30: Final Review & Handoff**
- Self-review all schemas (no syntax errors)
- Verify all API contracts (consistency)
- Check integration points (all workflows connected)

---

## TECHNICAL STANDARDS

### Database Design
✅ **Must follow:**
- PostgreSQL 15 best practices
- Immutable audit trail (created_by, updated_by, timestamps)
- Soft delete (deleted_at) for compliance
- Proper indexing (high-frequency queries)
- Foreign key constraints (referential integrity)
- ENUM for status fields (enforce valid states)
- Decimal for currency (never float)

### API Contract Format
✅ **Must include:**
- HTTP method (GET, POST, PUT, DELETE)
- Full endpoint path (/api/v1/resource/:id)
- Request body (JSON schema)
- Response body (success + error cases)
- HTTP status codes (201, 400, 401, 403, 500)
- Rate limits (if applicable)

### Business Rules Documentation
✅ **Must specify:**
- Valid status transitions (state machine)
- Validation rules (min/max, required fields)
- Business constraints (e.g., no booking after harvest date)
- Integration triggers (e.g., booking complete → logistics initiated)

---

## TOOLS & RESOURCES

### Database Design
- PostgreSQL 15 official docs: https://www.postgresql.org/docs/15/
- Existing EBDESIGN schema: `.ai/architecture/DATABASE_CURRENT_STATE.md`
- Naming conventions: Check `backend/src/database/migrations/` for pattern

### API Standards
- RESTful best practices: https://restfulapi.net/
- Status codes: https://httpwg.org/specs/rfc7231.html#status.codes
- Request/response format: Follow existing EBDESIGN APIs in `backend/src/routes/`

### Version Control
```bash
# All files go to .ai/migration/workflows/ or .ai/wave2-specs/
git add .ai/migration/workflows/*.md
git add .ai/migration/workflows/*.sql
git commit -m "Wave 2: [Workflow Name] specs (schema + API + rules)"
```

---

## QUALITY CHECKLIST - Before Sep 8 17:00

### Booking
- [ ] Schema runs: `psql < booking_schema.sql` (0 errors)
- [ ] API contracts complete (GET, POST, PUT, DELETE all defined)
- [ ] Business rules documented (status flow, validation)
- [ ] Indexes on farmer_id, buyer_id, status, created_at
- [ ] Integration documented (links to Policy, Logistics)

### Policy
- [ ] Schema references Booking correctly
- [ ] Coverage types defined (enum or table)
- [ ] Premium calculation rules specified
- [ ] Claim linkage clear

### Claim
- [ ] Status flow documented (submitted → assessed → approved → resolved)
- [ ] Assessment workflow clear (who does what)
- [ ] Payout rules specified
- [ ] Integration with Logistics (replacement scenarios)

### Logistics
- [ ] Custody chain immutable (timestamps, who signed)
- [ ] Real-time tracking fields included
- [ ] Integration with Booking clear
- [ ] Compliance audit trail complete

### Loyalty
- [ ] Points calculation rules clear (1 point = ?, multipliers)
- [ ] Reward catalog populated
- [ ] Integration with all workflows documented

### Master Guide
- [ ] All 5 workflows consolidated
- [ ] Deployment sequence clear
- [ ] Testing plan comprehensive
- [ ] Zero conflicting definitions

---

## SUCCESS DEFINITION

**You're done when:**

✅ All 5 workflow specs are complete  
✅ No developer has to ask "what's the database table?"  
✅ No developer has to ask "what's the API endpoint?"  
✅ No developer has to ask "what are the business rules?"  
✅ All integration points clearly documented  
✅ Master guide could be handed to 3 junior devs to implement in parallel  

**By Sep 9 09:00:**
- Developers can start coding Booking with ZERO ambiguity
- Booking ready to merge by Sep 10 evening
- Rest of workflows follow same clarity

---

## COMMUNICATION & BLOCKERS

### Daily Sync (09:00 & 17:00)
- **09:00:** "Starting [Workflow X], expect schema + API by [time]"
- **17:00:** "Completed [Workflow X], starting [Workflow Y]"

### If Blocked
- **Database questions?** → Check existing EBDESIGN migrations
- **API design questions?** → Check existing EBDESIGN routes
- **Business logic unclear?** → Ask Developer 2 (they're validating requirements)
- **Architecture decision needed?** → Message in #wave2-architecture

### Deliverable Locations
- All `.sql` files → `.ai/migration/workflows/`
- All `.md` files → `.ai/migration/workflows/`
- Master guide → `.ai/migration/WAVE2-MASTER-IMPLEMENTATION-GUIDE.md`

---

## FINAL HANDOFF (Sep 8 17:30)

**Deliverables meeting:**
- 20 files ready for review
- Zero syntax errors confirmed
- All integration points documented
- Ready for Wave 2 implementation team

**Next step (Sep 9 09:00):** Implementation team picks up with complete specs, begins coding.

---

**You've got this. Ship complete specs by Sep 8 17:00.** 🚀

*This is the foundation Wave 2 is built on.*
