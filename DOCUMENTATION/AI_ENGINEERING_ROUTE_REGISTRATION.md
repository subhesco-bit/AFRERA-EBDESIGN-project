# Route registration — AI Engineering Design + MEP

Add to `frontend/src/config/routes.js`:

```js
const AIEngineeringDesignPage = lazy(() => import('../pages/AIEngineeringDesignPage'));
const MEPDesignStudioPage = lazy(() => import('../pages/MEPDesignStudioPage'));
```

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
  keywords: 'mep, hvac, electrical, plumbing',
  transition: 'fade',
},
```

Backend (auto-mounted):

- `/api/v1/ai-engineering-team/*`
- `/api/v1/mep-design/*`
