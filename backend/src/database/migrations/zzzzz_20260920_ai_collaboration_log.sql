-- ai_collaboration_log: audit trail for AI-agent collaboration work.
--
-- Added 2026-09-20 to back aiCollaborationService.logWork(agentName, workData),
-- which was called by 13+ services in backend/src/services/claude/ (every one
-- of them inside a try/catch alongside their real operational logic) but did
-- not exist as a method at all -- every one of those services' core
-- operations threw "logWork is not a function" on their very first call.
-- Following this repo's post-freeze convention (see zzzz_*/zzzzz_* files)
-- rather than a numeric prefix in the frozen 000-071 band.

CREATE TABLE IF NOT EXISTS ai_collaboration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(50) NOT NULL,
  work_type VARCHAR(100),
  service VARCHAR(150),
  status VARCHAR(50),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_collaboration_log_agent ON ai_collaboration_log(agent);
CREATE INDEX IF NOT EXISTS idx_ai_collaboration_log_service ON ai_collaboration_log(service);
CREATE INDEX IF NOT EXISTS idx_ai_collaboration_log_created_at ON ai_collaboration_log(created_at DESC);
