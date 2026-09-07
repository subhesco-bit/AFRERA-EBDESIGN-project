-- ============================================================================
-- 9997_enterprise_memory_schema.sql   (2026-08-09)
--
-- ENTERPRISE MEMORY — closes the aiOrchestrator.js "enterprise_memory" gap
-- found in the 2026-08-08 AI-orchestration audit: "No persistent
-- cross-session/context memory store found anywhere in backend/src (grepped
-- for memoryService, vectorMemory, conversationMemory — no hits)."
-- AFRERA_CLAUDE_BUILD_DIRECTIVE.md §2.3 names this the "Hippocampus —
-- enterprise memory, knowledge graph, case library, lessons learned."
--
-- WHAT THIS IS
-- A retrievable case/episode log: "what happened before, and what did we
-- learn from it" — e.g. "the last time a temperature breach happened on this
-- route, here's what the resolution was." Retrieval is real Postgres
-- full-text search (to_tsvector/to_tsquery), the same pattern already used by
-- knowledge_nodes (migration 032_knowledge_graph_schema.sql) and
-- food_nutrition_profiles (migration 036_nutrition_intelligence_schema.sql,
-- see searchFoodProfiles()). No embedding model is configured anywhere in
-- this codebase, so this is deliberately keyword search, not a vector store —
-- fabricating semantic search here would be exactly the kind of invisible
-- absence this platform's other AI modules go out of their way to avoid.
--
-- WHAT THIS IS DELIBERATELY NOT — the ai_outcomes duplication question
-- Migration 990_ai_outcomes.sql already records every effector reaction
-- (ai_outcomes) and every scored prediction (ai_prediction_log), with a real
-- calibration loop on top (core/outcomeResolver.js — resolveDue(),
-- autoJudgeOutcomes(), the v_ai_agent_gate view). Re-storing that data here
-- would fork a single source of truth into two copies that drift apart.
-- Instead:
--   * source_outcome_id / source_prediction_id are nullable FKs so a memory
--     entry can point AT the ai_outcomes/ai_prediction_log row it came from,
--     rather than copying its columns.
--   * enterprise_memory_entries itself holds only what those tables cannot:
--     free-text case narratives (manual notes; signal-triggered case
--     summaries recorded the moment something happens, before any effector
--     outcome exists to point at) that were never a "prediction" or a scored
--     "effector reaction" in the first place, and therefore have nowhere
--     else to live.
-- services/enterpriseMemoryService.js's recallSimilar()/recallByEntity()
-- LEFT JOIN ai_outcomes and ai_prediction_log at query time, so a caller gets
-- the full case context (what was done, whether it helped) without that data
-- being stored a second time. This table is the case-memory INDEX; migration
-- 990's tables remain the system of record for outcomes and predictions.
--
-- Numbered 9997 (after 9995/9996, the most recent named migrations) rather
-- than the next sequential 3-digit slot, so it is unambiguous that this runs
-- after 990_ai_outcomes.sql — a hard requirement, since source_outcome_id and
-- source_prediction_id are foreign keys into tables migration 990 creates.
-- ============================================================================

CREATE TABLE IF NOT EXISTS enterprise_memory_entries (
    id BIGSERIAL PRIMARY KEY,

    -- When the thing happened vs. when the memory was written. These differ
    -- for backfilled or manually-logged entries; for signal-triggered entries
    -- they are effectively the same instant.
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Module/service that recorded this, e.g. 'signalBus:iot.temperature.breach',
    -- 'manual:ops-team', 'effector:coldchain.breach_response'. Free text, like
    -- ai_outcomes.actor_id — the recorder is code or a person, not a row, and
    -- must survive that code being renamed or removed.
    source VARCHAR(120) NOT NULL,

    -- Retrieval bucket. Free text rather than an enum: the set of categories
    -- (cold_chain, recall, fraud, manual_note, ...) will grow with the
    -- platform, and a CHECK constraint would need a migration for every new one.
    category VARCHAR(60) NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',

    -- Same entityType/entityId shape core/signalBus.js signals carry
    -- (meta.entityId) and ai_outcomes already uses (subject_type/subject_id) —
    -- kept consistent so a caller can correlate across signals, outcomes and
    -- memory without translating field names.
    entity_type VARCHAR(60),
    entity_id VARCHAR(100),

    -- The case narrative: what happened, and — once known — how it was
    -- resolved. resolution is nullable because most memories are written the
    -- moment something happens, before anyone (human or effector) knows the
    -- outcome.
    what_happened TEXT NOT NULL,
    resolution TEXT,
    severity VARCHAR(20),

    -- Nullable, and expected to be NULL on most rows: only memories that
    -- genuinely originated from a scored prediction or a logged effector
    -- reaction carry one of these. ON DELETE SET NULL: losing the citation is
    -- an acceptable degradation, losing the memory itself is not.
    source_prediction_id BIGINT REFERENCES ai_prediction_log(id) ON DELETE SET NULL,
    source_outcome_id BIGINT REFERENCES ai_outcomes(id) ON DELETE SET NULL,

    CONSTRAINT enterprise_memory_entries_narrative_required
      CHECK (length(trim(what_happened)) > 0)
);

-- Full-text index. The expression here MUST match the WHERE-clause expression
-- in enterpriseMemoryService.recallSimilar() exactly, or Postgres will not use
-- it and every search becomes a sequential scan.
-- 2026-08-30: to_tsvector(regconfig, text) is STABLE, not IMMUTABLE (the text
-- search config it depends on isn't guaranteed constant), so Postgres refuses
-- it directly in an index expression ("functions in index expression must be
-- marked IMMUTABLE") - the first time this repo's CI actually ran npm run
-- migrate for real. Standard fix: wrap in a function explicitly asserted
-- IMMUTABLE (safe here since 'english' is a hardcoded literal, not a
-- parameter that could vary row to row).
CREATE OR REPLACE FUNCTION enterprise_memory_search_vector(what_happened TEXT, resolution TEXT, tags TEXT[])
RETURNS tsvector AS $$
  SELECT to_tsvector('english',
    what_happened || ' ' || COALESCE(resolution, '') || ' ' ||
    COALESCE(array_to_string(tags, ' '), '')
  );
$$ LANGUAGE sql IMMUTABLE;

CREATE INDEX IF NOT EXISTS idx_enterprise_memory_fts
  ON enterprise_memory_entries
  USING GIN (
    (enterprise_memory_search_vector(what_happened, resolution, tags))
  );

CREATE INDEX IF NOT EXISTS idx_enterprise_memory_entity
  ON enterprise_memory_entries (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_memory_category
  ON enterprise_memory_entries (category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_memory_source_outcome
  ON enterprise_memory_entries (source_outcome_id) WHERE source_outcome_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enterprise_memory_source_prediction
  ON enterprise_memory_entries (source_prediction_id) WHERE source_prediction_id IS NOT NULL;
