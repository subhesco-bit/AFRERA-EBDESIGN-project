# ERP Integration — Gap Fill (Non-Generic)

## Adapters implemented

| Adapter | Protocol | Operations |
|---------|----------|------------|
| **ZohoBooksAdapter** | REST OAuth | contacts, items, invoices (dry_run + live) |
| **TallyXmlAdapter** | XML HTTP :9000 | ledger, stock item, sales voucher envelopes |
| **GspEInvoiceAdapter** | GSP REST | IRN Doc JSON (NIC-aligned fields), e-Way Bill |

## Sync engine
`POST /api/v1/ai-erp/integrate/sync`

Body example:
```json
{
  "module": "agro",
  "targets": ["zoho_books", "tally_xml"],
  "invoice_lines": [{ "name": "Seed", "qty": 10, "rate": 100, "hsn": "1209", "gst_card": "gst5" }],
  "party": { "name": "Buyer", "gstin": "29AAAAA0000A1Z5" },
  "own_gstin": "29BBBBB0000B1Z5",
  "supply_type": "intra",
  "generate_irn": true,
  "live": false
}
```

Default **dry_run** builds exact request payloads without posting.

## Preview helpers
- `POST /integrate/zoho/invoice/preview`
- `POST /integrate/tally/voucher/xml` → raw XML
- `POST /integrate/gsp/irn/preview` → IRP body

## Credentials (env)
- `ZOHO_ACCESS_TOKEN`, `ZOHO_ORGANIZATION_ID`
- `TALLY_URL` (default http://127.0.0.1:9000)
- `GSP_API_BASE`, GSP bearer, `SELLER_GSTIN`

## Standard
Idempotency keys, master-before-transaction order, CGST/SGST vs IGST, HSN on lines, dry-run by default, CA/GSP disclaimer retained.
