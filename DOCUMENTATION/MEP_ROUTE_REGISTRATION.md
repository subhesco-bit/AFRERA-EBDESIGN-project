# MEP Design Studio — route registration

Add these two snippets to `frontend/src/config/routes.js` if not already present.

## 1. Lazy import (near EngineeringProjectPage)

```js
const EngineeringProjectPage = lazy(() => import('../pages/EngineeringProjectPage'));
const MEPDesignStudioPage = lazy(() => import('../pages/MEPDesignStudioPage'));
```

## 2. Route entry (after `/engineering-projects`)

```js
{
  path: '/mep-design',
  component: MEPDesignStudioPage,
  title: 'MEP Design Studio - AFRERA',
  description: 'AI MEP Engineer support for Mechanical, Electrical and Plumbing design packages',
  keywords: 'mep, mechanical, electrical, plumbing, HVAC, design',
  transition: 'fade',
},
```

Backend routes auto-mount via `dynamicRouteLoader`:

- `GET /api/v1/mep-design/capabilities`
- `POST /api/v1/mep-design/plan`
- `POST /api/v1/mep-design/brief`

See `DOCUMENTATION/MEP_DESIGN_LAYER.md`.
