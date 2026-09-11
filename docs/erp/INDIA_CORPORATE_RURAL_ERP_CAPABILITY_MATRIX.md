# India Corporate + Rural ERP Capability Matrix

This matrix defines the ERP boundary for the ChatGPT clone. It extends the existing ERP implementation rather than replacing it.

## Core enterprise ERP

| Domain | Capability | Existing platform | Accounting integration |
|---|---|---|---|
| FI/GL | Chart of accounts, GL accounts, journals, trial balance, P&L, balance sheet | Existing | Native |
| FI/AP | Supplier invoices, approval, posting, settlement, ageing | Added | Native |
| FI/AR | Customer invoices, receivables, ageing, settlement | Added | Native |
| FI/Tax | GST/IGST/CGST/SGST/UTGST, TDS, TCS transaction ledger | Added | Native |
| FI/Payments | Inbound/outbound payments, idempotency, settlement status | Added | Native |
| FI/Bank | Bank reconciliation and exception control | Added | Native |
| FI/Close | Period checklist and controlled close | Added | Native |
| FI/Budget | Budget, commitment and actual tracking | Added | Native |
| CO | Cost centres, profit centres, allocations and reporting | Existing | Native |
| MM | Material master, procurement, receipts, inventory | Existing | Native |
| SD | Customers, sales orders, delivery, invoicing | Existing | Native |
| PP | Production orders, release, confirmation, optimisation | Existing | Native |
| QM | Inspection lots, results, usage decisions | Existing | Native |
| PM | Equipment, maintenance orders, confirmation | Existing | Native |
| HR | Employees, organisation, payroll, AI analysis | Existing | Native |
| PS | Projects, WBS, status and AI analysis | Existing | Native |
| TR | Bank accounts, cash flows, cash position | Existing | Native |
| AM | Fixed assets and depreciation | Existing | Native |
| BI | Executive and profitability analytics | Existing | Native |

## India-specific control layer

- GST transaction classification and filing-period tracking.
- TDS/TCS transaction capture.
- Place-of-supply and state-code dimensions.
- INR as the default operating currency while preserving multi-currency support.
- Vendor/customer invoice lifecycle.
- Payment idempotency to prevent duplicate settlement.
- Bank reconciliation with explicit exceptions.
- Period-close checklist with trial-balance, tax, bank and subledger controls.
- Budget vs committed vs actual visibility.

Tax calculations must remain configurable and jurisdiction/version aware; the platform must not hard-code a tax rate where the applicable rule can change.

## Rural ERP dimensions

The same ERP ledger is capable of carrying rural attribution through:

- household
- village
- panchayat
- FPO/cooperative
- farmer
- farm/plot
- animal/poultry/fish unit
- contract-labour activity
- rural freelancer activity
- processing unit
- cold storage
- logistics activity
- rural enterprise

These dimensions are carried as explicit references/metadata where the existing core schema does not require a new foreign key, avoiding duplication of the enterprise ledger.

## Corporate ERP dimensions

- company/legal entity
- business unit
- cost centre
- profit centre
- project/WBS
- supplier
- customer
- bank account
- material/product
- asset
- employee
- tax/reporting period

## Required end-to-end financial flow

`Procure → Receive → Quality → Store → Process → Produce → Sell → Invoice → Collect/Pay → Reconcile → Post/Report → Close`

Every transaction-producing module should ultimately be attributable to an accounting event or an explicit non-financial event. This is the integration rule for future ERP enhancements.

## AI extension boundary

AI may analyse, forecast, classify, reconcile, detect anomalies and prepare recommendations. Autonomous posting, payments, tax filing, period close or other irreversible financial actions require policy-controlled authorization and a complete audit trail.
