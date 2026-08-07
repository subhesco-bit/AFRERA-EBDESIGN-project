# AEOS Gap Analysis — attachments vs the actual codebase

**Date:** 2026-08-04
**Sources analysed:**
- `No project chats.docx` — 974,060 chars extracted (15,312 paragraphs, 508 tables)
- `deep-research-report (1).md` — 119 lines, 11 module sections
- AEOS brief supplied in the request

**Method:** every concept was grep-tested against the live repository by
**capability, not by name**. That distinction matters — a name-only check
reported 18 of 22 services in the research report as "missing" when most of
the underlying capability exists under different names.

---

## 1. The headline finding

The platform has **substantial operational capability** and **almost no
economic-optimisation capability**.

It can record a transaction, move a consignment, and issue a policy. It cannot
answer the question the AEOS brief puts at the centre:

> *Is this farmer better off than they were, and by how much?*

Every one of the four economic engines is absent as a computational layer.

---

## 2. AEOS concepts vs code — measured

| AEOS concept | Services | Migrations | UI | Verdict |
|---|---|---|---|---|
| **Farmer Value Engine / FVI** | 0 | 0 | 0 | **ABSENT** |
| **Revenue Engine** | 0 | 0 | 0 | **ABSENT** |
| **Equipment rent/share/CHC** | 0 | 0 | 0 | **ABSENT** |
| **DBT integration** | 0 | 0 | 0 | **ABSENT** |
| **Bulk / group purchase** | 0 | 0 | 0 | **ABSENT** |
| **Rent-vs-buy economics** | 0 | 0 | 0 | **ABSENT** |
| **Unclaimed subsidy detection** | 0 | 0 | 0 | **ABSENT** |
| **Need-based UX entry** | 0 | 0 | 0 | **ABSENT** |
| Cost optimisation engine | 1 | 0 | 0 | name only |
| Resource optimisation | 1 | 1 | 0 | fragment |
| Farm digital twin | 0 | 2 | 0 | schema only, no logic |
| Contract farming / corporate | 0 | 1 | 0 | schema only |
| Procurement orchestrator | 3 | 1 | 0 | partial |
| Cash-flow forecast | 3 | 1 | 0 | partial |
| Cooperative engine | 3 | 5 | 1 | partial |
| Carbon credit | 4 | 4 | 0 | backend only |
| Household (LPG / PM-Kisan) | 4 | 5 | 0 | backend only |

**Eight concepts at absolute zero.** Seven of those eight are the mechanisms
that would actually move farmer income.

---

## 3. The binding constraint: the data does not exist

The Farmer Value Engine cannot be built on the current schema. Checked
directly against 51 migrations:

| Required for FVI | Status |
|---|---|
| Per-farmer cost ledger | EXISTS (`farm_consumables`) |
| Season / crop cycle | EXISTS (`crop_plans`, `crops`) |
| Input purchases by farmer | EXISTS |
| Subsidy eligibility per farmer | EXISTS (`subsidy_claims`) |
| **Per-farmer revenue ledger** | **MISSING** |
| **Yield actuals** | **MISSING** |
| **Farmer cash flow** | **MISSING** |
| **Price realisation per sale** | **MISSING** |
| **Equipment rental economics** | **MISSING** |

The platform records what a farmer **spends** and almost nothing about what
they **earn**. Half a P&L cannot produce a profit figure.

**This is the single most important finding in the analysis.** Every AEOS
objective — increase revenue, reduce cost, improve cash flow, increase farmer
wealth — is unmeasurable until the revenue side of the ledger exists. Building
the FVI on top of today's schema would produce a number that looks
authoritative and means nothing.

---

## 4. The deep-research-report, tested

The report names 22 backend services. **Four exist by name.** But name-matching
is the wrong test — checked by capability:

| Report claim | Named service exists | Capability exists | Reality |
|---|---|---|---|
| CartService | no | **yes** (4 svc) | in `orderService` |
| PaymentService | no | **yes** (24 svc) | spread across payment services |
| ReviewService | no | **yes** (20 svc) | in `marketplaceEnhancements` |
| ContractService | no | **yes** (10 svc) | in legal/enterprise control |
| InventoryService | no | **yes** (10 svc) | distributed |
| TraceService | no | **yes** (10 svc) | blockchain traceability |
| NotificationService | no | **yes** (7 svc) | distributed |
| **DiaryService** | no | **NO** | **genuinely absent** |
| **PlanningService** (crop calendar) | no | **NO** | **genuinely absent** |
| **ColdChainService** (slot booking) | no | **NO** | **genuinely absent** |
| **ProcurementService** (RFQ) | no | **NO** (schema only) | **genuinely absent** |
| **PricingService** (dynamic) | no | 1 svc | **near-absent** |

