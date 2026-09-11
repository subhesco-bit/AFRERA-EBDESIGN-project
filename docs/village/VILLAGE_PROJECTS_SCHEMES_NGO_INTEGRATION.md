# Village Projects, Government Schemes, Other Schemes & NGO Works

## Purpose

This layer extends the village operational system so a village can be represented not only by its profile and issues, but also by every active or proposed development intervention operating in that village.

## Authoritative records

- `village_profiles` is the only village master.
- `government_schemes` is the verified government-scheme registry already present in the project.
- `village_initiatives` is the operational participation/execution layer.

No duplicate village table or duplicate government-scheme registry is introduced.

## Initiative types

- `project` — village/community project
- `government_scheme` — participation or implementation linked to a government scheme
- `other_scheme` — non-government scheme/programme
- `ngo_work` — NGO/community-development work
- `mixed` — intervention with multiple source types

## Source types

- government
- ngo
- other_scheme
- village
- private
- mixed

## Operational lifecycle

`proposed → planned → submitted → approved → active → completed`

Alternative states: `on_hold`, `cancelled`, `rejected`.

## Tracking

Each initiative can track:

- implementing partner
- funding source
- department/sponsor
- sector
- dates
- estimated, approved and spent amounts
- target and reached beneficiaries
- objectives
- progress updates
- milestones
- evidence/attachments
- beneficiary records

## Government schemes

A government initiative may reference `government_schemes.id`. This reuses the project's verified registry and allows village-level execution records to remain separate from the national/state scheme catalogue.

The system must never treat AI-generated scheme suggestions as verified government schemes; verification remains tied to the existing government scheme registry.

## NGO works

NGO work is represented as a village initiative with `initiative_type = 'ngo_work'` and `source_type = 'ngo'`. `implementing_partner` identifies the implementing organization without creating a second village master.

## Other schemes

Non-government/non-NGO programmes use `initiative_type = 'other_scheme'` and `source_type = 'other_scheme'`. Their sponsor/funding/partner details remain explicit in the initiative record.

## Integration

```text
village_profiles
      |
      +-- village_issues
      |
      +-- village_initiatives
              |
              +-- government_schemes (optional verified link)
              +-- beneficiaries
              +-- milestones
              +-- progress updates
              |
              +-- ERP / procurement / warehouse / logistics
              +-- risk / emergency
              +-- AI decision support
```

## API

```text
GET    /api/v1/village-initiatives
GET    /api/v1/village-initiatives/summary/:villageId
GET    /api/v1/village-initiatives/:initiativeId
GET    /api/v1/village-initiatives/:initiativeId/updates
GET    /api/v1/village-initiatives/:initiativeId/beneficiaries
GET    /api/v1/village-initiatives/:initiativeId/milestones
POST   /api/v1/village-initiatives
PATCH  /api/v1/village-initiatives/:initiativeId
POST   /api/v1/village-initiatives/:initiativeId/beneficiaries
POST   /api/v1/village-initiatives/:initiativeId/milestones
```

## Control principles

1. One authoritative village identity.
2. One verified government scheme registry.
3. Initiative execution is separate from scheme catalogue data.
4. Beneficiary participation is explicitly recorded.
5. Funding and expenditure are auditable.
6. Milestones and evidence are tracked.
7. AI can assist discovery and prioritisation but cannot fabricate verification.
8. Cross-module integrations should reference the initiative ID rather than create duplicate project records.
