# M041 — Village Registry

Domain: Village / Community Economic Operations
Status: IMPLEMENTED — persistence and frontend wiring completed

## Purpose

M041 is the canonical village registry layer. It maintains the village master
record used by village-level ERP and downstream agriculture, fisheries,
procurement, supply-chain, finance, impact and governance modules.

## Capabilities

- Village registration
- Stable village business code
- Village search and filtered listing
- Village profile retrieval
- Village updates
- Soft archival (status = archived)
- Geographic hierarchy fields: state, district, block, tehsil, gram panchayat
- Demographic data: population and households
- Economic indicators: average income and market distance
- Agriculture indicators: agricultural land, crops, irrigation and soil
- Infrastructure/service indicators: roads, electricity, schools, health centers,
  financial institutions and cooperatives
- Structured water sources, infrastructure and livestock data
- Community resource tracking through `village_resources`
- Village analytics and development-index calculation
- District-level village economic summary
- Authenticated API access

## Runtime API

```text
GET    /api/v1/backend-modules/M041/villages
GET    /api/v1/backend-modules/M041/villages/:villageId
POST   /api/v1/backend-modules/M041/villages
PUT    /api/v1/backend-modules/M041/villages/:villageId
DELETE /api/v1/backend-modules/M041/villages/:villageId
POST   /api/v1/backend-modules/M041/villages/:villageId/resources
GET    /api/v1/backend-modules/M041/villages/:villageId/analytics
```

## Persistence

The runtime source of truth is the existing `villages` table from
`012_governance_module.sql`, extended by
`053_village_registry_completion.sql`.

Community resources are stored in `village_resources` from
`9511_m041_m041.sql`.

The former conflicting M041 `model.sql` CREATE TABLE definitions have been
converted into a schema-reference document so they cannot create a competing
primary-key/type definition.

## Frontend

Canonical application page:

`frontend/src/pages/VillageRegistryPage.jsx`

API client:

`frontend/src/services/villageAPI.js`

The page supports registration, editing, archival, search, resource entry and
village analytics.
