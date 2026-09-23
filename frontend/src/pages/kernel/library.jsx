import { useState } from 'react';
import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function LibraryPage() {
  const { data, loading, error } = useKernelGet('/library/diagnose');
  const [q, setQ] = useState('');
  const { data: hits } = useKernelGet(q ? `/library/search?q=${encodeURIComponent(q)}` : '/library/search?q=farmer');

  return (
    <KernelShell title="Library" subtitle="The organism's long-term memory. Cited or hide — never invented." loading={loading} error={error}>
      {data && <StatGrid stats={[['Cards', data.cards], ['Bindings', data.bindings], ['Reflexes answered', data.reflexesAnswered], ['Integrity', data.integrity + '%']]} />}
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the doctrine…" className="w-full p-2 border border-gray-300 rounded-lg mb-4" />
      <div className="grid gap-3">
        {hits?.map((h) => (
          <div key={h.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="font-medium text-sm">{h.title} <span className="text-gray-400 text-xs">({h.kind})</span></div>
            <p className="text-xs text-gray-600">{h.body.slice(0, 200)}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
