# AFRERA Insurance — Corporate Risk & Coverage Platform

**Not** a retail insurance shop selling policies as an insurer.  
**Is** a corporate / ecosystem insurance **management & support** layer for:

- Employees (group health / accident style covers)
- Assets (cold storage, warehouses, plant & machinery)
- Liabilities
- Vehicles & fleet
- Transit / cargo
- Credit insurance
- Farmer-linked covers (crop, livestock, input) as **risk objects** under corporate or scheme-aligned programmes

**PolicyBazaar-like support features** (compare, track claims, documents, renewals, reminders) — without claiming to be the underwriter or IRDAI product issuer.

---

## Positioning

| Role | AFRERA Insurance layer |
|------|-------------------------|
| Underwriter / insurer | External licensed insurer / scheme |
| This platform | Policy inventory, eligibility mapping, claim intake support, document vault, renewal calendar, comparison of cover options, ERP hooks |
| Users | Enterprise HR, fleet/logistics ops, cold-storage operators, FPOs, farmers as covered persons/assets |

**Safety floor:** All quotes and comparisons are **decision-support**. Binding cover only via licensed insurer / intermediary / government scheme channels.

---

## Cover classes (corporate + ecosystem)

1. **Employee** — group health, personal accident, term (corporate)
2. **Asset** — building, plant, cold-room equipment, stock-in-warehouse
3. **Liability** — public liability, product liability (FSSAI-linked ops)
4. **Vehicle / fleet** — motor own-damage + third party (ops fleet)
5. **Transit** — inland transit, cargo, temperature-controlled transit
6. **Credit** — trade credit / counterparty default (B2B receivables)
7. **Farmer-linked** — crop / livestock / input risk objects (scheme or master policy), not retail “buy PMFBY here”

---

## PolicyBazaar-style support capabilities

- Cover catalogue & comparison (sum insured, premium proxy, exclusions hint)
- Policy register (corporate book of covers)
- Claim FNOL + status timeline (support desk, not insurer settlement authority)
- Document checklist & vault metadata
- Renewal / expiry calendar
- Integration points: ERP assets, logistics shipments, cold-storage bays, farmer layer risk objects

---

## Layer boundaries

- **Not Ecommerce:** insurance is not a cart SKU checkout for retail policies.
- **Not Farmer subsidy engine:** scheme eligibility stays in Farmer layer; insurance layer may **link** a risk object to a cover.
- **Bridge:** shipment id → transit cover; asset id → asset cover; employee id → group cover.

---

## API

`/api/v1/insurance-corporate/*` (and research-grade capability `insurance_corporate_*`)
