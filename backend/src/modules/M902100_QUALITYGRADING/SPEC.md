# Quality Grading & Assaying Lab Workflow - SPEC

## Why
GI/export and fair pricing depend on an actual grade-to-price link, not
listing text a seller writes themselves. Laboratory ERP and food-safety
module names exist in the repo, but nothing connects sample intake through
to a certificate that a price or a custody event can reference.

## Stakeholders
- FPO/farmer: gets objective grade, better price for better quality
- Buyer/exporter: trusts the grade for GI/export compliance
- Lab/grader: records parameters, issues certificate

## Closed loop this module owns
sample intake (crop, GI status, source lot) -> parameters recorded per
crop/GI standard -> grade computed -> certificate issued (immutable record)
-> certificate referenced by dynamic pricing (M188100) and by custody
events during logistics.

## Real services already in the repo to build on
- Search the repo for existing laboratory ERP / food safety / organic
  traceability modules before writing new parameter schemas - the
  recommendation doc notes these exist as fragments; verify their actual
  schemas first (do not assume from name alone, per project's own dead-
  code doctrine).

## Not yet decided (flag before building)
- Per-crop grading parameter sets are real domain data (moisture %, size,
  defect rate, etc.) - this needs real agronomic reference data, not
  invented placeholder thresholds.
