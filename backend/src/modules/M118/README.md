# M118 — Internal Audit Trail Viewer

Curated review queue for audit-worthy internal events (config overrides, manual
data corrections, access grants, emergency bypasses) — distinct from the
transactional `audit_logs` table (`services/platform/auditService.js`), which
logs every write for forensics. This module is what an admin actually works
through: severity-weighted risk scoring plus an overdue-review alert, neither
of which the raw log provides.

Files: controller.js, service.js, routes.js, migrations/3000_M118_generated.sql
(table `fpo_m118_items`).

## Strategy Card
Purpose:      Give admins a queue of internal events that need a human's eyes,
              not just a permanent forensic record, and flag when review is falling behind.
Actors:       Platform admins (review), any internal service/module (writes an entry).
Decision:     Which unreviewed events are most urgent right now, and which have gone
              stale without review.
Algorithm:    Severity weights `{low:1, medium:3, high:7, critical:15}`. Risk score =
              sum(weight of unreviewed entries) / count(unreviewed entries) — the
              average urgency of what's outstanding, banded low(<2)/medium(<6)/high(<10)/critical.
              An unreviewed entry older than 72 hours is flagged overdue regardless of severity.
Data:         `data` JSONB — eventType, entityType/entityId, actorId/actorRole, action,
              severity, description, beforeState/afterState, reviewed, reviewedBy,
              reviewedAt, occurredAt. See service.js header for the full shape.
AI role:      none — severity is set by the caller (a human or the emitting service),
              scoring is deterministic arithmetic.
Status:       real — CRUD plus `markReviewed` and `computeRiskSummary` are implemented
              against the live table; `GET /risk-summary` and `POST /:id/review` are wired.
