# AFRERA Value-Chain Control Plane — Blueprint, Gaps, Enhancements, Grok Recommendations

**Branch:** `consolidated/final`  
**Status:** Development skeleton (kernel), not full production OS  
**Rule:** VCS owns lifecycle; specialist modules own transactions. No LLM numbers.

---

## 1. Extracted missing points (from architecture review)

### 1.1 Structural gaps
| ID | Missing point | Severity |
|----|---------------|----------|
| M01 | `value_chain_case` as root envelope (not product-centric) | P0 |
| M02 | Configurable lifecycle **graph** + commodity templates | P0 |
| M03 | Field-level **provenance / DataAssertion** | P0 |
| M04 | Versioned **calculation registry** | P0 |
| M05 | **Mass-balance / transformation ledger** | P0 |
| M06 | Multi-ledger pricing (price/cost/margin/tax/settlement) | P1 |
| M07 | Formal **gate engine** (blocking requirements) | P0 |
| M08 | Stakeholder **custody handoffs** protocol | P1 |
| M09 | **Exception** subsystem (shortfall, temp excursion, etc.) | P1 |
| M10 | Subsidy as scheme **rule engine** + status pipeline | P1 |
| M11 | Insurance as **readiness matrix**, not duplicate engine | P1 |
| M12 | Funding stack (equity/grant/subsidy candidate/loan/WC) with subsidy not counted as cash | P1 |
| M13 | Cold chain as **capacity network** math → shared infra / Engineering OS | P1 |
| M14 | Specialist **adapters** + context capsules (deep links) | P0 |
| M15 | Event catalogue + eventual saga compensation | P2 |
| M16 | Immutable **gate snapshots** for audit/bank | P1 |
| M17 | Scenario Studio (forked calculation state) | P2 |
| M18 | Programme → portfolio → case hierarchy | P2 |
| M19 | Evidence taxonomy beyond 4 labels (AUTHORITATIVE…CONFLICTED) | P1 |
| M20 | Integration forensics registry (LIVE/STUB/…) before adapters | P0 |
| M21 | AI firewall (generative zone ≠ authoritative zone) | P0 |
| M22 | Demand-backward production planning | P2 |
| M23 | Decision records when adopting a scenario | P2 |
| M24 | ABAC + geography + case-scoped permissions | P2 |
| M25 | Exception SLA / financial exposure tracking | P2 |

### 1.2 Enhancements to adopt
| ID | Enhancement |
|----|-------------|
| E01 | Computational Integrity: VERIFIED / OBSERVED / CALCULATED / ESTIMATED only |
| E02 | Price waterfall expandable to formula + evidence |
| E03 | Readiness **matrix** not single % score |
| E04 | Direct specialist links with `case_id` context |
| E05 | AI limited to positioning + imagery |
| E06 | Compose FPO, WRS, trade-escrow, cold, engineering — do not reimplement |
| E07 | Snapshot at gates for reproducible economics |
| E08 | Template registry (spice, dairy, fisheries, grain, bamboo, …) |

### 1.3 Explicit non-goals (defer)
- Generative FEA/CFD as authoritative engineering  
- LLM eligibility / premium / yield inventing  
- Full digital twin prerequisite for first VCS path  
- Replacing Village ERP / Marketplace / Finance modules  

---

## 2. Grok recommendations (integration priority)

1. **Build kernel only** — case, graph nodes, gates, assertions, calc registry, mass balance, price waterfall, adapter interfaces.  
2. **Run integration forensics** before claiming adapters LIVE.  
3. **Wire existing LIVE systems first:** FPO ops, warehouse receipts, multi-party trade escrow, cold storage, engineering/MEP BOQ.  
4. **One vertical commodity** (e.g. NE spice/horticulture) before template explosion.  
5. **Reject L3 “Claude-first 48-week gap roadmap” as VCS sequencing** — use only for defect cleanup (fabricated randoms, orphan routes).  
6. **Settlement + escrow residual → FPO payout** is the money spine; VCS only orchestrates status.  
7. **Every number in API response** must include `evidenceClass` + `source` or `calculationId`.  
8. **Skeleton code must throw/honest-empty** when specialist is STUB — never invent ₹ or MT.  

---

## 3. Skeleton layout (this commit)

```text
backend/src/value-chain-control/
  caseService.js
  gateEngine.js
  assertionService.js
  calculationRegistry.js
  massBalanceEngine.js
  priceWaterfallEngine.js
  adapters/index.js          # contracts + LIVE hooks where available
  orchestrationService.js    # compose case plan

backend/src/routes/valueChainControlRoutes.js
backend/src/database/migrations/20260921_value_chain_control_plane.sql
DOCUMENTATION/VCS_CONTROL_PLANE_BLUEPRINT.md  (this file)
```

Legacy `valueChainStudioService.js` remains; control plane is the **orchestration kernel** above it.

---

## 4. Development sequence (skeleton → vertical)

| Step | Work |
|------|------|
| S1 | Apply migration; mount routes |
| S2 | Create case from template; list nodes/gates |
| S3 | Register formulas; run mass balance + waterfall on declared inputs only |
| S4 | Adapter: link FPO lot / WR / escrow ids onto case |
| S5 | Snapshot gate G5 |
| S6 | UI mission-control (later) |
