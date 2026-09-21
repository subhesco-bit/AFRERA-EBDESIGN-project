# Village Issues & Integration

## Purpose

`M445110_VILLAGEISSUES` provides the missing operational layer for recording, prioritising, assigning, updating and closing village-level problems and unmet needs without creating a second village master.

## Authoritative village master

The existing `village_profiles` table remains authoritative. The new issue tables reference `village_profiles.village_id`.

## Issue lifecycle

`open → acknowledged → in_progress → blocked → resolved → closed`

`rejected` is available as a terminal alternative when an issue is determined not to be actionable.

## Categories

Infrastructure, water, electricity, roads, health, education, agriculture, fisheries, livestock, market, finance, livelihood, warehouse, logistics, digital connectivity, governance, environment, climate, emergency and other.

## API

Base path: `/api/v1/village-issues`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Filter and list issues |
| GET | `/summary/:villageId` | Village issue KPIs |
| GET | `/:issueId` | Retrieve one issue with village context |
| POST | `/` | Report a new issue |
| PATCH | `/:issueId` | Update issue fields/status |
| POST | `/:issueId/updates` | Add an auditable lifecycle update |

## Integration boundaries

- **Village Profile:** provides authoritative village identity and geography.
- **ERP / operations:** can consume issue status as an operational signal.
- **Risk:** critical/high issues can be used by the existing risk layer for assessment and escalation; this module does not create a competing risk register.
- **Emergency:** emergency-category issues can be routed to the existing emergency/control workflow.
- **AI:** issue records and history are structured for future prioritisation, summarisation, anomaly detection and decision support.
- **Supply chain:** agriculture, fisheries, warehouse and logistics issues can be associated with the same village and consumed by their existing operational domains.

## Data integrity

The migration validates priority, status, category, affected populations, cost and geographic coordinates. Issue updates are append-oriented history records, while the issue row represents the current state.

## Important implementation rule

Do not create a second village table or duplicate village identity. Extend the existing `village_profiles` authority and link operational data to it.
