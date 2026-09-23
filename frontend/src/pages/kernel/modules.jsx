import { useKernelGet } from './useKernelApi';
import KernelShell from './KernelShell';

export default function ModulesPage() {
  const { data, loading, error } = useKernelGet('/modules/workflows');
  return (
    <KernelShell title="Modules" subtitle="Durable steps. Unknown events fail. Nine real workflows on the bus." loading={loading} error={error}>
      <div className="grid gap-3">
        {data?.map((w) => (
          <div key={w.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="font-semibold">{w.name} <span className="text-gray-400 text-xs font-normal">({w.steps.length} steps)</span></div>
            <p className="text-sm text-gray-600">{w.thesis}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
