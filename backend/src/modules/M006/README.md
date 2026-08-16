# M006 - System Administration

Domain: Platform Foundation
Status: ENHANCED

Real CRUD over the `admin_settings` and `audit_logs` tables (migrations/1002_system_administration.sql),
plus AI-assisted analytics on top of them.

## Features
- Admin settings read/upsert (JSONB values, keyed by name)
- Audit log ingestion
- System analytics (audit activity patterns, settings health)
- Anomaly detection (high-frequency activity, emits a security signal via signalBus)
- Predictive maintenance (load trend + recommendations from audit volume)
