# Contract Farming & Forward Trade - SPEC

## Why
Stabilizes price risk for both farmer and buyer. Lenders and FPOs need a
real forward-contract record to underwrite against. This is almost entirely
absent today - only the escrow primitive exists, with no contract wrapper
around it.

## Stakeholders
- Farmer/FPO: commits acreage/qty, wants price certainty
- Buyer/processor/exporter: wants supply certainty, quality assurance

## Closed loop this module owns
contract created (acreage, qty, quality clauses, price, milestones) ->
harvest milestone recorded -> quality check (links Quality Grading) ->
escrow release triggered per milestone (real: services/legacy/escrowService.js)
-> breach/dispute flag if a milestone is missed or quality fails (links
Dispute Desk) -> contract closed on final delivery.

## Real services already in the repo to build on
- 'services/legacy/escrowService.js' (339 lines per its own module.json
  migration analysis) - real milestone-capable escrow primitive. This
  module should call it, not reimplement escrow logic.

## Not yet decided (flag before building)
- Contract template storage - new table, or reuse an existing document/
  agreement table if one exists under M501100_IDENTITYMANAGEMENT's KYC/
  consent infrastructure?
