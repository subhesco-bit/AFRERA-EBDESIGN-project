/**
 * Experience Layer / DXP console.
 *
 * The screen where the design system can be checked rather than admired.
 *
 * The contrast checker is the part that earns its place. A colour pair looks
 * fine to whoever picked it — the ratio is the only thing that says whether
 * someone with low vision can read it, and on a platform whose users skew
 * older and often work outdoors in glare, that is not a compliance checkbox.
 */
import React, { useState, useEffect } from 'react'
import { experienceAPI } from '../services/api'
import {
  ModulePage, Section, Field, Value, AsyncState, DataTable,
} from '../components/common/DataPrimitives'

export default function ExperienceLayerPage() {
  const [themes, setThemes] = useState(null)
  const [motion, setMotion] = useState(null)
  const [components, setComponents] = useState(null)
  const [a11y, setA11y] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [pair, setPair] = useState({ fg: '#1f2328', bg: '#ffffff', large: false })
  const [contrast, setContrast] = useState(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const [t, m, c, a] = await Promise.all([
          experienceAPI.themes(),
          experienceAPI.motion(false),
          experienceAPI.components({}),
          experienceAPI.accessibility().catch(() => ({ data: { data: null } })),
        ])
        setThemes(t.data?.data); setMotion(m.data?.data)
        setComponents(c.data?.data); setA11y(a.data?.data)
      } catch (e) { setError(e.response?.data?.error || e.message) } finally { setLoading(false) }
    })()
  }, [])

  const check = async (e) => {
    e.preventDefault()
    try {
      const r = await experienceAPI.contrast(pair.fg, pair.bg, pair.large)
      setContrast(r.data?.data)
    } catch (err) { setContrast({ error: err.message }) }
  }

  const toggleMotion = async (next) => {
    setReduced(next)
    try { const m = await experienceAPI.motion(next); setMotion(m.data?.data) } catch { /* keep previous */ }
  }

  return (
    <ModulePage
      title="Experience layer"
      subtitle="Design system, themes, motion, components and accessibility conformance — the 15 engines, checkable rather than assumed."
      migration="060 (DXP)"
    >
      <AsyncState loading={loading} error={error}>
        <>
          <Section title="Contrast checker"
            description="WCAG AA needs 4.5:1 for body text and 3:1 for large text. Below that, text is not hard to read — it is unreadable for a significant number of people.">
            <form onSubmit={check} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Field label="Foreground" id="xp-fg">
                <input id="xp-fg" value={pair.fg} onChange={(e) => setPair((p) => ({ ...p, fg: e.target.value }))} />
              </Field>
              <Field label="Background" id="xp-bg">
                <input id="xp-bg" value={pair.bg} onChange={(e) => setPair((p) => ({ ...p, bg: e.target.value }))} />
              </Field>
              <label htmlFor="xp-large" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}>
                <input id="xp-large" type="checkbox" checked={pair.large}
                  onChange={(e) => setPair((p) => ({ ...p, large: e.target.checked }))} />
                Large text (18pt+ or 14pt bold)
              </label>
              <button type="submit">Check</button>
            </form>

            {contrast && !contrast.error && (
              <div style={{ marginTop: 16, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  background: contrast.background, color: contrast.foreground,
                  padding: '18px 22px', borderRadius: 8, border: '1px solid #d0d7de',
                  fontSize: contrast.largeText ? 22 : 15,
                }}>
                  Sample text at this pairing
                </div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 600 }}>{contrast.ratio}:1</div>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: contrast.passesAA ? '#1a7f37' : '#cf222e',
                  }}>
                    {contrast.verdict}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted,#888)' }}>
                    needs {contrast.requiredAA}:1 for AA
                  </div>
                </div>
                {contrast.note && (
                  <p role="alert" style={{ flexBasis: '100%', margin: 0, color: '#cf222e', fontSize: 14 }}>
                    {contrast.note}
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section title="Themes">
            {themes?.note && (
              <p role="note" style={{ background: '#fff8c5', border: '1px solid #d4a72c66',
                borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>{themes.note}</p>
            )}
            <DataTable
              caption="Registered themes"
              emptyMessage="No themes registered."
              columns={[
                { key: 'theme_key', label: 'Key' },
                { key: 'display_name', label: 'Name' },
                { key: 'color_scheme', label: 'Scheme' },
                { key: 'min_contrast_ratio', label: 'Min contrast', numeric: true },
                { key: 'honors_reduced_motion', label: 'Honours reduced motion',
                  render: (r) => (r.honors_reduced_motion ? 'yes' : 'NO') },
                { key: 'contrast_verified_on', label: 'Verified',
                  render: (r) => r.contrast_verified_on || 'never' },
              ]}
              rows={themes?.themes || []}
              rowKey={(r) => r.theme_key}
            />
          </Section>

          <Section title="Motion presets"
            description="Every preset declares what it does under prefers-reduced-motion. Presets with a non-zero reduced duration are kept deliberately — they carry information, not decoration.">
            <label htmlFor="xp-reduced" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14, marginBottom: 10 }}>
              <input id="xp-reduced" type="checkbox" checked={reduced}
                onChange={(e) => toggleMotion(e.target.checked)} />
              Preview with reduced motion
            </label>
            <DataTable
              caption="Motion presets"
              columns={[
                { key: 'key', label: 'Preset' },
                { key: 'category', label: 'Category' },
                { key: 'durationMs', label: 'Duration (ms)', numeric: true },
                { key: 'easing', label: 'Easing' },
                { key: 'behaviour', label: 'Behaviour' },
                { key: 'retainedUnderReducedMotion', label: 'Kept when reduced',
                  render: (r) => (r.retainedUnderReducedMotion ? 'yes — carries information' : 'suppressed') },
              ]}
              rows={motion?.presets || []}
              rowKey={(r) => r.key}
            />
          </Section>

          <Section title="Component library"
            description="A component cannot be marked stable until it is keyboard-operable, labelled for screen readers, and shows a visible focus ring.">
            {components?.note && (
              <p role="status" style={{ color: 'var(--muted,#888)', fontSize: 14 }}>{components.note}</p>
            )}
            <DataTable
              caption="Registered components"
              emptyMessage="No components catalogued yet."
              columns={[
                { key: 'component_key', label: 'Component' },
                { key: 'category', label: 'Category' },
                { key: 'status', label: 'Status' },
                { key: 'keyboard_operable', label: 'Keyboard', render: (r) => (r.keyboard_operable ? 'yes' : 'no') },
                { key: 'screen_reader_labelled', label: 'Labelled', render: (r) => (r.screen_reader_labelled ? 'yes' : 'no') },
                { key: 'wcag_level', label: 'WCAG', render: (r) => r.wcag_level || '—' },
              ]}
              rows={components?.components || []}
              rowKey={(r) => r.component_key}
            />
          </Section>

          <Section title="Accessibility conformance">
            {a11y?.note && (
              <p role="note" style={{ background: '#fff8c5', border: '1px solid #d4a72c66',
                borderRadius: 6, padding: '10px 12px', fontSize: 14 }}>{a11y.note}</p>
            )}
            <DataTable
              caption="Conformance by surface"
              emptyMessage="No conformance results recorded. Untested is not the same as passing."
              columns={[
                { key: 'surface', label: 'Surface' },
                { key: 'criteria_checked', label: 'Checked', numeric: true },
                { key: 'passing', label: 'Pass', numeric: true },
                { key: 'failing', label: 'Fail', numeric: true },
                { key: 'human_verified', label: 'Human-verified', numeric: true },
                { key: 'standing', label: 'Standing' },
              ]}
              rows={a11y?.surfaces || []}
              rowKey={(r) => r.surface}
            />
          </Section>
        </>
      </AsyncState>
    </ModulePage>
  )
}
