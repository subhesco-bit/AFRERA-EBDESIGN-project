import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../services/api'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp, Sparkles, ClipboardCheck, Workflow } from 'lucide-react'

function AnalyticsPage() {
  // v5 react-query object syntax (see LoginPage.jsx); .then(r => r.data)
  // unwraps once here, so `data` below is the real payload, not a second
  // .data hop away from it.
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsAPI.getOverview().then(r => r.data),
  })

  const metrics = useMemo(() => data?.analytics || {
    totals: {
      forms: 0,
      submissions: 0,
      activeForms: 0,
      draftForms: 0,
      approvalReady: 0
    },
    trend: [],
    recommendations: []
  }, [data])

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">AI Operations Center</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Enterprise analytics and next-best actions</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Track form momentum, workflow readiness, and AI-generated opportunities from one place.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" />
                AI-powered insights live
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Unable to load analytics right now. Please try again shortly.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label="Forms" value={metrics.totals.forms} icon={ClipboardCheck} accent="emerald" />
          <SummaryCard label="Submissions" value={metrics.totals.submissions} icon={Workflow} accent="blue" />
          <SummaryCard label="Active" value={metrics.totals.activeForms} icon={TrendingUp} accent="violet" />
          <SummaryCard label="Drafts" value={metrics.totals.draftForms} icon={ClipboardCheck} accent="amber" />
          <SummaryCard label="Approval Ready" value={metrics.totals.approvalReady} icon={Sparkles} accent="slate" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Weekly momentum</h2>
                <p className="text-sm text-slate-600">Operational trend from the current form pipeline.</p>
              </div>
            </div>
            <div className="mt-6 h-72">
              {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading analytics...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Recommended actions</h2>
            <p className="mt-1 text-sm text-slate-600">High-value steps for your operations team.</p>
            <div className="mt-5 space-y-3">
              {(metrics.recommendations || []).map((recommendation, index) => (
                <div key={`${recommendation.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{recommendation.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${priorityClasses(recommendation.priority)}`}>
                      {recommendation.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{recommendation.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, accent }) {
  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl p-2 ${accentClasses[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function priorityClasses(priority) {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-700'
    case 'medium':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-emerald-100 text-emerald-700'
  }
}

export default AnalyticsPage
