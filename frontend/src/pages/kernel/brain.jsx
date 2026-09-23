import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid, StatusBadge } from './KernelShell';

export default function BrainPage() {
  const { data, loading, error } = useKernelGet('/brain/ai-atlas');
  const { data: tissues } = useKernelGet('/brain/tissues');
  return (
    <KernelShell title="Brain" subtitle="One cortex, five tissues fire on a named signal. Clerk still writes remaining." loading={loading} error={error}>
      {data && <StatGrid stats={[['Units', data.score.units], ['Living', data.score.living], ['Partial', data.score.partial], ['Refused', data.score.refused]]} />}
      <h3 className="font-semibold mb-2">Tissues</h3>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {tissues?.map((t) => (
          <div key={t.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="font-medium">{t.name}</div>
            <p className="text-sm text-gray-600">{t.living}</p>
          </div>
        ))}
      </div>
      <h3 className="font-semibold mb-2">AI Units ({data?.units.length})</h3>
      <div className="grid gap-2">
        {data?.units.slice(0, 15).map((u) => (
          <div key={u.id} className="flex items-center justify-between p-2 border-b border-gray-100 text-sm">
            <span>{u.name}</span>
            <StatusBadge status={u.status} />
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
