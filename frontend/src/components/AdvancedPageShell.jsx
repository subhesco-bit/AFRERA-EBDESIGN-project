import { ArrowRight, BellRing, CheckCircle2, CircleDashed, Cpu, Gauge, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function StatCard({ label, value, trend, tone = 'emerald' }) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-sky-200 bg-sky-50 text-sky-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-slate-600">{trend}</div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, tone = 'bg-emerald-500' }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AdvancedPageShell({
  title,
  description,
  featureName,
  stats = [],
  actions = [],
  insights = [],
  priorities = [],
  feed = [],
}) {
  const defaultStats = [
    { label: 'Operational health', value: '96.4%', trend: '+4.2%', tone: 'emerald' },
    { label: 'Growth signal', value: '₹18.6L', trend: '+12.8%', tone: 'blue' },
    { label: 'AI readiness', value: 'Online', trend: 'Live', tone: 'violet' },
    { label: 'Risk exposure', value: 'Low', trend: '-8.1%', tone: 'amber' },
  ];

  const defaultActions = [
    'Review module contract',
    'Connect backend endpoints',
    'Validate AI integration',
  ];

  const defaultInsights = [
    'Farm demand remains elevated across the Northeast corridor with strong pricing momentum.',
    'Inventory utilization is stable with a healthy margin buffer for the next cycle.',
    'Recommended actions are aligned with current operational constraints and compliance requirements.',
  ];

  const defaultPriorities = [
    { label: 'Field execution', value: 82, tone: 'bg-emerald-500' },
    { label: 'Market coverage', value: 74, tone: 'bg-sky-500' },
    { label: 'Compliance', value: 91, tone: 'bg-violet-500' },
    { label: 'Automation', value: 68, tone: 'bg-amber-500' },
  ];

  const defaultFeed = [
    { title: 'Logistics lane rebalanced', detail: '15-minute improvement in delivery window forecasting.', time: '2h ago' },
    { title: 'Soil advisory generated', detail: 'Crop health threshold recommendations issued for 12 plots.', time: '4h ago' },
    { title: 'Payment batch cleared', detail: 'New settlements reconciled against cooperative ledger.', time: 'Today' },
  ];

  const safeStats = stats.length ? stats : defaultStats;
  const safeActions = actions.length ? actions : defaultActions;
  const safeInsights = insights.length ? insights : defaultInsights;
  const safePriorities = priorities.length ? priorities : defaultPriorities;
  const safeFeed = feed.length ? feed : defaultFeed;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 shadow-2xl shadow-slate-200/60">
        <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Launch readiness
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-200 md:text-base">{description}</p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Status</div>
              <div className="text-sm font-semibold text-white">System ready for rollout</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {safeStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} trend={item.trend} tone={item.tone} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Gauge className="h-5 w-5 text-violet-600" />
              {featureName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Cpu className="h-3.5 w-3.5" />
                  Data layer
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">Active</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Security
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">Ready</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <Zap className="h-3.5 w-3.5" />
                  AI mode
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">Online</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Operational coverage
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {safeActions.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <BellRing className="h-5 w-5 text-amber-500" />
              Insights & focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
              <div className="mb-2 font-semibold">What is complete</div>
              <p className="leading-6">
                The page shell, layout, operational cards, and launch-ready UX are in place. The module is ready for final backend contract wiring and release-specific refinement.
              </p>
            </div>

            <div className="space-y-4">
              {safeInsights.map((insight) => (
                <div key={insight} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              {safeActions.slice(0, 3).map((action) => (
                <Button key={action} variant="outline" className="w-full justify-between rounded-xl border-slate-200 bg-white hover:bg-slate-50">
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ))}
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
            {safePriorities.map((item) => (
              <ProgressRow key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeFeed.map((item) => (
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
