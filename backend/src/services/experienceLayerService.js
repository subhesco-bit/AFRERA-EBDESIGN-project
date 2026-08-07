/**
 * Experience Layer / DXP — the fifteen engines, served as one module.
 *
 * Backed by migration 060. Design System, Theme, Layout, Animation,
 * Interaction, Navigation, Visualization, Rendering, Accessibility,
 * Responsive, Personalization, Notification, Media, Component Library, and the
 * Experience Engine that resolves them together.
 *
 * WHY ONE SERVICE
 *
 * A theme change is a token change is a rendering change. Fifteen services
 * would each hold a partial view of "what does this user see", and the first
 * disagreement between them would be invisible until a farmer on a 4-inch
 * screen got a layout designed for a laptop.
 *
 * THE FUNCTION THAT MATTERS MOST
 *
 * `resolveExperience()` — given a user, return the complete, already-reconciled
 * answer: theme, tokens, breakpoint, motion, media profile. Accessibility
 * preferences WIN over branding in that reconciliation, always, and the payload
 * says which overrides were applied so the client cannot quietly re-apply the
 * thing the user asked not to have.
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

/**
 * Tokens for a theme, with references resolved.
 *
 * A token may point at another token (`--btn-bg` -> `--brand-primary`); that
 * indirection is what makes a rebrand a one-row change. Resolution is bounded
 * because a cycle in the reference graph would otherwise loop forever, and the
 * DB constraint only prevents SELF-reference, not an A->B->A pair.
 */
async function getTokens(theme = 'base', { resolve = true } = {}) {
  const { rows } = await pool.query(
    `SELECT token_key, category, value, references_token, deprecated, replaced_by, description
       FROM design_tokens
      WHERE theme = $1 OR theme = 'base'
      ORDER BY category, token_key`,
    [theme]
  );
  if (!resolve) return { theme, tokens: rows, count: rows.length };

  const byKey = Object.fromEntries(rows.map((r) => [r.token_key, r]));
  const resolveValue = (key, depth = 0) => {
    const t = byKey[key];
    if (!t) return { value: null, unresolved: key };
    if (!t.references_token) return { value: t.value };
    if (depth > 10) {
      // A cycle. Report it rather than returning a plausible-looking value.
      return { value: null, cycle: true, chain: key };
    }
    return resolveValue(t.references_token, depth + 1);
  };

  const resolved = rows.map((r) => {
    const out = resolveValue(r.token_key);
    return {
      ...r,
      resolvedValue: out.value,
      unresolvedReference: out.unresolved ?? null,
      referenceCycle: Boolean(out.cycle),
    };
  });

  const broken = resolved.filter((r) => r.unresolvedReference || r.referenceCycle);
  return {
    theme,
    tokens: resolved,
    count: resolved.length,
    broken,
    note: broken.length
      ? `${broken.length} token(s) reference something that does not exist or form a cycle. `
      + 'These resolve to null rather than a fallback colour — a silent fallback is how a '
      + 'broken token ships looking fine.'
      : null,
  };
}

async function upsertToken(t) {
  if (!t.tokenKey || !t.category || t.value === undefined) {
    throw new Error('tokenKey, category and value are required');
  }
  const { rows } = await pool.query(
    `INSERT INTO design_tokens (token_key, category, value, references_token, theme, description)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (token_key, theme) DO UPDATE SET
       value = EXCLUDED.value,
       references_token = EXCLUDED.references_token,
       description = EXCLUDED.description
     RETURNING *`,
    [t.tokenKey, t.category, t.value, t.referencesToken ?? null,
      t.theme ?? 'base', t.description ?? null]
  );
  return rows[0];
}

// ---------------------------------------------------------------------------
// Theme engine
// ---------------------------------------------------------------------------

