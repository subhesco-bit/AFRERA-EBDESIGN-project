# Frontend ↔ Backend API Contract Drift

**Generated:** 2026-08-04 by `tools/frontend-boundaries.js`
**Status:** DESCRIPTIVE — measured from source.
**Do not edit by hand.**

---

The frontend calls **70** distinct API endpoints by raw fetch().
**15** have no matching backend route.

A call to a route that does not exist returns 404. The page renders empty
and logs to a console nobody is watching — so the screen looks "built"
while showing nothing. This is the most expensive kind of gap to find late.

## Endpoints with no backend route

- `/api/v1/blockchain-traceability/traceability-events/${productId}${batchNumber `
- `/api/v1/blockchain-traceability/chain-of-custody/verify/${productId}${batchNumber `
- `/api/v1/insurance/calculate/${type}`
- `/api/v1/predictive-analytics/predictions/${productId}/product`
- `/api/v1/analytics/platform-stats`
- `/api/v1/admin/audit/recent`
- `/api/v1/banker/portfolio`
- `/api/v1/banker/risk-dashboard`
- `/api/v1/ca/audit-stats`
- `/api/v1/fpo/stats`
- `/api/v1/government/scheme-analytics`
- `/api/v1/government/compliance-status`
- `/api/v1/research/stats`
- `/api/v1/subsidy/stats`
- `/api/v1/subsidy/pending`

## Mounted API prefixes (backend)

- `/api/v1/auth`
- `/api/v1/products`
- `/api/v1/orders`
- `/api/v1/financial`
- `/api/v1/logistics`
- `/api/v1/insurance`
- `/api/v1/ai`
- `/api/v1/erp`
- `/api/v1/multilingual`
- `/api/v1/organic-traceability`
- `/api/v1/nutrition-intelligence`
- `/api/v1/conversational-ai`
- `/api/v1/laboratory-erp`
- `/api/v1/gi-intelligence`
- `/api/v1/food-intelligence`
- `/api/v1/value-commerce`
- `/api/v1/consumer-health`
- `/api/v1/voice-ai`
- `/api/v1/blockchain-traceability`
- `/api/v1/knowledge-graph`
- `/api/v1/predictive-analytics`
- `/api/v1/iot-integration`
- `/api/v1/ar-vr`
- `/api/v1/sms-auth`
- `/api/v1/advanced-voice`
- `/api/v1/offline-payment`
- `/api/v1/advanced-ai`
- `/api/v1/offline-sync`
- `/api/v1/indigenous-knowledge`
- `/api/v1/biodiversity`
- `/api/v1/ai-copilot`
- `/api/v1/omnichannel-ai`
- `/api/v1/food-safety`
- `/api/v1/shelf-life`
- `/api/v1/institutional-procurement`
- `/api/v1/digital-product-passport`
- `/api/v1/recipe-intelligence`
- `/api/v1/forms`
- `/api/v1/analytics`
- `/api/v1/modules`
- `/api/v1/ne-intelligence`
- `/api/v1/commerce-rules`
- `/api/v1/catalog-intelligence`
- `/api/v1/control`
- `/api/v1/intel`
- `/api/v1/value`
- `/api/v1/merchandising`
- `/api/v1/marketplace`
- `/api/v1/insurance`
- `/api/v1/farmer-portal`
- `/api/v1/governance`
- `/api/v1/logistics`
- `/api/v1/advanced`
- `/api/v1/gst`
- `/api/v1/logistics-ops`
- `/api/v1/farmers`
- `/api/v1/admin/audit`
- `/api/v1/vendors`
