# Dispute, Grievance & Trust Desk - SPEC

## Why
A marketplace without a dispute desk is incomplete - audit and governance
modules exist, but there is no buyer-seller-logistics grievance case
workflow tying evidence (photos, IoT temperature logs) to an SLA and an
outcome that actually affects a seller's standing.

## Stakeholders
- Buyer: short delivery, quality failure, late delivery, payment issue
- Seller/farmer/FPO: needs fair case handling, not silent penalty
- Platform operator: needs SLA visibility and consistent outcome codes

## Closed loop this module owns
case opened (typed: short_delivery | quality | delay | payment) -> evidence
attached (photos, IoT/cold-chain logs if relevant) -> SLA clock starts ->
outcome recorded with a fixed outcome-code vocabulary -> seller ranking
impact applied if outcome is against the seller.

## Real services already in the repo to build on
- Search existing audit/governance modules for a case-management pattern
  before inventing a new one - verify actual schema, don't assume from
  name alone.
- Quality Grading (M902100) evidence should be pullable directly into a
  quality-type case rather than re-uploaded.

## Not yet decided (flag before building)
- Outcome-code vocabulary and what "seller ranking impact" actually means
  numerically is a product decision, not something to invent unilaterally.
