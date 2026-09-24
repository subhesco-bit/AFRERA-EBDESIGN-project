# Platform Baseline — Implementation Progress

Mapped against `PLATFORM_BASELINE_TODO.md` + engineering module notes.
**Nothing removed.** Status updated for work on `consolidated/final`.

## P0
| Item | Status |
|------|--------|
| 1 Auth one system | ✅ DONE (prior branch) |
| 2 Competing order tables | ✅ DONE (prior) |
| 3 Stock reservation | ✅ DONE (prior) + ecommerce checkout holds |
| 4 Production verification | ◐ Migrations/Jest still open on infra |

## P1
| Item | Status |
|------|--------|
| 5 Single source of truth | ◐ Hand registry + **code scanner** `/api/v1/baseline/registry/scan` |
| 6 State-driven workflows | ◐ O2C, RMA, CF, preseason, fulfillment; more FSMs open |
| 7 ERP unified control | ◐ COA, JE, trial balance, **three-way match**, **period close** |
| 8 Trust & reputation | ◐ **Trust engine** transaction/dispute adjusted |
| 9 Real data & analytics | ◐ **Business event bus** + verified metric defs only |

## P2
| Item | Status |
|------|--------|
| 10 India-first | ◐ Subsidy rules, mandi pricing layer, geo |
| 11 Rural offline | ☐ Still open |

## P3
| Item | Status |
|------|--------|
| 12 Adaptive page engine | ☐ Open (consent constraints documented) |
| 13 AI governance | ◐ **Model registry + governance status** |
| 14 Engineering | ◐ Structural/solar/MEP + **thermal first-pass**; CFD/BIM still notImplemented |

## New APIs
`/api/v1/baseline/*` — health, registry, scan, trust, events, metrics, erp, ai, thermal

```js
app.use('/api/v1/baseline', require('./routes/baselinePlatformRoutes'));
```

## Deliberately not faked
- CFD / full BIM / live IoT digital twin
- Full 1559 Jest green without CI run evidence
- Offline queue (needs client + conflict protocol)
- Adaptive personalization engine (needs consent ledger product work)
