import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function CharterPage() {
  const { data, loading, error } = useKernelGet('/modules/charter');
  return (
    <KernelShell title="Charter" subtitle="Every concept and module scored against 18 criteria and 12 decision laws (L1–L12)." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Living checks', data.moduleLivingChecks], ['Partial', data.modulePartialChecks], ['Missing', data.moduleMissingChecks], ['Isolated organs', data.isolated]]} />
        <h3 className="font-semibold mb-2">Decision laws</h3>
        <div className="grid gap-1 mb-6">
          {data.laws.map((l) => <div key={l.id} className="text-sm"><strong>{l.id}</strong> ({l.organ}) — {l.law}</div>)}
        </div>
        <h3 className="font-semibold mb-2">Modules ({data.modules.length})</h3>
        <div className="grid gap-2">
          {data.modules.slice(0, 12).map((m) => (
            <div key={m.id} className="flex justify-between text-sm p-2 border-b border-gray-100">
              <span>{m.name}</span>
              <span className="text-gray-500">{m.living}✓ / {m.partial}◐ / {m.missing}○</span>
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
