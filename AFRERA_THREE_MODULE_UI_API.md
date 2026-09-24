# Three-Module API · UX · UI · Middleware · Interlink

## Backend

| Piece | Path |
|-------|------|
| Gateway middleware | `backend/src/middleware/threeModuleGateway.js` |
| Route registry | `backend/src/routes/threeModuleRegistry.js` |
| Mount helper | `backend/src/bootstrap/mountThreeModules.js` |

Middleware: correlation ID, JSON envelope, rate limit, security headers, module tags, error handler.

```js
const { mountThreeModules } = require('./src/bootstrap/mountThreeModules');
mountThreeModules(app);
```

## API map

| Module | Enhanced |
|--------|----------|
| Veterinary | `POST /api/v1/veterinary-enhanced/enhanced` |
| Nutrition | `POST /api/v1/nutrition-enhanced/enhanced` |
| Agro | `POST /api/v1/agro-farming/enhanced` |
| Unified | `POST /api/v1/unified-intelligence/operate/enhanced` |
| ERP/GST | `/api/v1/ai-erp/*` |
| Catalogue | `GET /api/v1/three-modules/catalogue` |

## Frontend SPA

`frontend/three-modules/` — dark industry shell

| Route | Page |
|-------|------|
| `#/` | Home dashboard |
| `#/veterinary` | Case intake → enhanced → decision/viz/audio |
| `#/nutrition` | Profile → conference |
| `#/agro` | Crop/field → enhanced |
| `#/unified` | All pillars |
| `#/erp` | Financial + operational ERP |
| `#/bus` | Inter-module events |

Serve at **`/app/`** after mount.

## Interlink UX
Each page has **Continue** links (zoonotic→nutrition, soil→diet, treatment→ERP, etc.).
API client attaches **X-Correlation-Id**; UI shows corr badge.

## Standards
- Accessibility: skip link, aria meter, focus main
- TTS speak button (EN/HI)
- Responsive sidebar
- No generic empty shells — every page calls real enhanced endpoints
