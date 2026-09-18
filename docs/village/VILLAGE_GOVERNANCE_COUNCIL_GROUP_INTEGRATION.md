# Village Governance, Panchayat, Village Council & Group Integration

## Purpose

This document defines the village-level governance layer added to the existing Village ERP architecture.

## Authoritative hierarchy

```text
State
  -> District
    -> Block
      -> Panchayat / Local Government
        -> Village (village_profiles = authoritative village master)
          -> Village Council (where applicable; distinct from Panchayat)
          -> Community Groups
          -> Village Projects / Schemes / NGO Works
          -> Village Issues / Needs
```

## Panchayat

The existing `panchayats` table remains authoritative. It is enriched with code, type and lifecycle status rather than replaced.

`panchayat_village_links` provides explicit relational jurisdiction/service-area links to `village_profiles`, replacing reliance on the legacy JSON `villages` field for operational joins.

## Village Council

`village_councils` represents a village-level council that may coexist with a statutory Panchayat. Supported classifications include:

- village council
- traditional council
- indigenous council
- community council
- other

Recognition is modelled separately from council type so customary/community institutions are not incorrectly treated as statutory bodies.

Council membership is persisted in `village_council_members`.

## Community Groups

`village_group_registry` is a cross-cutting registry, not a replacement for specialist modules. It supports:

- SHG
- Producer Group
- Cooperative
- Farmer Group
- Fisher Group
- Women Group
- Youth Group
- Artisan Group
- Water User Group
- Forest Group
- Livelihood Group
- Community Group
- Other

Existing specialist group records can be linked through `source_module` and `source_id`. This prevents duplicate authoritative SHG/Producer/Cooperative records while still allowing a unified village-level view.

Membership is persisted in `village_group_members`.

## APIs

Base route: `/api/v1/villageGovernanceRoutes`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/panchayats/:panchayatId/villages/:villageId/link` | Link village to Panchayat |
| GET | `/villages/:villageId/panchayats` | List village Panchayats |
| POST | `/villages/:villageId/councils` | Create village council |
| GET | `/villages/:villageId/councils` | List village councils |
| POST | `/councils/:councilId/members` | Add/update council member |
| GET | `/councils/:councilId/members` | List council members |
| POST | `/villages/:villageId/groups` | Create/link community group |
| GET | `/villages/:villageId/groups` | List village groups |
| POST | `/groups/:groupId/members` | Add/update group member |
| GET | `/groups/:groupId/members` | List group members |
| GET | `/villages/:villageId/summary` | Unified governance summary |

## Data integrity rules

1. No second village master is permitted.
2. Panchayat and village council are separate institutional concepts.
3. Group registry is cross-cutting and may reference specialist modules.
4. User identities use the existing `users` table.
5. Membership changes are persisted, not held only in JSON.
6. Primary Panchayat jurisdiction per village is enforced by a partial unique index.
7. Dates and lifecycle values are constrained at database level.
8. Existing records are not copied into parallel tables merely to support the new view.

## Integration targets

The governance layer is designed to feed:

- village issues and needs
- village projects and schemes
- government programmes
- NGO works
- CSR/impact projects
- agriculture and fisheries programmes
- procurement and supply-chain participation
- risk and emergency escalation
- AI decision support
- village dashboards and reporting

## Status

Schema, service and API route implementation added on the village integration development branch. Runtime database migration and end-to-end tests must be executed in the target deployment environment before production certification.
