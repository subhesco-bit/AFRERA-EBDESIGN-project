# Source concept reconciliation — 2026-09-15

## Scope and authority

The four external text files are treated as design evidence and proposal history. They do not override the repository protocol, security controls, database migrations, or tested runtime behavior.

| Source | Role in this pass |
| --- | --- |
| `deep seek.txt` | Product and operating-model proposals, especially single-source master data and shared enterprise objects |
| `coding 1.txt` | Historical workspace and implementation transcript; useful for provenance, not an executable specification |
| `coding 2.txt` | Migration backlog, component-library proposals, and the task-ledger concept |
| `coding 3.txt` | Geo Intelligence and Smart Tracking Enterprise proposal and shared location-service recommendation |

## Reconciled concepts

| Concept | Repository evidence | Decision / status |
| --- | --- | --- |
| One source of truth per domain object | `.ai/AGENT_PROTOCOL.md`, `docs/codex-feature-merge-matrix.md` | Adopted as the canonicalization rule. Compatibility files may delegate, but cannot contain parallel business logic. |
| Preserve prior work in the library | `_EBDESIGN_LIBRARY/_CONTROL/SAFETY_CONTRACT.md` | Adopted. Each consolidation records sources, decisions, retained capabilities, and verification in a library transaction. Git remains the recoverable source history. |
| Central Geo Intelligence service | `backend/src/services/geofencingService.js`, `backend/src/utils/geo.js`, driver-location migrations, mounted geofencing routes | Partially implemented. Circular zone definition, entry/exit detection, manual location verification, current occupancy, and driver-arrival checks are live. The implementation was promoted to the canonical service path in this pass. |
| Shared location consumers | Geofencing route, M560100 module adapter, driver telemetry, village geo service | Partially implemented. Consumers now target the canonical geofencing service. A broader stable API for ETA, route monitoring, asset tracking, and spatial analytics remains future work. |
| Master-data single source | Existing master-data modules and database schema | Concept accepted, but no claim of complete cross-domain enforcement is made without schema and workflow tests. |
| Production security boundary | Authentication service and middleware | Implemented for the reconciled auth boundary: mandatory JWT secret, constrained token verification, public-role enforcement, production fallback refusal, rate limiting, signed OAuth state, and fail-closed password verification. |

## Duplicate consolidation completed

Authentication business logic now lives only in `backend/src/services/authService.js`. The former `dual-use/authService.js` and `authService/index.js` paths are compatibility delegates to the same module instance. Nine shadowed split implementation files were retired after their behavior was compared with the hardened live service.

Geofencing business logic now lives in `backend/src/services/geofencingService.js`. The legacy service path delegates to it, while the mounted route and M560100 module adapter import the canonical path directly.

## Verification

- 107 focused backend tests pass across authentication, JWT configuration, village HTTP contracts, UUID/legacy village identifiers, and geospatial primitives.
- A module-identity smoke check confirms the canonical and compatibility authentication paths return the same service instance.
- A module-identity smoke check confirms the canonical, legacy, and M560100 geofencing paths return the same service instance and the mounted route loads.
- The frontend production build completes successfully.

This is a bounded production-hardening pass. The repository-wide production audit currently reports 390 broken imports and 1,623 placeholder files outside these domains, so the whole platform is not yet represented as production-ready.
