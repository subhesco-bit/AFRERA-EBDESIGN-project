# Route registration — Platform Support Hub

```js
const PlatformSupportHubPage = lazy(() => import('../pages/PlatformSupportHubPage'));
```

```js
{
  path: '/platform-support',
  component: PlatformSupportHubPage,
  title: 'Platform Support Hub - AFRERA',
  description: 'Unified routing across Farmer Clinic, AI Engineering, and Value-Chain Studio',
  keywords: 'platform support, integration, farmer clinic, engineering',
  transition: 'fade',
},
```

Also register if missing:

- `/farmer-support-clinic` → FarmerSupportClinicPage
- `/ai-engineering-design` → AIEngineeringDesignPage
- `/mep-design` → MEPDesignStudioPage

Backend auto-mount: `/api/v1/platform-support/*`
