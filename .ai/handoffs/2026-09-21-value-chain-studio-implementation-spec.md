# HANDOFF: Value-Chain Studio — Implementation Spec

**For:** whichever agent (Claude/Devin/Codex) picks up work on `consolidated/final` next.
**From:** Claude session, 2026-09-21.
**Status:** Approved plan, implementation in progress (a parallel agent is already building this on this machine — check `backend/src/services/valueChainStudioService.js` and `backend/src/routes/valueChainStudioRoutes.js` for existing progress before starting from scratch).

## Push instructions (important)

**Push continuously as you go — do not batch everything into one commit at the end.** Commit and push after each meaningfully complete piece (e.g. after the backend orchestrator service, after the route file, after the frontend API client, after the frontend page), not just once at the very end. This lets other agents/teammates see progress and avoid duplicate work. Push to `subh-deep` (`https://github.com/subhesco-bit/SUBH-DEEP.git`), branch `consolidated/final` — **not** `AFRERA-EBDESIGN-project`, which is a separate, diverged repo that this project is no longer using as the canonical target.

---

# Value-Chain Studio

## Context

The platform has six real, DB-backed systems that already do the hard work (pricing, cold-chain, insurance, subsidies, compliance, product value scoring) but they're isolated — no single place shows a farmer/product's full lifecycle. The ask is one production-facing "value-chain studio" endpoint + page that orchestrates these into a transparent lifecycle plan: provenance-tagged data (verified vs. estimated), stakeholder handoffs, pricing math, cold-chain requirements, insurance/funding readiness, subsidy candidates, compliance gates, and deep links into the existing specialist pages. AI is scoped to exactly two things — product positioning copy and image generation — everything else is deterministic, calculated from real tables, and auditable.

Two exploration passes (see below) confirmed which existing services are real and mountable vs. stubs/dead code, so this plan reuses working code and does not rebuild anything.

## What already exists (reuse, do not rebuild)

| Concern | File | Status |
|---|---|---|
| Product value scoring | `backend/src/services/legacy/farmerValueService.js` (`computeFVI`, `detectUnclaimedSubsidy`) | real, mounted via `farmerValueRoutes.js` |
| Product value scoring | `backend/src/services/legacy/valueCommerceService.js` (`getValueFactors`, `calculateProductValueScore`, `calculateValueBasedPrice`, `generateValueRecommendations`) | real, **not mounted** (only reachable via dead `ORPHANED_SERVICES_MOUNT.js`) |
| Pricing | `backend/src/services/legacy/riskPricingService.js`, `dynamicPricingService.js`, `marketDataService.js`, `marketIntelligenceService.js` | real, mounted |
| Cold-chain | `backend/src/services/legacy/coldStorageService.js` (`createBooking`, `checkTemperatureCompliance`, `getCapacityPlanning`) | real, mounted |
| Insurance | `legacy/insurancePremiumService.js`, `insurancePolicyIssuanceService.js`, `insuranceFraudDetectionService.js` | real, mounted |
| Insurance claims | `legacy/insuranceClaimsService.js` | **stub** — do not use for claims readiness, only reference if a claim already exists |
| Subsidies | `legacy/governmentSchemeService.js` (`getSchemeByCode`, `checkSchemeEligibility`) | real DB queries, live only via `enterpriseAIRoutes.js` `/scheme-eligibility`; `setupRoutes()` full surface is dead |
| Subsidies | `farmerValueService.detectUnclaimedSubsidy` | real, different tables (`v_ne_organic_status`, `subsidy_claims`) — complementary, not duplicate, to governmentSchemeService |
| Compliance | `legacy/complianceService.js` | real but **tax-only** (GST/TDS) |
| Compliance | `backend/src/services/complianceTrackingService.js` (writes `compliance_records`) | real, generic — this is the one to use for compliance gates |
| AI positioning copy | `aiAPI.generateRecommendation()` in `legacy/aiBackboneService.js` | real, provider-agnostic, returns governed envelope with `provenance`/`actionBoundary: 'advisory_only'`; already used this way by governmentSchemeService |
| AI image generation | `backend/src/services/legacy/productMediaAIService.js` (DALL-E 3) | real, mounted via `productMediaAIRoutes.js` |
| Route auto-mounting | `backend/src/core/dynamicRouteLoader.js` | any `*Routes.js` under `backend/src/routes/` exporting an Express router auto-mounts at `/api/v1/<kebab-name>` |
| Frontend pattern to follow | `frontend/src/pages/AIProductStudioPage.jsx` + `frontend/src/services/productMediaAIAPI.js` | react-query + dedicated API client + `routes.js` entry — same shape to replicate, not extend (different concern) |

## Implementation approach

**1. Backend orchestrator service** — `backend/src/services/valueChainStudioService.js`
- One function, `buildLifecyclePlan({ productId, farmerId })`, that calls the real services above in parallel (`Promise.all`) and assembles a single response shaped as:
  ```js
  {
    provenance: { [fieldPath]: { source: 'db'|'calculated'|'estimated'|'ai', verified: bool, asOf } },
    pricing: { ...from dynamicPricingService/riskPricingService },
    coldChain: { ...from coldStorageService (requirements + compliance status) },
    insurance: { ...from insurancePremiumService (readiness), claims omitted/flagged-stub if claim data requested },
    subsidies: { schemeEligibility: [...governmentSchemeService.checkSchemeEligibility], unclaimed: [...farmerValueService.detectUnclaimedSubsidy] },
    compliance: { gates: [...complianceTrackingService reads on compliance_records for this entity] },
    valueScore: { ...valueCommerceService.calculateProductValueScore/getValueFactors },
    stakeholderLinks: [ { label, href } ]  // deep links to existing specialist pages, see table below
  }
  ```
