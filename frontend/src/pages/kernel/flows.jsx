import { useState } from 'react';
import { useKernelGet } from './useKernelApi';
import KernelShell, { StatusBadge } from './KernelShell';

export default function FlowsPage() {
  const { data: list, loading, error } = useKernelGet('/flows');
  const [open, setOpen] = useState(null);
  const { data: run } = useKernelGet(open ? `/flows/${open}/run` : '/flows/material/run');

  return (
    <KernelShell title="Flows" subtitle="Eleven flow families. Map, do not metaphor. Finance and procure stay missing." loading={loading} error={error}>
      <div className="flex gap-2 flex-wrap mb-4">
        {list?.flows.map((f) => (
          <button key={f.id} onClick={() => setOpen(f.id)} className={`px-3 py-1 rounded-full text-sm border ${(open || 'material') === f.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>{f.name}</button>
        ))}
      </div>
      {run && <>
        <p className="text-sm text-gray-600 mb-3">{run.reason}</p>
        <div className="grid gap-2">
          {run.steps.map((s) => (
            <div key={s.nodeId} className="flex items-center justify-between p-2 border-b border-gray-100 text-sm">
              <span>{s.name} <span className="text-gray-400 text-xs">({s.algorithm})</span></span>
              <StatusBadge status={s.decision} />
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
