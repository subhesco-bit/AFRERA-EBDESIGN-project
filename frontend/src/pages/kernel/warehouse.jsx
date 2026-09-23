import { useKernelGet } from './useKernelApi';
import KernelShell, { StatusBadge } from './KernelShell';

export default function WarehousePage() {
  const { data, loading, error } = useKernelGet('/flows/warehouse-intake/run');
  return (
    <KernelShell title="Warehouse" subtitle="The same lot body inwards. Media frames the GI marker. Pledge gate holds liens." loading={loading} error={error}>
      {data && <>
        <p className="text-sm text-gray-600 mb-3">{data.reason}</p>
        <div className="grid gap-2">
          {data.steps.map((s) => (
            <div key={s.nodeId} className="flex items-center justify-between p-2 border-b border-gray-100 text-sm">
              <span>{s.name}</span>
              <StatusBadge status={s.decision} />
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