- Every deterministic field carries a `provenance` entry; nothing numeric is invented — if a source service has no data, the field is `null` with `source: 'unavailable'`, not estimated by AI.
- Two narrow AI calls, isolated in their own functions so they're easy to audit/disable:
  - `generatePositioningCopy(productData)` → `aiAPI.generateRecommendation({ task: 'product_positioning_copy', parameters: {...} })` (existing function, existing pattern from governmentSchemeService)
  - `generateProductImage(prompt)` → delegates to existing `productMediaAIService`
- `valueCommerceService` is currently unmounted dead code from the router's perspective — this plan calls its exported functions **directly** (`require(...)`) rather than fixing its mounting, since the studio only needs the functions, not a public route for it.

**2. Backend route** — `backend/src/routes/valueChainStudioRoutes.js`
- `GET /api/v1/value-chain-studio/:productId` → calls `valueChainStudioService.buildLifecyclePlan`
- `POST /api/v1/value-chain-studio/:productId/positioning` → triggers the AI positioning-copy call on demand (not on every GET, to keep the base response deterministic/cheap)
- Auto-mounts via the existing `dynamicRouteLoader` — no changes to `index.js` needed.

**3. Stakeholder deep links**
Static map of `{ section: pageRoute }` resolved against `frontend/src/config/routes.js` entries that already exist for the specialist views (cold storage, insurance, government schemes, compliance) — confirm exact existing route paths while implementing (do not invent paths).

**4. Frontend page** — `frontend/src/pages/ValueChainStudioPage.jsx`
- New page following the `AIProductStudioPage.jsx` pattern: react-query call to a new `frontend/src/services/valueChainStudioAPI.js` client, a `routes.js` lazy-import entry (e.g. `/value-chain-studio/:productId`).
- Sections: lifecycle summary, pricing breakdown, cold-chain requirements, insurance/funding readiness, subsidy candidates, compliance gate checklist (each item shows verified/estimated badge from `provenance`), stakeholder handoff links, and an AI positioning/image panel reusing `productMediaAIAPI` for the image half.

## Scope expansion: engineering, shared infrastructure, rental/equipment

The studio must also surface these concepts, following the exact same real-service-only, provenance-tagged pattern as everything above — no shortcuts for this section. Candidate modules seen in the codebase (verify each before use, same as the table above — do not assume any of these are real/mounted without checking):
- Engineering: `modules/M712100_ENGINEERINGPROJECT/backend/service.js` and any `backend/src/services/*engineering*` file
- Shared infrastructure: `modules/M663100_SHAREDINFRA/backend/service.js`, and `sharedInfrastructureService` (referenced inside the dead `ORPHANED_SERVICES_MOUNT.js` — check if it has its own real route file elsewhere, same as governmentSchemeService did)
- Rental/equipment: `modules/M62100_EQUIPMENTEXCHANGE/backend/service.js`, `modules/M290100_MACHINERYACCESS/backend/service.js`, and any `backend/src/services/*rental*`/`*equipment*` files

For each: find the real service file, confirm whether it's mounted (check `backend/src/routes/` for a corresponding route file, and confirm the route is not one of the excluded/dead patterns like `ORPHANED_SERVICES_MOUNT.js`), extract its real exported functions (not stubs), and add a corresponding section to `valueChainStudioService.buildLifecyclePlan`'s response (`engineering`, `sharedInfrastructure`, `equipmentRental`), each with its own `provenance` entries, following the identical pattern used for pricing/coldChain/insurance/subsidies/compliance above. Add matching sections to the frontend page and stakeholder deep links for whichever of these turn out to have their own existing specialist pages in `frontend/src/config/routes.js`.

If a candidate module turns out to be a stub/skeleton (hardcoded returns, no real DB queries) rather than real, exclude it from the studio and note that explicitly in your final report — do not wire in fake data just to fill out this section.

## Explicit non-goals (per the deterministic requirement)

- No AI-estimated numbers anywhere in pricing, insurance, subsidy amounts, or compliance status — those are DB-sourced or `null`.
- Do not build on `insuranceClaimsService.js` (confirmed stub) for anything claims-readiness related.
- Do not attempt to fix/mount `ORPHANED_SERVICES_MOUNT.js` wholesale — it bundles 9 services, most out of scope; only the specific functions this feature needs are imported directly.

## Verification

1. Backend: `cd backend && npm run dev`, confirm `/api/v1/value-chain-studio/:productId` auto-mounts (check startup log for the route), hit it with a known `productId`/`farmerId` from seeded data, verify every numeric field has a matching `provenance` entry and no field is silently AI-generated.
2. Frontend: `cd frontend && npm run dev`, navigate to the new page, confirm each section renders real data (not placeholders) and stakeholder links resolve to the correct existing pages.
3. Confirm the two AI calls (`generatePositioningCopy`, product image) work when an AI provider key is configured, and degrade to `status: 'unavailable'` (not fabricated data) when none is configured — matches `aiBackboneService`'s existing behavior.
