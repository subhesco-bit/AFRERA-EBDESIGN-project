# AI Registry

**Generated:** 2026-08-04 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 15

---

- Agents: **15**
- Domains: **13**
- Signal types: **25**
- Correlation rules: **6**
- MCDA framework: **present**
- Propose-only (no self-execution): **enforced**
- Outcome feedback loop: **MISSING — agents cannot learn**
- Fabricated outputs (`Math.random()` in services): **34**

## Agents

| ID | Agent | Domain |
|---|---|---|
| AGT-FINANCE_CASHFLOW | finance.cashflow | FINANCE |
| AGT-FINANCE_RECEIVABLES | finance.receivables | FINANCE |
| AGT-PROCUREMENT_VENDOR_SELECTION | procurement.vendor_selection | PROCUREMENT |
| AGT-INVENTORY_REPLENISHMENT | inventory.replenishment | INVENTORY |
| AGT-INVENTORY_SLOW_MOVING | inventory.slow_moving | INVENTORY |
| AGT-SALES_DEMAND_FORECAST | sales.demand_forecast | SALES |
| AGT-QUALITY_NCR_TREND | quality.ncr_trend | QUALITY |
| AGT-MAINTENANCE_PREDICTIVE | maintenance.predictive | MAINTENANCE |
| AGT-AGRI_GLUT_WARNING | agri.glut_warning | AGRI |
| AGT-WORKFLOW_SLA_BREACH | workflow.sla_breach | WORKFLOW |
| AGT-CRM_LEAD_QUALIFICATION | crm.lead_qualification | CRM |
| AGT-LEGAL_OBLIGATION_WATCH | legal.obligation_watch | LEGAL |
| AGT-RISK_REGISTER_HEALTH | risk.register_health | RISK |
| AGT-EMERGENCY_INCIDENT_COMMAND | emergency.incident_command | EMERGENCY |
| AGT-COMPLIANCE_SOD | compliance.sod | COMPLIANCE |

## Signals

- `ORDER_PLACED` → `commerce.order.placed`
- `ORDER_CANCELLED` → `commerce.order.cancelled`
- `PAYMENT_RECEIVED` → `commerce.payment.received`
- `DEMAND_FORECAST_UPDATED` → `commerce.demand.forecast_updated`
- `PRICE_CHANGED` → `commerce.price.changed`
- `FRAUD_SUSPECTED` → `risk.fraud.suspected`
- `CREDIT_RISK_ASSESSED` → `risk.credit.assessed`
- `CLAIM_SUBMITTED` → `risk.claim.submitted`
- `TEMPERATURE_BREACH` → `iot.temperature.breach`
- `SENSOR_OFFLINE` → `iot.sensor.offline`
- `SHIPMENT_DELAYED` → `logistics.shipment.delayed`
- `QUALITY_FAILED` → `quality.test.failed`
- `RECALL_ISSUED` → `quality.recall.issued`
- `SHELF_LIFE_CRITICAL` → `quality.shelf_life.critical`
- `SOIL_RESULT_READY` → `agronomy.soil.result_ready`
- `CROP_DISEASE_DETECTED` → `agronomy.disease.detected`
- `WEATHER_ALERT` → `agronomy.weather.alert`
- `WORKFLOW_STARTED` → `control.workflow.started`
- `WORKFLOW_SLA_BREACHED` → `control.workflow.sla_breached`
- `LEAD_QUALIFIED` → `control.crm.lead_qualified`
- `OBLIGATION_DUE` → `control.legal.obligation_due`
- `RISK_CRITICAL` → `control.risk.critical`
- `EMERGENCY_RAISED` → `control.emergency.raised`
- `EMERGENCY_ESCALATED` → `control.emergency.escalated`
- `DECISION_MADE` → `platform.decision.made`

## Registries NOT present

- Prompt Registry
- Model Registry
- Agent Registry (as data — agents are a JS array)
- Tool Registry
- Memory Registry
- Dataset Registry
- AI Gateway / capability router
- Confidence calibration
- Bias / fairness checks
- Cost tracking
