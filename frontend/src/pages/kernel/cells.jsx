import { useKernelGet } from './useKernelApi';
import KernelShell from './KernelShell';

export default function CellsPage() {
  const { data, loading, error } = useKernelGet('/erp/stakeholders');
  const cellScale = data?.filter((s) => s.scale === 'person' || s.scale === 'home');
  return (
    <KernelShell title="Cells" subtitle="The farmer is a cell, not a role. Person and home-scale stakeholders." loading={loading} error={error}>
      <div className="grid gap-2">
        {cellScale?.map((s) => (
          <div key={s.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="font-medium">{s.name}</div>
            <p className="text-sm text-gray-600">{s.present}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
