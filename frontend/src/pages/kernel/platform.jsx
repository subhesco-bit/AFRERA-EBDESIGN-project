import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function PlatformPage() {
  const { data, loading, error } = useKernelGet('/erp/platform-demo');
  return (
    <KernelShell title="Platform" subtitle="ERP platform composed from village books (demo data). No invented ₹." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Blocking', data.blocking], ['Deferred', data.deferred], ['Trial balance rows', data.trialBalance.length], ['Statements', data.statements.length]]} />
        <h3 className="font-semibold mb-2">Exceptions</h3>
        <div className="grid gap-2">
          {data.exceptions.map((e) => (
            <div key={e.code} className="p-3 border border-gray-200 rounded-lg text-sm">
              <div className="font-medium">{e.code} — {e.title}</div>
              <p className="text-gray-600">{e.body}</p>
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
