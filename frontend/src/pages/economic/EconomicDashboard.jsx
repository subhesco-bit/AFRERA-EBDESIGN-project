import { ArrowUpRight, BarChart3, CircleDollarSign, Landmark, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const stats = [
  { label: 'Gross margin', value: '₹42.8L', trend: '+14.6%', tone: 'emerald' },
  { label: 'Market value', value: '₹91.2L', trend: '+8.9%', tone: 'blue' },
  { label: 'Cash flow', value: '₹26.4L', trend: '+5.3%', tone: 'violet' },
  { label: 'Exposure risk', value: 'Low', trend: '-2.4%', tone: 'amber' },
];

const priorities = [
  { label: 'Procurement efficiency', value: 88, tone: 'bg-emerald-500' },
  { label: 'Risk control', value: 81, tone: 'bg-sky-500' },
  { label: 'Policy adoption', value: 76, tone: 'bg-violet-500' },
  { label: 'Working capital', value: 69, tone: 'bg-amber-500' },
];

const insights = [
  'B2B agricultural trade momentum remains stable across the corridor with improved liquidity.',
  'The region is outperforming target pricing in rice and cardamom procurement clusters.',
  'Treasury controls remain healthy with a manageable hedging exposure for seasonal volatility.',
];

const feed = [
  { title: 'Segment growth improved', detail: 'High-value crop channels outperformed baseline by 11.7% this cycle.', time: '1h ago' },
  { title: 'Procurement plan updated', detail: 'Transit and storage costs were recalibrated against current market rates.', time: '3h ago' },
  { title: 'Policy alerts cleared', detail: 'Subsidy and compliance checks were reviewed and approved for release.', time: 'Today' },
];

export default function EconomicDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 shadow-2xl shadow-emerald-200/30">
        <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Economic layer
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Economic operating dashboard</h1>
            <p className="mt-3 max-w-xl text-sm text-emerald-100 md:text-base">
              Monitor market value, liquidity, procurement efficiency, risk, and policy exposure from a single decision hub.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-200">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Status</div>
              <div className="text-sm font-semibold text-white">Performance on plan</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className={`rounded-2xl border p-4 ${item.tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : item.tone === 'blue' ? 'border-sky-200 bg-sky-50 text-sky-800' : item.tone === 'violet' ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="text-2xl font-bold text-slate-900">{item.value}</div>
              <div className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-slate-600">{item.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Financial overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Landmark className="h-3.5 w-3.5" />
                  Revenue
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">₹58.4L</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Yield
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">+12.8%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Safety
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">Stable</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Economic signals
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Procurement throughput increased across the premium produce cluster, improving realized value.</span>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Warehousing utilization remains efficient and lower than seasonality benchmarks.</span>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Capital allocation remains conservative while preserving high-priority growth investments.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Decision insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {item}
              </div>
            ))}

            <div className="space-y-3 pt-2">
              <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 bg-white hover:bg-slate-50">
                Review treasury plan
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 bg-white hover:bg-slate-50">
                Adjust procurement mix
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between rounded-xl border-slate-200 bg-white hover:bg-slate-50">
                Check policy risk
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Priority performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {priorities.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.value}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feed.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{item.time}</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">{item.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

