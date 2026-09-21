# Settlement, UPI & Payout Engine - SPEC

## Why - ranked #1 in the recommended build order
"Trust dies when 'sold' does not equal 'paid'." Offline-payment and revenue
modules exist in the repo, but there is no single owned workflow that takes
an order from delivery confirmation through to an actual UPI/NEFT payout in
the seller's account, with GST invoicing and FPO-member splitting.

## Stakeholders
- Farmer/FPO: needs certainty that a confirmed sale becomes a real payout
- Platform operator: needs GST-compliant invoicing on every settled sale

## Closed loop this module owns
order -> delivery confirmed -> quality hold (blocks payout until Quality
Grading / buyer inspection clears) -> payout initiated (UPI/NEFT) -> if FPO
sale, split across member ledger (M900100) -> GST invoice issued
(services/finance/gstService.js) -> failure retry if payout bounces.

## Real services already in the repo to build on
- 'services/finance/gstService.js' (225 lines, real) - invoice generation,
  do not reimplement GST logic here.
- 'services/legacy/escrowService.js' (339 lines) - if the sale was under a
  forward contract (M901100), release comes through here instead of a
  direct payout.

## Not yet decided (flag before building)
- Actual UPI/NEFT payout gateway integration is a real external-credential
  dependency (bank/PSP API keys) - this session's own discipline says not
  to fabricate that integration. Build the orchestration and ledger logic
  now; the actual bank rail call is a documented, explicitly-not-configured
  integration point until real credentials exist (matches the
  not_configured pattern already used elsewhere in this codebase, e.g.
  landRecordsService.js's fetchGovernmentLandRecords honesty fix).
