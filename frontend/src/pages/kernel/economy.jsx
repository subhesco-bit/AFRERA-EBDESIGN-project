import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function EconomyPage() {
  const { data, loading, error } = useKernelGet('/tokens/economy');
  return (
    <KernelShell title="Economy" subtitle={data?.thesis} loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Saved', data.savedPct + '%'], ['Batch saved', data.batchSavedPct + '%'], ['LLM calls', data.llmCalls], ['Cache hits', data.cacheHits]]} />
        <h3 className="font-semibold mb-2">Plugins</h3>
        <div className="grid gap-2">
          {data.plugins.map((p) => (
            <div key={p.id} className="flex justify-between text-sm p-2 border-b border-gray-100">
              <span>{p.label}</span>
              <span className="text-gray-500">{p.tokens} tok — {p.body.slice(0, 60)}</span>
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
