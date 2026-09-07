# Breaking-Major Dependency Migration Matrix

**Baseline date:** 2026-09-04  
**Rule:** No dependency is upgraded or downgraded by this document. Each family requires a compatibility check, a focused test/build, and a reviewable lockfile diff before the next family starts.

## Frontend Baseline

| Family | Manifest range | Installed | Breaking concern | Gate |
|---|---|---|---|---|
| React / React DOM | `^19.2.8` | `19.2.8` | Documentation and older tests describe React 18; lifecycle and test behavior differ | Confirm all 14 suites under React 19, then decide whether React 19 is the supported baseline |
| React Router | `^7.18.3` | `7.18.3` | Architecture and route docs describe Router 6 APIs | Search all navigation/route APIs, run route smoke tests, and update docs only after behavior is verified |
| Vite | `^8.2.2` | `8.2.2` | CommonJS config warning and future native config-loader behavior | Convert config to supported ESM form or pin deliberately; build must remain clean |
| TanStack Query | `^5.102.8` | `5.102.8` | v5 object syntax is required; legacy call sites can fail at runtime | Run workflow/page tests and scan for positional v4 calls |
| Capacitor | `^8.5.1` | Installed per manifest | Native plugin/project compatibility | Verify Android project and native build before changing any Capacitor family package |
| Radix UI | Mixed `^1`/`^2` ranges | Installed per manifest | Component API and peer compatibility varies by package | Exercise dialog, select, tabs, and popover interactions |

## Backend Baseline

| Family | Manifest range | Breaking concern | Gate |
|---|---|---|---|
| Express | `^4.18.2` | Express 5 changes async error behavior and routing edge cases | Inventory middleware and route handlers, then run backend route smoke tests |
| PostgreSQL client | `^8.11.3` | Query/pool behavior must match migration and transaction assumptions | Run database-backed integration checks against the target schema |
| Socket.IO | `^4.6.1` | Client/server protocol and auth handshake must stay compatible | Validate authenticated room joins and shipment updates |
| AWS SDK | `aws-sdk ^2.1500.0` plus `@aws-sdk/client-s3 ^3.1111.0` | Two major SDK families coexist; static audits found no confirmed use of v2 | Prove call sites before removing v2 or migrating any adapter |
| Elasticsearch | `^16.7.3` | Legacy client is deprecated and no verified caller is currently documented | Do not migrate until a real search integration and contract test exist |
| GraphQL | `graphql ^16.8.1` plus `apollo-server-express ^3.12.1` | Apollo 3 is legacy and the repository has no verified live GraphQL route | Do not major-upgrade or remove until route ownership is proven |

## Migration Procedure

1. Capture `package.json`, lockfile, build output, test output, and dependency tree.
2. Select one family and record the intended target API changes.
3. Apply only that family change; do not use `--force` or broad automated upgrades.
4. Run the narrow tests for the affected surface, then the full frontend/backend build and test commands.
5. Review bundle, lint, route, and lockfile diffs; revert the family if compatibility is not proven.
6. Record evidence and only then select the next family.

## Current Decision

The frontend baseline passes `14` suites and `51` tests, and the production build succeeds. Therefore the current checkout is not a failed dependency migration baseline; it is a mixed-major baseline that needs explicit support decisions before any breaking change.