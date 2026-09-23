import { useKernelGet } from './useKernelApi';
import KernelShell from './KernelShell';

export default function SharePage() {
  const { data, loading, error } = useKernelGet('/share/assets');
  return (
    <KernelShell title="Share" subtitle="Village muscle. Hours conserved. Rent and GST invoice refused — never invented." loading={loading} error={error}>
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((a) => (
          <div key={a.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="font-semibold">{a.name}</div>
            <p className="text-sm text-gray-600">{a.hours}h capacity · {a.kind}/{a.mode}</p>
            <p className="text-xs text-gray-500 mt-1">{a.present}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
