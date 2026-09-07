-- ============================================================================
-- 9994_platform_content_and_m0xx_indexes.sql
--
-- Two unrelated but small additions bundled per the 998_foreign_key_indexes.sql
-- precedent (one file, several tables) rather than one file per table:
--
-- 1. PLATFORM CONTENT SYSTEMS — schema for the platform-wide community forum,
--    knowledge base and announcement/information-sharing systems exposed by
--    routes/platform/communityRoutes.js, knowledgeRoutes.js and
--    informationSharingRoutes.js. No table for any of these three existed
--    anywhere in this codebase (confirmed by grep before writing this file);
--    services/platform/knowledgeService.js and informationSharingService.js
--    are in-memory Map-based scaffolds owned by a different work-stream, not
--    a persistence layer these routes should depend on.
--
-- 2. M0XX INDEXES — targeted indexes on the `data` JSONB column for the eight
--    M0xx generic scaffold modules (M118, M119, M120, M137, M139, M144, M148,
--    M149) given real domain identities in this same pass. A GIN index per
--    table supports the filtering these modules' new service.js logic does
--    against arbitrary JSONB keys; two expression indexes support the two
--    genuinely hot, threshold-style lookups (ticket SLA queue ordering,
--    certification expiry scans).
--
-- Numbered 9994 so it runs after the enterprise/HR/platform-foundation spine
-- (014, 996-998) and before the 9995+ cluster, matching this codebase's own
-- documented convention (see 9996_project_systems_schema.sql's header) of
-- placing dependent additions just ahead of the files that already occupy
-- 9995 and up. Safe to re-run (CREATE TABLE/INDEX IF NOT EXISTS throughout).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. COMMUNITY FORUM
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS community_posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','farming_tips','market_talk','equipment','announcements','support')),
  tags JSONB DEFAULT '[]',
  audience VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all','farmers','buyers','admins')),
  upvotes INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published'
    CHECK (status IN ('published','flagged','hidden','locked')),
  flag_count INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published'
    CHECK (status IN ('published','flagged','hidden')),
  flag_count INTEGER NOT NULL DEFAULT 0,
  is_accepted_answer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One vote (up or flag) per user per post-or-reply. Exactly one of
-- post_id/reply_id is set, matching journal_lines' single-side-check pattern
-- in 996_enterprise_foundation.sql.
CREATE TABLE IF NOT EXISTS community_votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  reply_id INTEGER REFERENCES community_replies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up','flag')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT community_vote_single_target CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  UNIQUE (post_id, reply_id, user_id, vote_type)
);

CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_post ON community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_reply ON community_votes(reply_id);

-- ---------------------------------------------------------------------------
-- 2. KNOWLEDGE BASE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(160) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(280) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  audience VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all','farmers','buyers','admins')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent ON knowledge_categories(parent_id);

-- ---------------------------------------------------------------------------
-- 3. INFORMATION SHARING / ANNOUNCEMENTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS info_announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(20) NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all','farmers','buyers','admins')),
  priority VARCHAR(10) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','expired','withdrawn')),
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  target_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS info_announcement_reads (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES info_announcements(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_info_announcements_status ON info_announcements(status);
CREATE INDEX IF NOT EXISTS idx_info_announcements_audience ON info_announcements(audience);
CREATE INDEX IF NOT EXISTS idx_info_announcement_reads_announcement ON info_announcement_reads(announcement_id);

-- ---------------------------------------------------------------------------
-- 4. M0XX MODULE INDEXES
-- General GIN index per module (arbitrary JSONB key filtering) plus two
-- expression indexes for the modules whose real logic does threshold/order
-- queries frequently: M144 (helpdesk SLA queue) and M149 (certification
-- expiry scan).
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_fpo_m118_items_data ON fpo_m118_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fpo_m119_items_data ON fpo_m119_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fpo_m120_items_data ON fpo_m120_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_core_m137_items_data ON core_m137_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_core_m139_items_data ON core_m139_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_core_m144_items_data ON core_m144_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_core_m148_items_data ON core_m148_items USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_core_m149_items_data ON core_m149_items USING GIN (data);

-- M144 helpdesk: queue ordering by status + priority.
CREATE INDEX IF NOT EXISTS idx_core_m144_items_status ON core_m144_items ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_core_m144_items_priority ON core_m144_items ((data->>'priority'));

-- M149 compliance: expiry-threshold scans.
CREATE INDEX IF NOT EXISTS idx_core_m149_items_expiry ON core_m149_items ((data->>'expiryDate'));

-- M120 vendor contracts: renewal-threshold scans.
CREATE INDEX IF NOT EXISTS idx_fpo_m120_items_end_date ON fpo_m120_items ((data->>'endDate'));

-- M148 budget approvals: workflow status queue.
CREATE INDEX IF NOT EXISTS idx_core_m148_items_status ON core_m148_items ((data->>'status'));
