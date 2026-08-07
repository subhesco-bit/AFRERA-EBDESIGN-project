# System Wireframe — layers and permitted dependencies

**Generated:** 2026-08-04 by `tools/wireframe-boundaries.js`
**Status:** DESCRIPTIVE — measured from source, comments stripped.
**Do not edit by hand.**

---

## The rule

Dependencies flow **downward only**. A lower layer importing an upper one
is what turns a layered system into a ball of mud, and it is checkable.

```
┌─────────────────────────────────────────────────────────────┐
│  entry      index.js — boot, mount, sockets                 │
├─────────────────────────────────────────────────────────────┤
│  routes     HTTP shape only: parse → validate → delegate    │
├─────────────────────────────────────────────────────────────┤
│  services   business logic; each owns its own tables        │
├──────────────────────────┬──────────────────────────────────┤
│  core                    │  middleware                      │
│  bus · engine · agents   │  auth · admin · rate limit       │
├──────────────────────────┴──────────────────────────────────┤
│  database   ONE pool. Never construct another.              │
├─────────────────────────────────────────────────────────────┤
│  utils      pure functions — no I/O, no state, no imports   │
└─────────────────────────────────────────────────────────────┘

  Cross-service communication does NOT go sideways.
  It goes through core/signalBus → effectors.
```

## Layers as built

| Layer | Files | Owns | May import |
|---|---|---|---|
| **entry** | 0 | Process boot, route mounting, socket server | routes, services, core, middleware, utils, database |
| **routes** | 12 | HTTP shape only — parse, validate, delegate | services, middleware, utils, core |
| **services** | 71 | Business logic and its own tables | core, middleware, utils, database |
| **core** | 6 | Nervous system, decision engine, agents, MCDA | utils |
| **middleware** | 6 | Cross-cutting request concerns | utils, services |
| **database** | 11 | Connection pooling and migrations | utils |
| **utils** | 3 | Pure functions, no I/O, no state | _nothing_ |

## Boundary rules (all CI-checkable)

### BR-01 — A service must not construct its own database Pool.

**Severity:** critical

39 services each build a Pool. At pg's default of 10 connections that is 390 + the shared pool's 20 = 410, against a PostgreSQL default max_connections of 100. Under load the 101st request fails and every module blames a different one. Use database/connection.js.

### BR-02 — core/ must not import services/.

**Severity:** high

The nervous system and decision engine must stay usable without the organs. Importing upward makes core untestable in isolation and creates require cycles that surface as undefined-at-load bugs.

### BR-03 — utils/ must import nothing from the application.

**Severity:** high

Utilities are the only layer safe to unit-test with no setup. Any import makes them stateful and drags the whole app into their tests.

### BR-04 — A service must not import another service directly.

**Severity:** medium

Direct calls create a hidden dependency graph that no one maintains. Cross-module communication belongs on the signal bus, which is observable, auditable and does not couple deployment.

### BR-05 — Routes must not contain SQL.

**Severity:** medium

SQL in a route means business logic is in the HTTP layer, where it cannot be reused, tested without a request, or found by anyone looking in services/.

### BR-06 — A module with write endpoints must guard them.

**Severity:** critical

An unguarded POST/PUT/DELETE is an open door. This was already found once — 78 unauthenticated write endpoints across 20 services.

### BR-07 — Signals must be published with emitSignal(), never emit().

**Severity:** critical

signalBus.emit({...}) is raw EventEmitter and publishes an event named "[object Object]". No subscriber receives it. Four call sites did this and appeared connected in every audit.

### BR-08 — Multi-statement writes must run in a transaction.

**Severity:** high

Two INSERTs without BEGIN/COMMIT can half-succeed. In an accounting or inventory context that leaves the books wrong with no error.