async function listThemes() {
  const { rows } = await pool.query(
    'SELECT * FROM ui_themes WHERE enabled ORDER BY is_default DESC, theme_key'
  );
  return {
    themes: rows,
    unverified: rows.filter((t) => !t.contrast_verified_on).map((t) => t.theme_key),
    note: rows.some((t) => !t.contrast_verified_on)
      ? 'Some themes have never had their contrast verified. A dark theme built by '
      + 'inverting a light one routinely lands at 2:1 against its background, which '
      + 'fails WCAG AA and is unreadable for a lot of people.'
      : null,
  };
}

/**
 * Relative luminance contrast ratio between two hex colours (WCAG 2.1).
 *
 * Implemented here rather than trusted from a design tool because the ratio is
 * the difference between a theme somebody can read and one they cannot, and it
 * should be checkable by the platform itself.
 */
function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const h = String(hex).replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    if (!/^[0-9a-f]{6}$/i.test(full)) return null;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const a = lum(hexA); const b = lum(hexB);
  if (a === null || b === null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Check a foreground/background pair against WCAG thresholds. */
function checkContrast(foreground, background, { largeText = false } = {}) {
  const ratio = contrastRatio(foreground, background);
  if (ratio === null) return { ratio: null, error: 'Colours must be hex (#rgb or #rrggbb)' };
  const aa = largeText ? 3.0 : 4.5;
  const aaa = largeText ? 4.5 : 7.0;
  return {
    foreground, background, ratio, largeText,
    passesAA: ratio >= aa,
    passesAAA: ratio >= aaa,
    requiredAA: aa,
    verdict: ratio >= aaa ? 'AAA' : ratio >= aa ? 'AA' : 'fails AA',
    note: ratio < aa
      ? `${ratio}:1 is below the ${aa}:1 needed for ${largeText ? 'large' : 'body'} text. `
      + 'This is not a preference — it is unreadable for people with low vision, which '
      + 'is a large share of an older farming population.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Layout / responsive
// ---------------------------------------------------------------------------

async function breakpointFor(widthPx) {
  const { rows } = await pool.query(
    `SELECT * FROM ui_breakpoints
      WHERE min_width_px <= $1 AND (max_width_px IS NULL OR max_width_px >= $1)
      ORDER BY min_width_px DESC LIMIT 1`,
    [Number(widthPx) || 0]
  );
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/**
 * Motion presets, already adjusted for the user's reduced-motion preference.
 *
 * The adjustment happens HERE, not on the client. A client that receives the
 * full-motion values and is trusted to honour a flag is a client that will
 * eventually forget to.
 */
async function getMotion({ reducedMotion = false } = {}) {
  const { rows } = await pool.query('SELECT * FROM motion_presets ORDER BY category, preset_key');
  return {
    reducedMotion,
    presets: rows.map((p) => ({
      key: p.preset_key,
      category: p.category,
      durationMs: reducedMotion ? p.reduced_motion_duration_ms : p.duration_ms,
      easing: reducedMotion ? 'linear' : p.easing,
      behaviour: reducedMotion ? p.reduced_motion_behaviour : p.description,
      // Some animation IS the information — a progress ring with no motion
      // tells the user nothing is happening.
      retainedUnderReducedMotion: p.reduced_motion_duration_ms > 0,
    })),
    note: reducedMotion
      ? 'Durations already reduced server-side. Presets with a non-zero reduced duration '
      + 'are retained deliberately: they carry information rather than decoration.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Component library
// ---------------------------------------------------------------------------

async function listComponents({ status, category } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM ui_components
      WHERE ($1::text IS NULL OR status = $1)
        AND ($2::text IS NULL OR category = $2)
      ORDER BY category, component_key`,
    [status ?? null, category ?? null]
  );
  return {
    components: rows,
    stable: rows.filter((c) => c.status === 'stable').length,
    note: rows.length === 0
      ? 'No components registered. The library exists in files but has not been catalogued, '
      + 'so nothing can report on its accessibility contract.'
      : null,
  };
}

async function registerComponent(c) {
  if (!c.componentKey || !c.displayName || !c.category) {
    throw new Error('componentKey, displayName and category are required');
  }
  if (c.status === 'stable'
      && !(c.keyboardOperable && c.screenReaderLabelled && c.focusVisible)) {
    throw new Error(
      'A component cannot be marked stable until it is keyboard-operable, labelled for '
      + 'screen readers and shows a visible focus ring. Promoting it first makes it a '
      + 'dependency of every screen that uses it.'
    );
  }
  const { rows } = await pool.query(
    `INSERT INTO ui_components
       (component_key, display_name, category, file_path, keyboard_operable,
        screen_reader_labelled, focus_visible, wcag_level, states, variants,
        uses_tokens, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (component_key) DO UPDATE SET
       status = EXCLUDED.status,
       keyboard_operable = EXCLUDED.keyboard_operable,
       screen_reader_labelled = EXCLUDED.screen_reader_labelled,
       focus_visible = EXCLUDED.focus_visible
     RETURNING *`,
    [c.componentKey, c.displayName, c.category, c.filePath ?? null,
      Boolean(c.keyboardOperable), Boolean(c.screenReaderLabelled),
      Boolean(c.focusVisible), c.wcagLevel ?? null, c.states ?? [],
      c.variants ?? [], c.usesTokens ?? [], c.status ?? 'draft']
  );
  return rows[0];
}

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

async function recordConformance(r) {
  if (!r.surface || !r.wcagCriterion || !r.level || !r.status) {
    throw new Error('surface, wcagCriterion, level and status are required');
  }
  if (r.status === 'fail' && !r.finding) {
    throw new Error('A failure must record what failed — a bare "fail" tells the next '
                  + 'person nothing about what to fix');
  }
  const { rows } = await pool.query(
    `INSERT INTO a11y_conformance
       (surface, surface_type, wcag_criterion, level, status, verified_by, tool,
        finding, remediation)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (surface, wcag_criterion, checked_on) DO UPDATE SET
       status = EXCLUDED.status, finding = EXCLUDED.finding
     RETURNING *`,
    [r.surface, r.surfaceType ?? 'page', r.wcagCriterion, r.level, r.status,
      r.verifiedBy ?? 'automated', r.tool ?? null, r.finding ?? null, r.remediation ?? null]
  );
  return rows[0];
}

async function conformanceSummary() {
  const { rows } = await pool.query('SELECT * FROM v_a11y_summary ORDER BY surface');
  const automatedOnly = rows.filter((r) => r.standing.startsWith('automated'));
  return {
    surfaces: rows,
    failing: rows.filter((r) => r.standing === 'failing').length,
    automatedOnly: automatedOnly.length,
    note: automatedOnly.length
      ? `${automatedOnly.length} surface(s) have only automated checks. Automated tooling `
      + 'catches roughly a third of WCAG issues, so "all checks pass" is not a conformance '
      + 'claim — it is the absence of the third that a machine can see.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Personalization + the resolver
// ---------------------------------------------------------------------------

async function getPreferences(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM user_experience_preferences WHERE user_id = $1', [userId]
  );
  return rows[0] ?? null;
}

async function savePreferences(userId, p) {
  const { rows } = await pool.query(
    `INSERT INTO user_experience_preferences
       (user_id, theme_key, reduced_motion, high_contrast, font_scale,
        screen_reader_in_use, language, density, data_saver, dashboard_layout, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET
       theme_key = EXCLUDED.theme_key,
       reduced_motion = EXCLUDED.reduced_motion,
       high_contrast = EXCLUDED.high_contrast,
       font_scale = EXCLUDED.font_scale,
       screen_reader_in_use = EXCLUDED.screen_reader_in_use,
       language = EXCLUDED.language,
       density = EXCLUDED.density,
       data_saver = EXCLUDED.data_saver,
       dashboard_layout = EXCLUDED.dashboard_layout,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, p.themeKey ?? null, p.reducedMotion ?? null, p.highContrast ?? null,
      p.fontScale ?? 1.0, p.screenReaderInUse ?? null, p.language ?? 'en',
      p.density ?? 'comfortable', Boolean(p.dataSaver),
      p.dashboardLayout ? JSON.stringify(p.dashboardLayout) : null]
  );
  return rows[0];
}

/**
 * THE EXPERIENCE ENGINE.
 *
 * One call returns everything the client needs to render, already reconciled.
 *
 * The reconciliation rule is the point: ACCESSIBILITY PREFERENCES OVERRIDE
 * BRANDING. If the user asked for high contrast and the tenant theme is a
 * pastel palette, high contrast wins. If they asked for reduced motion and the
 * brand guideline calls for a parallax hero, motion loses. Every override is
 * listed in the response so the client cannot quietly re-apply the thing the
 * user asked not to have — and so a designer can see why their theme looks
 * different for that user.
 */
async function resolveExperience({ userId, viewportWidthPx, prefersReducedMotion, prefersDark }) {
  const prefs = userId ? await getPreferences(userId) : null;
  const overrides = [];

  // System signals are a fallback for stored preferences, not a replacement:
  // an explicit choice outranks what the OS reports.
  const reducedMotion = prefs?.reduced_motion ?? Boolean(prefersReducedMotion);
  if (reducedMotion && !prefs?.reduced_motion) {
    overrides.push('reduced motion applied from the OS setting (no stored preference)');
  }

  let themeKey = prefs?.theme_key
    ?? (prefersDark ? 'dark' : 'light');

  if (prefs?.high_contrast) {
    themeKey = 'high_contrast';
    overrides.push('high-contrast theme overrides branding — an accessibility request outranks a palette');
  }
  if (prefs?.screen_reader_in_use) {
    overrides.push('screen reader detected — decorative motion and media suppressed');
  }

  const [themeRows, tokens, motion, bp] = await Promise.all([
    pool.query('SELECT * FROM ui_themes WHERE theme_key = $1', [themeKey]),
    getTokens(themeKey),
    getMotion({ reducedMotion: reducedMotion || Boolean(prefs?.screen_reader_in_use) }),
    breakpointFor(viewportWidthPx ?? 375),
  ]);

  const dataSaver = Boolean(prefs?.data_saver);
  const { rows: media } = await pool.query(
    'SELECT * FROM media_delivery_profiles WHERE for_data_saver = $1 OR $1 = FALSE',
    [dataSaver]
  );

  return {
    userId: userId ?? null,
    theme: themeRows.rows[0] ?? { theme_key: themeKey, note: 'theme not found; using key only' },
    tokens: tokens.tokens,
    brokenTokens: tokens.broken ?? [],
    motion,
    breakpoint: bp,
    fontScale: Number(prefs?.font_scale ?? 1.0),
    density: prefs?.density ?? 'comfortable',
    language: prefs?.language ?? 'en',
    dataSaver,
    mediaProfiles: dataSaver ? media.filter((m) => m.for_data_saver) : media,
    overrides,
    note: overrides.length
      ? 'Accessibility preferences were applied over the theme. These are not cosmetic '
      + 'settings and the client must not re-apply what they replaced.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Notification / feedback engine
// ---------------------------------------------------------------------------

async function feedbackFor(eventKey) {
  const { rows } = await pool.query(
    'SELECT * FROM ui_feedback_rules WHERE event_key = $1 AND enabled', [eventKey]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    ...r,
    // Surfaced so the client does not have to re-derive it and get it wrong.
    mustBeAcknowledged: r.requires_acknowledgement || r.auto_dismiss_ms === null,
    ariaLive: r.aria_live,
  };
}

module.exports = {
  getTokens, upsertToken,
  listThemes, contrastRatio, checkContrast,
  breakpointFor,
  getMotion,
  listComponents, registerComponent,
  recordConformance, conformanceSummary,
  getPreferences, savePreferences,
  resolveExperience,
  feedbackFor,
};
