import { Link } from 'react-router-dom';
import { ArrowRight, Route } from 'lucide-react';

function stageStatusStyle(status) {
  switch (status) {
    case 'complete':
      return { ring: 'border-emerald-500 bg-emerald-50 text-emerald-900', dot: 'bg-emerald-600', label: 'Complete' };
    case 'in_progress':
      return { ring: 'border-amber-400 bg-amber-50 text-amber-950', dot: 'bg-amber-500', label: 'In progress' };
    case 'blocked':
      return { ring: 'border-red-400 bg-red-50 text-red-900', dot: 'bg-red-500', label: 'Blocked' };
    case 'optional':
      return { ring: 'border-slate-300 bg-slate-50 text-slate-700', dot: 'bg-slate-400', label: 'Optional' };
    default:
      return { ring: 'border-slate-200 bg-white text-slate-600', dot: 'bg-slate-300', label: 'Unknown' };
  }
}

/**
 * Lifecycle stage strip — status comes only from plan.stages (backend).
 * Never invents a stage state.
 */
export default function StageTimeline({ stages }) {
  if (!stages?.length) return null;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Lifecycle stages">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-950">Lifecycle stages</h2>
        </div>
        <p className="text-xs text-slate-500">Derived from verified plan data — not estimated</p>
      </div>
      <ol className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((s, index) => {
          const style = stageStatusStyle(s.status);
          const card = (
            <div className={`min-w-[140px] flex-1 rounded-2xl border-2 px-3 py-3 ${style.ring}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{style.label}</span>
              </div>
              <div className="mt-2 text-sm font-bold leading-tight">{s.label}</div>
              <div className="mt-1 text-[11px] leading-4 opacity-80">{s.detail}</div>
            </div>
          );
          return (
            <li key={s.id} className="flex items-stretch gap-2">
              {s.href ? (
                <Link to={s.href} className="block hover:opacity-90">{card}</Link>
              ) : (
                card
              )}
              {index < stages.length - 1 && (
                <span className="hidden self-center text-slate-300 sm:inline" aria-hidden="true">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function exportPlanJson(plan) {
  if (!plan) return;
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `value-chain-plan-${plan.productId || 'export'}-${String(plan.generatedAt || '').slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
