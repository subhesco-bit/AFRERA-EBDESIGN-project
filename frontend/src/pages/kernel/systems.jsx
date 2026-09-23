import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid, StatusBadge } from './KernelShell';

export default function SystemsPage() {
  const { data, loading, error } = useKernelGet('/systems/audit');
  return (
    <KernelShell title="Systems" subtitle="Byte-verified forensic audit of this repository's own AI service files." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Systems', data.stats.systems], ['WIRED but skeleton', data.stats.wiredButSkeleton], ['Duplicates', data.stats.duplicates], ['Module dirs', data.stats.moduleDirs]]} />
        <div className="grid gap-2">
          {data.systems.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-2 border-b border-gray-100 text-sm">
              <span>{s.name} <span className="text-gray-400 text-xs">{s.path}</span></span>
              <StatusBadge status={s.actual} />
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
