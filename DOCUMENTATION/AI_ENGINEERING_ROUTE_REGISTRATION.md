# Route registration — AI Engineering Design + MEP

Apply these edits to `frontend/src/config/routes.js` (file is large; paste carefully).

## 1. Lazy imports (next to EngineeringProjectPage)

```js
const EngineeringProjectPage = lazy(() => import('../pages/EngineeringProjectPage'));
const MEPDesignStudioPage = lazy(() => import('../pages/MEPDesignStudioPage'));
const AIEngineeringDesignPage = lazy(() => import('../pages/AIEngineeringDesignPage'));
```

## 2. Route entries (after `/engineering-projects`)

```js
{
  path: '/ai-engineering-design',
  component: AIEngineeringDesignPage,
  title: 'AI Engineering Design Team - AFRERA',
  description: 'Team of AI engineers for agri-infrastructure design packages',
  keywords: 'ai engineering, design team, structural, mep, compliance',
  transition: 'fade',
},
{
  path: '/mep-design',
  component: MEPDesignStudioPage,
  title: 'MEP Design Studio - AFRERA',
  description: 'Mechanical, Electrical, Plumbing design support',
  keywords: 'mep, mechanical, electrical, plumbing, HVAC, design',
  transition: 'fade',
},
```

## Backend (already auto-mounted)

- `/api/v1/ai-engineering-team/*`
- `/api/v1/mep-design/*`

## Value-Chain Studio handoffs (already in service)

Lifecycle plan `handoffs` and `stakeholderLinks` include:

- AI Engineering Design → `/ai-engineering-design`
- MEP Design Studio → `/mep-design`
