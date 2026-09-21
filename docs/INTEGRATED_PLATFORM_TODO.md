# Integrated Platform Delivery Checklist

## Completed in this release

- [x] Unified farmer product intake with AI marketing copy and optional image generation.
- [x] Deterministic nutrition reference, per-kg pricing, cold-chain, insurance, funding, subsidy, engineering, compliance, order, and audit handoffs.
- [x] Central quality-preserving token policy: compact context, structured output, bounded output, caching, deterministic-first processing, and regulated-action review gates.
- [x] Enterprise capability registry covering ERP/accounting, banking/funding, insurance, project management, CRM/commerce, analytics, communications, and health coding.
- [x] AI medical-coding workflows for clinicians/coders, dietitians, nutritionists, nutrient calculators/laboratories, and natural therapists.
- [x] Contextual placeholder contract that states stakeholder value, ERP data, AI assistance, workflow, and activation requirements.
- [x] Responsive product-value-chain and clinical-coding interfaces.
- [x] Backend tests and full frontend production build.

## Production activation — next priority

- [ ] Connect one authoritative provider per required capability; do not invoke every plugin for the same transaction.
- [ ] Configure consent, least-privilege roles, audit retention, idempotency keys, and approval matrices before enabling external writes.
- [ ] Load licensed/versioned ICD, CPT, HCPCS, SNOMED CT, and LOINC references for each operating jurisdiction.
- [ ] Connect accredited laboratory/nutrition databases; retain units, method, sample/date, source version, and reviewer provenance.
- [ ] Add live mandi/market, logistics, cold-room IoT, insurer, lender, subsidy, tax, payment, and ERP adapters.
- [ ] Execute end-to-end tests for farmer listing → buyer order → cold-chain fulfilment → insurance/finance → settlement/accounting.
- [ ] Run accessibility, localization, cultural/religious review, mobile-device, low-bandwidth, security, privacy, and disaster-recovery testing.

## Governance rules

- AI output is advisory and evidence-labelled; it cannot bind insurance, approve credit/subsidy, diagnose, prescribe, assign a final medical code, or submit a claim.
- Financial and external-system writes require explicit approval and idempotency protection.
- `OPENAI_API_KEY` is reused only from the runtime environment and is never returned to the browser, API response, logs, or repository.
- Provider selection is capability-based with graceful fallback; quality and safety gates take precedence over token savings.
