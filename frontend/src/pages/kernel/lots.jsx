import { useKernelGet } from './useKernelApi';
import KernelShell from './KernelShell';

export default function LotsPage() {
  const { data, loading, error } = useKernelGet('/erp/stakeholders');
  return (
    <KernelShell title="Lots / Cells" subtitle="Eighteen roles, person → home → village. Clerk writes rupees. Companion/brain propose only." loading={loading} error={error}>
      <div className="grid gap-2">
        {data?.map((s) => (
          <div key={s.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex justify-between">
              <span className="font-medium">{s.name}</span>
              <span className="text-xs text-gray-400 uppercase">{s.scale} · writes: {s.writes}</span>
            </div>
            <p className="text-sm text-gray-600">{s.present}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
