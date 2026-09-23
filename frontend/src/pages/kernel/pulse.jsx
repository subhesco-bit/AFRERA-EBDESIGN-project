import { useKernelGet } from './useKernelApi';
import KernelShell from './KernelShell';

export default function PulsePage() {
  const { data, loading, error } = useKernelGet('/lattice/walk');
  return (
    <KernelShell title="Pulse" subtitle={data?.lede} loading={loading} error={error}>
      <h2 className="text-lg font-semibold mb-4">{data?.title}</h2>
      <div className="space-y-3">
        {data?.hops.map((h, i) => (
          <div key={h.id} className="p-4 border-l-2 border-blue-300 pl-4">
            <div className="font-medium">{i + 1}. {h.title}</div>
            <p className="text-sm text-gray-600 mt-1"><strong>Today:</strong> {h.today}</p>
            <p className="text-sm text-gray-500 mt-1"><strong>Should:</strong> {h.should}</p>
          </div>
        ))}
      </div>
    </KernelShell>
  );
}
