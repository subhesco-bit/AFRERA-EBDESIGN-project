/**
 * Shared display primitives for the recovered modules.
 *
 * WHY THESE EXIST RATHER THAN PER-PAGE MARKUP
 *
 * The backend goes to real trouble to distinguish things the UI can easily
 * flatten back together:
 *
 *   null vs zero          "no data" and "the value is zero" are different
 *                         claims. A dashboard that renders null as 0 tells
 *                         someone they have no revenue when the truth is that
 *                         nothing was recorded.
 *
 *   provenance            real / estimated / assumed. The MCDA layer weights
 *                         these 1.0 / 0.7 / 0.4. If the screen shows all three
 *                         in the same typeface, that weighting is invisible.
 *
 *   a band vs a point     every forward price is low/central/high. Showing the
 *                         central figure alone converts a range into a promise.
 *
 *   claimed vs measured   stated confidence is what an agent asserts before the
 *                         fact; accuracy is what it earned afterwards.
 *
 * Putting these in one place means a new page inherits the discipline instead
 * of re-deciding it, and ARIA is built in rather than retrofitted.
 */

import React from 'react'

/* ------------------------------------------------------------------ */
/* Value — the null/zero distinction, enforced                         */
/* ------------------------------------------------------------------ */

/**
 * Render a number, or an explicit "not recorded" when it is null/undefined.
 * Never silently substitutes 0.
 */
