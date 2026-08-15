-- Fix copilot_sessions.user_id type mismatch (found 2026-08-15 while grounding
-- aiCopilotService.js's copilot responses in real data).
--
-- 016_ai_copilot_schema.sql defined copilot_sessions.user_id as INTEGER, but
-- the real users table (000_base_schema.sql, 1000_user_management.sql) uses
-- UUID primary keys, and services/aiCopilotService.js's POST /session route
-- inserts req.user.id (a UUID) directly into this column. That insert fails
-- at the database layer on every call ("invalid input syntax for type
-- integer") — this table has never been able to accept a real request.
--
-- Any existing rows cannot contain a row inserted via the real route (that
-- insert was always impossible), so it is safe to clear the tables before
-- the type change rather than attempt a lossy int->uuid cast.
TRUNCATE TABLE copilot_messages;
TRUNCATE TABLE copilot_sessions;

ALTER TABLE copilot_sessions ALTER COLUMN user_id TYPE UUID USING user_id::text::uuid;
ALTER TABLE copilot_sessions
  ADD CONSTRAINT copilot_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
