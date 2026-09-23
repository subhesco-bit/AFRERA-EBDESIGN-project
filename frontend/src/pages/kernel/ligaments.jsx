import { useState } from 'react';
import { useKernelGet } from './useKernelApi';
import KernelShell, { StatusBadge } from './KernelShell';

export default function LigamentsPage() {
  const [status, setStatus] = useState('living');
  const { data, loading, error } = useKernelGet(`/lattice/bridges?status=${status}`);
  return (
    <KernelShell title="Ligaments" subtitle="Every named joint. Living fire. Missing stay dashed — never painted living." loading={loading} error={error}>
      <div className="flex gap-2 mb-4">
        {['living', 'missing', 'partial', 'all'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-full text-sm border ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>{s}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {data?.slice(0, 30).map((b) => (
          <div key={b.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{b.name} <span className="text-gray-400 text-xs">{b.from} → {b.to}</span></span>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-xs text-gray-500">{b.today}</p>
          </div>
        ))}
        {data?.length === 0 && <p className="text-gray-500">No bridges match.</p>}
      </div>
    </KernelShell>
  );
}
