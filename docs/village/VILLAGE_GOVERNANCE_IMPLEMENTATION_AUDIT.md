# Village Governance Implementation Audit

## Scope

Implemented the missing village-level governance integration requested for Panchayat, Village Council and Groups while preserving existing module boundaries.

## Existing capabilities retained

- `village_profiles` remains the authoritative village master.
- Existing `panchayats` table remains the Panchayat master.
- Existing `panchayat_schemes` remains available for Panchayat-managed schemes.
- Existing M046 SHG and M048 Producer Group modules are not replaced.
- Existing cooperative records are not copied into a new cooperative master.

The repository already documents Panchayat as M042, SHG as M046, Cooperative as M047 and Producer Group as M048. The new registry is therefore intentionally cross-cutting rather than a competing specialist module.

## New integration entities

| Entity | Purpose |
|---|---|
| `panchayat_village_links` | Explicit relational Panchayat-to-village jurisdiction/service relationship |
| `village_councils` | Traditional, indigenous, statutory/community or other village council |
| `village_council_members` | Council membership and roles |
| `village_group_registry` | Unified village-level group registry/linkage |
| `village_group_members` | Group membership and roles |

## Group model

Supported group classifications include SHG, Producer Group, Cooperative, Farmer Group, Fisher Group, Women Group, Youth Group, Artisan Group, Water User Group, Forest Group, Livelihood Group, Community Group and Other.

Where a specialist module already owns the group, `source_module` and `source_id` identify that authoritative record. This prevents duplicate group masters.

## Governance model

```text
Authoritative Village
        |
        +-- Panchayat jurisdiction
        |
        +-- Village Council
        |     +-- Members
        |
        +-- Community Groups
        |     +-- Members
        |
        +-- Projects / Schemes / NGO Works
        |
        +-- Issues / Needs
        |
        +-- ERP / Risk / Emergency / AI
```

## Security model

All new API routes require the existing authentication middleware. Mutating governance operations additionally use the existing administrative middleware. Member identities reference the existing `users` table.

## Data integrity

- Foreign keys connect governance records to the authoritative village and user records.
- Partial unique index permits one primary Panchayat jurisdiction per village.
- Lifecycle and classification values are constrained.
- Membership dates are validated.
- Group member counts are maintained transactionally when membership is added/updated.

## Runtime validation requirement

The implementation is committed to the development branch. Database migration execution, API integration tests and frontend runtime validation must be executed in the deployment environment before the capability is classified as production-certified.