export function Value({ value, unit = '', prefix = '', decimals = 2, emptyLabel = 'not recorded' }) {
  const missing = value === null || value === undefined || Number.isNaN(Number(value))
  if (missing) {
    return (
      <span
        className="value-missing"
        style={{ color: 'var(--muted, #888)', fontStyle: 'italic' }}
        title="No value recorded. This is an absence of data, not a zero."
      >
        {emptyLabel}
      </span>
    )
  }
  const n = Number(value)
  return (
    <span className="value">
      {prefix}
      {n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {unit ? ` ${unit}` : ''}
    </span>
  )
}

export const Rupees = ({ value, perKg = false, decimals = 2 }) => (
  <Value value={value} prefix="₹" unit={perKg ? '/kg' : ''} decimals={decimals} />
)

/* ------------------------------------------------------------------ */
/* Provenance — how much the number is worth                           */
/* ------------------------------------------------------------------ */

const PROVENANCE = {
  real: { label: 'Measured', weight: '1.0', color: '#1a7f37', bg: '#e6f4ea',
    help: 'Observed data. Weighted 1.0 in decision scoring.' },
  estimated: { label: 'Estimated', weight: '0.7', color: '#9a6700', bg: '#fff8c5',
    help: 'Derived or inferred. Weighted 0.7 in decision scoring.' },
  assumed: { label: 'Assumed', weight: '0.4', color: '#bc4c00', bg: '#ffece5',
    help: 'A working assumption, not a measurement. Weighted 0.4 in decision scoring.' },
}

/** Provenance badge. Text carries the meaning; colour only reinforces it. */
export function ProvenanceBadge({ provenance }) {
  const p = PROVENANCE[provenance] || {
    label: 'Unknown', weight: '—', color: '#57606a', bg: '#f6f8fa',
    help: 'Provenance not recorded — treat with the caution of an assumption.',
  }
  return (
    <span
      className="provenance-badge"
      style={{
        color: p.color, background: p.bg, border: `1px solid ${p.color}33`,
        borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      title={p.help}
    >
      {/* Colour alone must never carry meaning — 8% of men cannot read a
          red/green distinction, and this one changes what a number means. */}
      {p.label} · w{p.weight}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Band — never show a forecast as a single number                     */
/* ------------------------------------------------------------------ */

/**
 * A low/central/high band. The visual emphasis is deliberately on the LOW end
 * for anything a farmer might commit against: the downside is the number that
 * costs them a season if it is wrong.
 */
export function Band({ low, central, high, label = 'Forecast band', bandPct, perKg = true }) {
  return (
    <div
      className="band"
      role="group"
      aria-label={`${label}: low ${low}, central ${central}, high ${high}`}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span>
          <span style={{ fontSize: 11, color: 'var(--muted,#888)', display: 'block' }}>Low</span>
          <strong style={{ fontSize: 18 }}><Rupees value={low} perKg={perKg} /></strong>
        </span>
        <span aria-hidden="true" style={{ color: 'var(--muted,#888)' }}>—</span>
        <span>
          <span style={{ fontSize: 11, color: 'var(--muted,#888)', display: 'block' }}>Central</span>
          <span style={{ fontSize: 16 }}><Rupees value={central} perKg={perKg} /></span>
        </span>
        <span aria-hidden="true" style={{ color: 'var(--muted,#888)' }}>—</span>
        <span>
          <span style={{ fontSize: 11, color: 'var(--muted,#888)', display: 'block' }}>High</span>
          <span style={{ fontSize: 16 }}><Rupees value={high} perKg={perKg} /></span>
        </span>
      </div>
      {bandPct && (
        <p style={{ fontSize: 11, color: 'var(--muted,#888)', margin: '4px 0 0' }}>
          {bandPct} confidence band. The low end is what a commitment should be sized against.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Confidence — claimed is not the same as earned                      */
/* ------------------------------------------------------------------ */

export function ConfidenceMeter({ confidence, kind = 'claimed', threshold = 0.5 }) {
  if (confidence === null || confidence === undefined) {
    return <span style={{ color: 'var(--muted,#888)' }}>confidence unknown</span>
  }
  const pct = Math.round(Number(confidence) * (Number(confidence) <= 1 ? 100 : 1))
  const below = Number(confidence) < (Number(confidence) <= 1 ? threshold : threshold * 100)
  return (
    <span
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${kind} confidence ${pct} percent`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      <span style={{ width: 60, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
        <span style={{
          display: 'block', width: `${pct}%`, height: '100%',
          background: below ? '#bc4c00' : '#1a7f37',
        }}
        />
      </span>
      <span style={{ fontSize: 12 }}>
        {pct}% {kind}
        {below && <strong style={{ color: '#bc4c00' }}> · below advisory threshold</strong>}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Refusal — a model declining is a result, not an error               */
/* ------------------------------------------------------------------ */

/**
 * Rendered when the backend returns NO RECOMMENDATION.
 *
 * Styled as information rather than as an error. The ARP engine declining to
 * advise on an uncalibrated district is it working correctly, and showing a red
 * error box would teach people to route around the one safeguard that stops
 * the platform guessing with someone's harvest.
 */
export function RefusalNotice({ reason, whatWouldHelp = [] }) {
  return (
    <div
      role="note"
      aria-label="No recommendation available"
      style={{
        border: '1px solid #d0d7de', borderLeft: '4px solid #0969da',
        background: '#f6f8fa', borderRadius: 6, padding: '12px 14px',
      }}
    >
      <p style={{ margin: '0 0 6px', fontWeight: 600 }}>No recommendation</p>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>{reason}</p>
      {whatWouldHelp.length > 0 && (
        <>
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600 }}>What would make this answerable:</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {whatWouldHelp.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Async states — every fetch has three, and empty is not an error     */
/* ------------------------------------------------------------------ */

export function AsyncState({ loading, error, empty, emptyMessage, children }) {
  if (loading) {
    return <p role="status" aria-live="polite">Loading…</p>
  }
  if (error) {
    return (
      <div role="alert" style={{ color: '#cf222e' }}>
        <strong>Could not load.</strong> {error}
      </div>
    )
  }
  if (empty) {
    return (
      <p role="status" style={{ color: 'var(--muted,#888)' }}>
        {emptyMessage || 'Nothing recorded yet. This is an absence of data, not a zero.'}
      </p>
    )
  }
  return children
}

/* ------------------------------------------------------------------ */
/* Table — a keyboard- and screen-reader-usable table                  */
/* ------------------------------------------------------------------ */

/**
 * `columns`: [{ key, label, render?, numeric? }]
 * Numeric columns are right-aligned and get `scope="col"` headers so a screen
 * reader announces the column when reading a cell.
 */
export function DataTable({ caption, columns, rows, rowKey = (r, i) => i, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return <p role="status" style={{ color: 'var(--muted,#888)' }}>{emptyMessage || 'No rows.'}</p>
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      {/* A caption is what a screen-reader user hears first; without it a table
          is announced as "table with 8 columns" and nothing else. */}
      <caption style={{ textAlign: 'left', fontWeight: 600, padding: '6px 0' }}>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              style={{
                textAlign: c.numeric ? 'right' : 'left',
                borderBottom: '2px solid #d0d7de', padding: '6px 8px',
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={rowKey(r, i)}>
            {columns.map((c) => (
              <td
                key={c.key}
                style={{
                  textAlign: c.numeric ? 'right' : 'left',
                  borderBottom: '1px solid #eaeef2', padding: '6px 8px',
                }}
              >
                {c.render ? c.render(r) : (r[c.key] ?? <Value value={null} />)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------------ */
/* Page scaffold                                                        */
/* ------------------------------------------------------------------ */

export function ModulePage({ title, subtitle, migration, children }) {
  return (
    <main style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* One h1 per page. Screen-reader users navigate by heading level, and
          multiple h1s make that ordering meaningless. */}
      <h1 style={{ marginBottom: 4 }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--muted,#888)', marginTop: 0 }}>{subtitle}</p>}
      {migration && (
        <p style={{ fontSize: 11, color: 'var(--muted,#aaa)', marginTop: -4 }}>
          Backed by migration {migration}
        </p>
      )}
      {children}
    </main>
  )
}

export function Section({ title, children, description }) {
  return (
    <section style={{ marginTop: 28 }} aria-label={title}>
      <h2 style={{ fontSize: 17, marginBottom: 4 }}>{title}</h2>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--muted,#888)', marginTop: 0 }}>{description}</p>
      )}
      {children}
    </section>
  )
}

/** Labelled field. Every input gets a real <label>, not a placeholder. */
export function Field({ label, id, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 150 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <span id={`${id}-hint`} style={{ fontSize: 11, color: 'var(--muted,#888)' }}>{hint}</span>}
    </div>
  )
}

export default {
  Value, Rupees, ProvenanceBadge, Band, ConfidenceMeter, RefusalNotice,
  AsyncState, DataTable, ModulePage, Section, Field,
}
