import { useState } from 'react'

const ACCENT_TEXT = {
  indigo: 'text-indigo-600', emerald: 'text-emerald-600', sky: 'text-sky-600',
  amber: 'text-amber-600', rose: 'text-rose-600', teal: 'text-teal-600',
}
const ACCENT_BORDER = {
  indigo: 'border-indigo-600 text-indigo-700', emerald: 'border-emerald-600 text-emerald-700',
  sky: 'border-sky-600 text-sky-700', amber: 'border-amber-600 text-amber-700',
  rose: 'border-rose-600 text-rose-700', teal: 'border-teal-600 text-teal-700',
}

/**
 * Page chrome shared by the "management" pages added 2026-08-24 (header with
 * icon/title/description, optional stat tiles, optional tab bar). Mirrors the
 * container/heading conventions of DairyManagementPage.jsx and
 * ClimateAdvisoryPage.jsx so these new pages look native to the app.
 *
 * tabs: [{ id, label }] — when provided renders a tab bar and calls
 * children as a function (activeTab) => node; when omitted children is
 * rendered directly.
 */
export default function ManagementPageShell({ icon: Icon, title, description, accent = 'indigo', tabs, stats, children }) {
  const [tab, setTab] = useState(tabs?.[0]?.id)
  const iconColor = ACCENT_TEXT[accent] || ACCENT_TEXT.indigo
  const borderColor = ACCENT_BORDER[accent] || ACCENT_BORDER.indigo

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          {Icon && <Icon className={`w-6 h-6 mr-2 ${iconColor}`} />}
          {title}
        </h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      {stats && stats.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(stats.length, 4)} gap-4 mb-6`}>
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {tabs && tabs.length > 0 && (
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap transition ${tab === t.id ? borderColor : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {typeof children === 'function' ? children(tab) : children}
    </div>
  )
}
