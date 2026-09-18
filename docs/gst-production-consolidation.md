# GST production consolidation

The authoritative implementation is `backend/src/services/finance/gstService.js` and the
authoritative HTTP surface is `backend/src/routes/finance/gstRoutes.js`. The former legacy
service is now a compatibility import, and module M695100 delegates directly to the canonical
service. This retains import compatibility without maintaining parallel tax implementations.

The canonical service carries forward the prior HSN and branded-package classification,
durable invoice and ledger posting behavior. It adds GSTIN checksum and state-code validation,
effective-date HSN rate resolution, deterministic two-decimal CGST/SGST/IGST allocation,
exempt and reverse-charge treatment, validated return/payment creation, and locked workflow
transitions. Filing and rate/payment mutations require finance or administrator roles.

Tax rates remain data, not source-code assertions. A filing must use a matching active
`gst_rates` record for its supply date. Missing classifications fail for review rather than
silently selecting an invented rate. The category map remains only for compatibility callers.
