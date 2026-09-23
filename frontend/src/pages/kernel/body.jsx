import { useKernelGet } from './useKernelApi';
import KernelShell, { StatusBadge } from './KernelShell';

export default function BodyPage() {
  const { data, loading, error } = useKernelGet('/body/parts');
  return (
    <KernelShell title="Body" subtitle="Eleven named gates on the kernel: skin, eye, ear, heart, vein, muscle, relax, ligament, hand, finger, feet." loading={loading} error={error}>
      <div className="grid gap-3">
        {data?.map((p) => (
          <div key={p.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{p.name} <span className="text-gray-400 font-normal">— {p.human}</span></span>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-gray-600">{p.present}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
