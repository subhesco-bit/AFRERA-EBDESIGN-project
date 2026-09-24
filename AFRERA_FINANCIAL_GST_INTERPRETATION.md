# Financial ERP · Accounts · GST · One-Runtime Interpretation

## Accounting
- Chart of accounts (cash, bank, AR/AP, inventory, GST payables, income, expense)
- Journal entries (balanced check)
- Trial balance · P&L

## GST (India-oriented)
- Rate cards 0 / 5 / 12 / 18 / 28 (illustrative — verify CBIC)
- CGST+SGST (intra) / IGST (inter)
- Tax invoice with HSN/SAC hints per module (vet / nutrition / agro)
- GST liability snapshot

## One-runtime interpretation
Single pass after domain analysis:
1. Clinical/domain decision + confidence
2. Money impact hints (disease cost, certification cost, consult revenue)
3. Optional GST invoice preview
4. Suggested journals
5. Human narrative + viz/audio

## APIs
```http
GET  /api/v1/ai-erp/finance/coa
GET  /api/v1/ai-erp/finance/dashboard/agro
GET  /api/v1/ai-erp/finance/trial-balance?module=veterinary
GET  /api/v1/ai-erp/finance/pnl?module=nutrition
GET  /api/v1/ai-erp/finance/gst?module=agro
POST /api/v1/ai-erp/finance/gst/compute
POST /api/v1/ai-erp/finance/invoice
POST /api/v1/ai-erp/finance/journal
POST /api/v1/ai-erp/interpret/once
```

Enhanced three-module calls now include `erp.financial` + `interpretation` automatically.

**Not a CA product** — rates/HSN must be verified; file returns via GSTN with a practitioner.
