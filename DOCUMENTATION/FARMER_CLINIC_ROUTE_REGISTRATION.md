# Route registration — Farmer Support Clinic

Add to `frontend/src/config/routes.js`:

```js
const FarmerSupportClinicPage = lazy(() => import('../pages/FarmerSupportClinicPage'));
```

```js
{
  path: '/farmer-support-clinic',
  component: FarmerSupportClinicPage,
  title: 'Farmer Support Clinic - AFRERA',
  description: 'AI plant, soil, livestock, poultry and fish advisory triage for farmers',
  keywords: 'farmer clinic, plant doctor, veterinary, soil, poultry, fish',
  transition: 'fade',
},
```

Backend auto-mount: `/api/v1/farmer-support-clinic/*`
