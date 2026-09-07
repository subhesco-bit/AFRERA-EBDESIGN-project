# Module Strategy Framework

Shared reference for every agent implementing real business logic in the 67 `M0xx`
scaffold modules and the 82 boot-unblocking scaffold services/routes. Read this
before touching any file, so independent passes don't invent contradictory
interpretations of overlapping concerns. Condensed from a much larger platform
strategy brief — scoped here to what's actually implementable and verifiable in
this codebase today, not an aspirational multi-year roadmap.

## Every module gets a Strategy Card (in its README.md, replacing "Domain: TBD")

```
## Strategy Card
Purpose:      <one sentence — what real problem this solves>
Actors:       <who calls this — farmer/buyer/admin/system>
Decision:     <the actual decision or calculation this module makes>
Algorithm:    <the concrete formula/rule/scoring logic — not "AI will handle it">
Data:         <what's in the core_m0nn_items.data JSONB shape, or new columns if added>
AI role:      <none | assists (suggests, human confirms) | none-yet (flagged for later)>
Status:       real | partial (real logic, incomplete coverage) | scaffold (explicitly not yet real)
```

Every module must reach at least `real` or an honest `partial` — never leave
`scaffold` silently. If a module genuinely doesn't have enough context to
implement real logic, say so explicitly in the Strategy Card rather than
inventing something arbitrary to look complete.

## The decision/algorithm bar

A module is NOT done just because it has working CRUD endpoints. For each one,
answer concretely:

- What does this calculate, score, rank, match, or flag? (not just store)
- What's the actual formula or rule? Write it in code, not a comment saying "AI will optimize this."
- What triggers a state change, and what happens next?
- What's the failure/edge case (empty input, missing data, zero results)?

Examples of the bar, using this codebase's own existing patterns:
- `financialService.js`'s EMI generation — real amortization math, not a stub.
- `logisticsEnhancementService.js`'s temperature monitoring — real threshold checks against real sensor data.
- `aiService/recommendationBuilders.js` — structured, per-task mock responses with realistic computed fields (confidence scores, weighted calculations), not empty objects.

Match that bar. A scoring function should have real weights and real thresholds,
even if the weights are reasonable defaults rather than ML-trained — that's a
legitimate "real algorithm, simple version" that can be improved later, which is
categorically different from a function that just does `SELECT * FROM table`.

## AI's role — three honest tiers, use the right one per feature

1. **Deterministic** — a real formula/rule with no AI needed (interest calculations,
   eligibility thresholds, date math, unit conversions). Most of what you build
   should be this. Implement it as real code.
2. **AI-assisted** — genuinely benefits from an LLM call (e.g. classifying free-text
   user input, drafting a document, natural-language explanation of a decision).
   Route it through this repo's existing `aiAPI.generateRecommendation()` pattern
   (`backend/src/services/aiService/`) — add a new `task` case there if needed,
   following its existing structured-response style. Do not fabricate a new
   separate "AI Engine" file per feature; funnel through the one AI dispatcher
   this codebase already has.
3. **Not yet available** — the feature genuinely needs external infrastructure
   this sandbox doesn't have (live government data feeds, a trained ML model,
   real payment-gateway integration, real geospatial tile data). Build the real
   data model and a clearly-labeled "not yet configured" response (matching
   `productMediaAIService.js`'s honest-fallback pattern from earlier this
   session), not a fake response pretending the integration exists.

## Explicit non-goals for this pass (do not attempt)

These were described in the larger strategy brief but are out of scope for a
module-by-module implementation pass — they're cross-cutting platform
capabilities that would need their own dedicated design-and-build effort, real
external integrations, and legal/compliance review (especially anything
touching government scheme scraping, tax/GST filing, or financial
disbursement):

- Live scraping/monitoring of government websites for scheme changes
- A formal "Strategy Registry" enforcement system with organizational gates
- Real TCO/financing calculators tied to live interest rates
- A trust/reputation scoring system with fraud ML models
- GST/tax filing integration
- Any live payment disbursement logic

Where a module's real purpose touches one of these (e.g. a subsidy-tracking
module), model the DATA SHAPE realistically (scheme name, eligibility fields,
status lifecycle, source citation fields) so a real integration could be added
later, and implement the LOCAL logic that doesn't require the external
dependency (eligibility calculation against data already in the DB, status
tracking, deadline alerts against stored dates) — but don't fake the external
call itself.

## Cross-domain principle worth actually implementing: cite your reasoning

Where a module makes a recommendation or calculation with real inputs, return
*why* alongside the result — which inputs mattered, what the threshold was, what
the score components were. This is cheap to implement (you already have the
numbers) and is the one piece of the "trust/explainability" idea from the
larger brief that's genuinely achievable without new infrastructure: a
response shape like `{ result, reasoning: { factors: [...], threshold: X } }`
instead of a bare number.

## Verification (unchanged from the rest of this session)

`node --check` on every touched file. Confirm require paths for the post-L3
directory structure. Boot test on your assigned port. Don't touch files outside
your assigned domain batch.
