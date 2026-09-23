import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function OsPage() {
  const { data, loading, error } = useKernelGet('/os/catalog');
  return (
    <KernelShell title="OS" subtitle={data?.thesis?.slice(0, 160) + '…'} loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Classified', data.classified], ['Stage 0', data.stage0Pct + '%'], ['Kernel verified', data.kernelVerified], ['Open', data.open]]} />
        <div className="grid gap-2">
          {data.items.slice(0, 15).map((x) => (
            <div key={x.id} className="p-2 border-b border-gray-100 text-sm">
              <span className="font-medium">{x.name}</span> <span className="text-gray-400 text-xs">— {x.kernel} / {x.github}</span>
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
