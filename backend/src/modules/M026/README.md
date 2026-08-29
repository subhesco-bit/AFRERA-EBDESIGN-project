# M026 - Farmer Skill Management

Launch-level Tier 1 farmer module.

## Purpose

Maintains a farmer skill passport with proficiency, evidence, training gaps,
certification readiness, and AI-readable signals.

## Runtime

- Table: `farmer_m026_items`
- Route: `/api/v1/modules/m026`
- Controller contract: `listItems`, `getItem`, `createItem`, `updateItem`, `deleteItem`
- Backbone contract: `execute(operation, parameters)`, `healthCheck()`

## Key Operations

- `skillPassport`: aggregate readiness and top skills for a farmer
- `recommendTraining`: generate training actions from recorded skill gaps
- `analyze`: Claude-compatible alias for skill passport generation