**Six genuine gaps**, not eighteen. The other twelve are naming drift, and
"fixing" them would create duplicate services.

Also genuinely absent from the report's list: **return-load matching**
(backhaul), **FIFO/FEFO inventory valuation**, and **automatic reorder rules** —
all three are direct cost-reduction mechanisms.

---

## 5. Master Domain Catalogue (D01–D100) coverage

Spot-checked against the schema. Broad coverage of operational domains
(D04–D31, D36–D39), and consistent absence across:

- **D47–D51** AI & Decision Intelligence — framework exists, 0 learning loop
- **D53** Data Platform — no warehouse, no MDM
- **D55–D56** Satellite / Drone — absent
- **D64** Carbon Credits — schema only, no accounting logic
- **D66** Government DPI — **all zero** (ONDC, Aadhaar, DigiLocker, Agmarknet, IMD, ISRO)
- **D79–D84** SecOps, Cloud, DevSecOps, Observability, DR — near-zero
- **D89, D99** Innovation Marketplace, Future Tech — absent

---

## 6. What to build, in dependency order

The ordering matters more than the list. Items 1–2 unblock everything else.

### Tier 1 — makes farmer value computable at all

1. **Farmer revenue ledger** (`farmer_sales`, `yield_actuals`,
   `price_realisation`). Without this nothing downstream can be calculated.
2. **Farmer cash-flow table** — inflow/outflow by date, the basis of the
   "improve cash flow" objective.

### Tier 2 — the Farmer Value Engine

3. **`farmer_value_index`** — seasonal cost, realised revenue, margin, and the
   deltas the brief names: potential savings, unclaimed subsidies, ROI of each
   recommendation. Built on the MCDA framework already in `core/mcda.js`, with
   the same data-provenance confidence weighting, so an FVI computed from
   estimated inputs is visibly weaker than one from measured inputs.
4. **Unclaimed-subsidy detector** — `subsidy_claims` and eligibility rules both
   exist; nothing joins them to say "you are eligible for X and have not
   claimed it." This is probably the highest rupee-per-hour-of-work item in the
   entire analysis.

### Tier 3 — the cost-reduction mechanisms

5. **Equipment rent/share/CHC platform** with rent-vs-buy economics
6. **Bulk / group purchase aggregation** — the cooperative engine's core
7. **Return-load matching** — empty trucks on the NE→NCR corridors already
   modelled in `freight_lanes`
8. **FIFO/FEFO valuation + reorder rules**

### Tier 4 — reach and revenue

9. **DBT integration** and government DPI (start with Agmarknet: free, public,
   and the only way "fair price" stops being self-referential)
10. **Farm diary, crop calendar, cold-chain slot booking, RFQ portal** — the six
    genuine gaps from the research report
11. **Need-based UX** — "What do you need today?" as the entry point rather
    than category navigation

---

## 7. A caution on the AEOS framing

The brief positions AFRERA as an Agricultural Economic Operating System whose
measure is farmer profitability. That is a good and unusually clear objective.

It also raises the bar for honesty. A system that tells a farmer "this decision
will earn you ₹18,000" is making a claim they will act on — planting differently,
borrowing, delaying a sale. If the number is derived from estimated inputs, or
from a schema that cannot see their actual revenue, it should say so plainly
rather than presenting a confident figure.

The existing MCDA layer already does this correctly: confidence is derived from
data provenance (`real` / `estimated` / `assumed`) rather than asserted. **The
Farmer Value Engine must inherit that discipline.** An FVI presented without
its provenance would be the most consequential fabricated number the platform
could produce — worse than the 37 `Math.random()` calls, because a farmer would
act on it.

---

## 8. Verification note

Every figure here was grep-tested against the repository on the stated date and
can be re-derived. Concepts were checked by capability and by name separately,
because name-only checking produced 12 false "missing" verdicts — the same error
mode recorded in `EBDESIGN_ALIGNMENT.md`.

Not verified: the 508 tables inside the .docx were extracted as text but not
individually analysed. If specific decisions are recorded in those tables rather
than in the prose, they are not reflected here.
