-- ============================================================================
-- 060_experience_layer_dxp.sql   (2026-08-05)
--
-- THE EXPERIENCE LAYER / DIGITAL EXPERIENCE PLATFORM (DXP)
--
-- Fifteen engines from the specification: Design System, Theme, Layout,
-- Animation, Interaction, Navigation, Visualization, Rendering, Accessibility,
-- Responsive, Personalization, Notification, Media, Component Library and the
-- Experience Engine that coordinates them.
--
-- WHY THIS IS ONE MIGRATION AND NOT FIFTEEN
--
-- They are one concern seen from fifteen angles. A theme change is a
-- design-system change is a rendering change; splitting them into separate
-- tables with separate owners is how a "brand colour" ends up defined in four
-- places that disagree. What each engine needs is a NAMESPACE inside a shared
-- registry, not a table of its own.
--
-- WHAT LIVES HERE AND WHAT DOES NOT
--
-- This holds the CONFIGURATION and the GOVERNANCE of the experience layer —
-- tokens, themes, breakpoints, motion rules, accessibility conformance, user
-- preferences. It does not hold React components; those are files, and a
-- database is the wrong home for them.
--
-- The reason to put tokens in a database at all: a colour defined only in CSS
-- cannot be checked for contrast by anything except a human squinting at it,
-- cannot be reported on for WCAG conformance, and cannot be varied per tenant
-- without a rebuild. As rows, all three become possible.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. DESIGN TOKENS — the single definition of a visual value
--
-- One token, one place. A colour, a spacing step, a radius, a font size.
-- Everything else references these.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS design_tokens (
    id SERIAL PRIMARY KEY,
    token_key VARCHAR(80) NOT NULL,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('color','spacing','typography','radius','shadow',
                            'motion','breakpoint','elevation','border','opacity')),
    value TEXT NOT NULL,
    -- Tokens that point at other tokens. --btn-bg -> --brand-primary. Resolving
    -- through a reference is what lets a rebrand change one row.
    references_token VARCHAR(80),

    theme VARCHAR(40) NOT NULL DEFAULT 'base',
    description TEXT,
    deprecated BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by VARCHAR(80),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (token_key, theme),

    -- A token cannot reference itself; that is an infinite resolution loop that
    -- would hang whatever walks the chain.
    CONSTRAINT token_not_self_referential CHECK (
      references_token IS NULL OR references_token <> token_key
    ),
    -- Deprecating without a replacement leaves callers nowhere to go.
    CONSTRAINT deprecated_token_has_successor CHECK (
      deprecated = FALSE OR replaced_by IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 2. THEME ENGINE
--
-- Light, dark, high-contrast, and per-tenant branding.
--
-- `min_contrast_ratio` is not decoration. A dark theme built by inverting a
-- light one routinely produces text at 2:1 against its background, which is
-- unreadable for a large number of people and fails WCAG AA at 4.5:1. Storing
-- the target next to the theme means it can be checked rather than assumed.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ui_themes (
    id SERIAL PRIMARY KEY,
    theme_key VARCHAR(40) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    base_theme VARCHAR(40),
    tenant_id UUID,

    color_scheme VARCHAR(20) NOT NULL DEFAULT 'light'
        CHECK (color_scheme IN ('light','dark','high_contrast','auto')),
    min_contrast_ratio NUMERIC(4,2) NOT NULL DEFAULT 4.50
        CHECK (min_contrast_ratio >= 3.00),
    contrast_verified_on DATE,

    -- Respecting prefers-reduced-motion is not optional: vestibular disorders
    -- make parallax and large transitions genuinely nauseating, not merely
    -- annoying.
    honors_reduced_motion BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- WCAG AA is 4.5:1 for body text. A theme claiming verification below that
    -- has verified itself against a standard it does not meet.
    CONSTRAINT verified_theme_meets_aa CHECK (
      contrast_verified_on IS NULL OR min_contrast_ratio >= 4.50
    )
);

INSERT INTO ui_themes (theme_key, display_name, color_scheme, min_contrast_ratio, is_default)
VALUES
 ('light','Light','light',4.50,TRUE),
 ('dark','Dark','dark',4.50,FALSE),
 ('high_contrast','High contrast','high_contrast',7.00,FALSE)
ON CONFLICT (theme_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. LAYOUT + RESPONSIVE ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ui_breakpoints (
    id SERIAL PRIMARY KEY,
    breakpoint_key VARCHAR(30) NOT NULL UNIQUE,
    min_width_px INTEGER NOT NULL CHECK (min_width_px >= 0),
    max_width_px INTEGER,
    columns INTEGER NOT NULL DEFAULT 12 CHECK (columns > 0),
    gutter_px INTEGER NOT NULL DEFAULT 16 CHECK (gutter_px >= 0),
    -- The device class that actually matters for this platform.
    typical_device VARCHAR(60),
    notes TEXT,

    CONSTRAINT breakpoint_range_valid CHECK (
      max_width_px IS NULL OR max_width_px > min_width_px
    )
);

INSERT INTO ui_breakpoints (breakpoint_key, min_width_px, max_width_px, columns, typical_device, notes)
VALUES
 ('xs',0,479,4,'Entry Android phone',
  'The default assumption for this platform, not the exception. A farmer on a '
  '4-inch screen over 2G is the primary user, and a layout that only works at '
  '1440px has been designed for the team rather than the audience.'),
 ('sm',480,767,4,'Large phone',NULL),
 ('md',768,1023,8,'Tablet',NULL),
 ('lg',1024,1439,12,'Laptop',NULL),
 ('xl',1440,NULL,12,'Desktop',NULL)
ON CONFLICT (breakpoint_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. MOTION / ANIMATION ENGINE
--
-- Every motion rule carries a reduced-motion alternative. Not as a fallback —
-- as a required column, because the alternative is what a person with a
-- vestibular disorder actually experiences and it should be designed rather
-- than defaulted to "nothing happens".
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS motion_presets (
    id SERIAL PRIMARY KEY,
    preset_key VARCHAR(60) NOT NULL UNIQUE,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('transition','micro_interaction','loading','page','feedback','vfx')),
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    easing VARCHAR(60) NOT NULL DEFAULT 'ease-out',
    description TEXT,

    reduced_motion_duration_ms INTEGER NOT NULL DEFAULT 0
        CHECK (reduced_motion_duration_ms >= 0),
    reduced_motion_behaviour TEXT NOT NULL,

    -- Anything above ~400ms starts feeling like waiting rather than responding.
    CONSTRAINT motion_not_sluggish CHECK (duration_ms <= 1000),
    CONSTRAINT reduced_is_not_longer CHECK (reduced_motion_duration_ms <= duration_ms)
);

INSERT INTO motion_presets
 (preset_key, category, duration_ms, easing, description, reduced_motion_duration_ms, reduced_motion_behaviour)
VALUES
 ('fade_in','transition',180,'ease-out','Element appears',0,'Appears immediately, no fade'),
 ('slide_panel','page',240,'cubic-bezier(0.2,0,0,1)','Panel slides in from edge',0,
  'Panel appears in place. Large sliding movement is the main trigger for motion sickness.'),
 ('button_press','micro_interaction',90,'ease-out','Button depresses on press',60,
  'Colour change only, no scale. Retains the feedback without the movement.'),
 ('success_check','feedback',420,'ease-out','Checkmark draws in',0,
  'Checkmark shown complete. The confirmation matters; the drawing does not.'),
 ('skeleton_pulse','loading',1000,'ease-in-out','Skeleton screen shimmer',0,
  'Static skeleton. A pulsing placeholder over a slow connection is a distraction, '
  'not information.'),
 ('toast_enter','feedback',200,'ease-out','Toast slides up',0,'Toast appears in place'),
 ('progress_ring','micro_interaction',600,'linear','Circular progress',600,
  'Retained — this animation IS the information, not decoration. Removing it '
  'would leave no indication that anything is happening.')
ON CONFLICT (preset_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. COMPONENT LIBRARY
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ui_components (
    id SERIAL PRIMARY KEY,
    component_key VARCHAR(80) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    file_path TEXT,

    -- The accessibility contract this component promises to keep.
    keyboard_operable BOOLEAN NOT NULL DEFAULT FALSE,
    screen_reader_labelled BOOLEAN NOT NULL DEFAULT FALSE,
    focus_visible BOOLEAN NOT NULL DEFAULT FALSE,
    wcag_level VARCHAR(4) CHECK (wcag_level IS NULL OR wcag_level IN ('A','AA','AAA')),

    states TEXT[] NOT NULL DEFAULT '{}',
    variants TEXT[] NOT NULL DEFAULT '{}',
    uses_tokens TEXT[] NOT NULL DEFAULT '{}',

    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','review','stable','deprecated')),
    replaced_by VARCHAR(80),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A component cannot be promoted to stable while it is unusable by keyboard
    -- or unreadable by a screen reader. This is the constraint that stops an
    -- inaccessible component becoming a dependency of forty screens.
    CONSTRAINT stable_component_is_accessible CHECK (
      status <> 'stable'
      OR (keyboard_operable = TRUE AND screen_reader_labelled = TRUE AND focus_visible = TRUE)
    ),
    CONSTRAINT deprecated_component_has_successor CHECK (
      status <> 'deprecated' OR replaced_by IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 6. ACCESSIBILITY ENGINE — conformance recorded, not claimed
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS a11y_conformance (
    id BIGSERIAL PRIMARY KEY,
    surface VARCHAR(120) NOT NULL,
    surface_type VARCHAR(20) NOT NULL DEFAULT 'page'
        CHECK (surface_type IN ('page','component','flow','email','pdf')),

    wcag_criterion VARCHAR(20) NOT NULL,
    level VARCHAR(4) NOT NULL CHECK (level IN ('A','AA','AAA')),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('pass','fail','not_applicable','not_tested')),

    -- Automated tools catch roughly a third of WCAG issues. Recording HOW a
    -- criterion was checked stops an automated pass being read as conformance.
    verified_by VARCHAR(20) NOT NULL DEFAULT 'automated'
        CHECK (verified_by IN ('automated','manual','assistive_tech','user_testing')),
    tool VARCHAR(60),
    finding TEXT,
    remediation TEXT,

    checked_on DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (surface, wcag_criterion, checked_on),

    CONSTRAINT failure_states_finding CHECK (
      status <> 'fail' OR (finding IS NOT NULL AND length(trim(finding)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- 7. PERSONALIZATION ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_experience_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    theme_key VARCHAR(40) REFERENCES ui_themes (theme_key),

    -- These four are accessibility settings, not cosmetic preferences, and the
    -- platform must honour them even where they conflict with brand.
    reduced_motion BOOLEAN,
    high_contrast BOOLEAN,
    font_scale NUMERIC(3,2) NOT NULL DEFAULT 1.00
        CHECK (font_scale >= 0.75 AND font_scale <= 2.50),
    screen_reader_in_use BOOLEAN,

    language VARCHAR(10) NOT NULL DEFAULT 'en',
    density VARCHAR(20) NOT NULL DEFAULT 'comfortable'
        CHECK (density IN ('compact','comfortable','spacious')),
    -- Low-bandwidth mode is a first-class setting here, not a degradation.
    data_saver BOOLEAN NOT NULL DEFAULT FALSE,
    dashboard_layout JSONB,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 8. NOTIFICATION / FEEDBACK ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ui_feedback_rules (
    id SERIAL PRIMARY KEY,
    event_key VARCHAR(80) NOT NULL UNIQUE,
    channel VARCHAR(20) NOT NULL
        CHECK (channel IN ('toast','banner','modal','inline','badge','sound','haptic')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('info','success','warning','error','critical')),

    -- A toast that disappears before it can be read is not a notification.
    -- WCAG 2.2.1 requires user control over timing for anything that matters.
    auto_dismiss_ms INTEGER,
    requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
    -- Screen readers need to be told whether to interrupt.
    aria_live VARCHAR(10) NOT NULL DEFAULT 'polite'
        CHECK (aria_live IN ('off','polite','assertive')),

    message_template TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    -- Errors and critical events must not vanish on a timer.
    CONSTRAINT errors_do_not_auto_dismiss CHECK (
      severity NOT IN ('error','critical') OR auto_dismiss_ms IS NULL
    ),
    -- Anything auto-dismissing must last long enough to read.
    CONSTRAINT dismiss_long_enough_to_read CHECK (
      auto_dismiss_ms IS NULL OR auto_dismiss_ms >= 4000
    ),
    -- assertive interrupts whatever the user is hearing; reserve it.
    CONSTRAINT assertive_reserved_for_urgent CHECK (
      aria_live <> 'assertive' OR severity IN ('error','critical','warning')
    )
);

INSERT INTO ui_feedback_rules
 (event_key, channel, severity, auto_dismiss_ms, requires_acknowledgement, aria_live, message_template)
VALUES
 ('order_placed','toast','success',5000,FALSE,'polite','Order {orderNumber} placed'),
 ('payment_failed','banner','error',NULL,TRUE,'assertive','Payment could not be completed: {reason}'),
 ('qc_hold_raised','modal','critical',NULL,TRUE,'assertive','Lot {lot} is on QC hold and cannot be dispatched'),
 ('price_updated','inline','info',6000,FALSE,'polite','Price updated to {price}'),
 ('dispatch_blocked','banner','critical',NULL,TRUE,'assertive','Dispatch blocked: {alert}'),
 ('sync_complete','toast','success',4000,FALSE,'polite','{count} records synced')
ON CONFLICT (event_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. MEDIA ENGINE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_delivery_profiles (
    id SERIAL PRIMARY KEY,
    profile_key VARCHAR(40) NOT NULL UNIQUE,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image','video','audio','document')),
    max_width_px INTEGER,
    format VARCHAR(20),
    quality INTEGER CHECK (quality IS NULL OR (quality BETWEEN 1 AND 100)),
    max_bytes INTEGER CHECK (max_bytes IS NULL OR max_bytes > 0),

    -- Applied when the user has data_saver on, or the connection is slow.
    for_data_saver BOOLEAN NOT NULL DEFAULT FALSE,
    -- Alt text is required for images. A product photo with no alt text is
    -- invisible to a screen reader, and on this platform the photo often IS
    -- the quality evidence.
    requires_alt_text BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);

INSERT INTO media_delivery_profiles
 (profile_key, media_type, max_width_px, format, quality, for_data_saver, notes)
VALUES
 ('product_full','image',1600,'webp',82,FALSE,NULL),
 ('product_thumb','image',320,'webp',70,FALSE,NULL),
 ('product_lowband','image',480,'webp',55,TRUE,
  'For 2G/3G and data-saver. The primary user is often on an intermittent '
  'connection in hill terrain; a 1.6MB hero image means the page never loads.'),
 ('lab_report','document',NULL,'pdf',NULL,FALSE,
  'Never downscaled — a lab report is evidence and must stay legible.')
ON CONFLICT (profile_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

-- Components that are stable and therefore safe to depend on.
CREATE OR REPLACE VIEW v_ui_stable_components AS
SELECT component_key, display_name, category, wcag_level, states, variants, file_path
FROM ui_components
WHERE status = 'stable'
ORDER BY category, component_key;

-- Accessibility conformance, with automated-only passes flagged. An automated
-- tool catches roughly a third of WCAG issues, so "all automated checks pass"
-- is not the same claim as "conformant".
CREATE OR REPLACE VIEW v_a11y_summary AS
SELECT
    surface,
    surface_type,
    COUNT(*)                                                    AS criteria_checked,
    COUNT(*) FILTER (WHERE status = 'pass')                     AS passing,
    COUNT(*) FILTER (WHERE status = 'fail')                     AS failing,
    COUNT(*) FILTER (WHERE status = 'not_tested')               AS untested,
    COUNT(*) FILTER (WHERE verified_by = 'automated')           AS automated_only,
    COUNT(*) FILTER (WHERE verified_by IN ('manual','assistive_tech','user_testing')) AS human_verified,
    MAX(checked_on)                                             AS last_checked,
    CASE
      WHEN COUNT(*) FILTER (WHERE status = 'fail') > 0 THEN 'failing'
      WHEN COUNT(*) FILTER (WHERE verified_by <> 'automated') = 0
        THEN 'automated checks only — not a conformance claim'
      ELSE 'verified'
    END                                                         AS standing
FROM a11y_conformance
GROUP BY surface, surface_type;

-- Tokens nobody uses, and tokens referenced but never defined.
CREATE OR REPLACE VIEW v_token_integrity AS
SELECT
    t.token_key,
    t.category,
    t.theme,
    t.references_token,
    CASE
      WHEN t.references_token IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM design_tokens d WHERE d.token_key = t.references_token)
        THEN 'references a token that does not exist'
      WHEN t.deprecated THEN 'deprecated — use ' || COALESCE(t.replaced_by, '(unspecified)')
      ELSE 'ok'
    END AS finding
FROM design_tokens t;

CREATE INDEX IF NOT EXISTS idx_tokens_theme ON design_tokens (theme, category);
CREATE INDEX IF NOT EXISTS idx_components_status ON ui_components (status, category);
CREATE INDEX IF NOT EXISTS idx_a11y_surface ON a11y_conformance (surface, checked_on DESC);
CREATE INDEX IF NOT EXISTS idx_a11y_failures ON a11y_conformance (surface) WHERE status = 'fail';
CREATE INDEX IF NOT EXISTS idx_prefs_user ON user_experience_preferences (user_id);
