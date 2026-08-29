# SUBH DATABASE APPLICATION BINDING

Canonical application path:

UI
→ Route
→ API
→ Controller
→ Service
→ Repository
→ PostgreSQL

Asynchronous path:

Service
→ Event
→ Queue
→ Worker
→ PostgreSQL / AI / Notification

Derived infrastructure:

PostgreSQL
→ Search index
PostgreSQL
→ Analytics
PostgreSQL
→ Vector index
PostgreSQL
→ Graph projection
PostgreSQL
→ Object storage references

Rules:

1. Modules do not create unmanaged databases.
2. Services do not directly contain SQL when a repository/data-access layer
   is established.
3. Database schema changes require canonical migrations.
4. Every table must have a known owning module/domain.
5. Every production table must have a known creation migration.
6. Every foreign key must resolve to an existing canonical object.
7. Duplicate tables must be reconciled.
8. Duplicate migrations must be reconciled.
9. Legacy SQL remains preserved until disposition is established.
10. Application integration occurs after canonical schema validation.
