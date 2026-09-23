import { useState } from 'react';
import { useKernelPost } from './useKernelApi';
import KernelShell from './KernelShell';

export default function NervePage() {
  const [query, setQuery] = useState('Why did the Chakhao harvest die at the portal?');
  const { data, loading, error, run } = useKernelPost();

  return (
    <KernelShell title="Nerve" subtitle="Consult memory first. Library-first, LLM-gated." loading={false} error={error}>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg" />
        <button onClick={() => run('/organism/consult', { query })} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{loading ? 'Consulting…' : 'Consult'}</button>
      </div>
      {data && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">source: {data.source} · pulse #{data.pulseId}</div>
          <pre className="whitespace-pre-wrap text-sm">{data.reading}</pre>
        </div>
      )}
    </KernelShell>
  );
}
