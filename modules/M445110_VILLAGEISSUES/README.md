# M445110 — Village Issues & Needs

**Domain:** Village / Community Operations  
**Status:** WIRED  
**Version:** 1.0.0

## Scope

Provides a persistent village-level operational issue and unmet-needs layer linked to the authoritative `village_profiles` entity.

## Existing-system integration

- `M445100_VILLAGEPROFILE` / `village_profiles` remains the village master.
- PostgreSQL persistence is provided by migration `061_village_issues_integration.sql`.
- API is exposed by `backend/src/routes/villageIssuesRoutes.js`.
- Business logic is in `backend/src/services/legacy/villageIssuesService.js`.
- Dynamic route discovery can mount the route without modifying the large central entrypoint.

## Core capabilities

- Issue reporting
- Category and priority
- Affected population / households
- Location and geospatial coordinates
- Assignment and ownership scope
- Lifecycle status
- Append-only issue updates
- Village KPI summary
- Filtering by village, block, district and state
- Integration-ready data for risk, emergency, agriculture, fisheries, warehouse and logistics workflows

## API

`/api/v1/village-issues`

- `GET /`
- `GET /summary/:villageId`
- `GET /:issueId`
- `POST /`
- `PATCH /:issueId`
- `POST /:issueId/updates`
