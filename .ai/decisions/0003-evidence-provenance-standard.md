# 0003 — Evidence/provenance is the standard for every service response, not an opt-in

**Status:** Adopted 2026-09-24
**Origin:** `valueChainStudioService.js`, evaluated and promoted to project standard at the user's explicit direction ("can we make this benchmark and implement the same way across the project").

## The problem this replaces

Before this, the common pattern across services was a flat boolean:

```js
provenance['pricing.floorBenchmark'] = dbSourced(true); // "verified" tells you almost nothing
```

`verified: true` looked the same whether it was backed by 50 real database rows or zero.
There was no record of *which* table it came from, *what formula* produced a calculated
value, or whether a value was a real measurement versus a keyword-matched guess. This is
the same "confident but false" failure mode found repeatedly elsewhere in this codebase
this session (modules self-reporting `status: "production"` while being 2-file stubs,
routes silently trusting client-supplied data instead of looking it up).

## The standard

Shared implementation: [`backend/src/utils/evidence.js`](../../backend/src/utils/evidence.js).
Every service that returns a value a user or another system might rely on for a decision
must tag it with one of:

| Source | Meaning | `verified` |
|---|---|---|
| `db` | Read directly from a table | `true` if backed by real rows, else `false` |
| `calculated` | Deterministic formula over real inputs — **state the formula** in `methodology` | `true` only if the inputs were real |
| `inferred` | A heuristic/keyword/rule-of-thumb, not a measurement | always `false` |
| `ai` | A model output (copy, image, summary) | always `false` — advisory only |
| `unavailable` | Lookup attempted and failed, or precondition not met | `false` |

Each entry also carries `sourceRef` (exact table/column/service) and `asOf` (timestamp).
`inferred` and `ai` are *always* unverified by construction — the helper functions don't
accept a `verified` argument for them, so a service can't accidentally mark a guess as a
fact.

## Frontend contract

The UI must render the taxonomy, not just a checkmark: a provenance ledger table showing
every field's source/status/methodology/timestamp (see `ValueChainStudioPage.jsx`'s
"Data provenance ledger" section), and distinct visual treatment for `db` (verified,
green), `calculated` (verified, blue), `inferred` (amber, "verify" label), `ai` (violet,
"advisory only"), `unavailable` (grey). A readiness score should only count verified
fields — inferred/unavailable/ai contribute zero, never partial credit.

## Companion pattern: ownership-scoped authorization

Adopted alongside evidence/provenance from the same source commit: a context-fetching
function that takes an optional `requester` and scopes the query to
`WHERE owner_id = requester.id` unless the requester has an elevated role, throwing
rather than silently returning another party's data. See `getFarmerContext()` in
`valueChainStudioService.js`. This closed a real IDOR (any authenticated user could
previously read any farmer's FDI score, location, and financial data by ID). Apply this
wherever a service resolves an entity by an ID that arrived from the request rather than
from the authenticated session.

## How to apply this to an existing service

1. `const { evidence, dbSourced, calculatedSourced, inferred, aiSourced, unavailable } = require('../utils/evidence');`
2. Replace every `verified: true/false` literal with the matching factory call, filling
   in a real `sourceRef` and, for `calculated`, the actual formula as `methodology`.
3. If the service resolves an entity by a caller-supplied ID, add the `requester`
   ownership-scoping pattern from `getFarmerContext()`.
4. On the frontend, replace a bare checkmark/badge with the ledger table pattern.

## Rollout status

Applied: `valueChainStudioService.js` / `ValueChainStudioPage.jsx` (origin).
Not yet applied: everywhere else. This is a standard for new/touched code and a target
for retrofitting live, reachable services — not a claim that it has been rolled out
project-wide. See `.ai/tasks/ACTIVE.md` for the current retrofit queue.
