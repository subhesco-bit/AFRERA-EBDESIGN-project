import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid, StatusBadge } from './KernelShell';

export default function LedgerPage() {
  const { data, loading, error } = useKernelGet('/erp/atlas');
  return (
    <KernelShell title="Ledger" subtitle="Rural ERP atlas: 32 SAP/Baan/Oracle analog families classified. sapParity is false." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Modules', data.score.modules], ['Living', data.score.living], ['Partial', data.score.partial], ['Missing', data.score.missing]]} />
        <div className="grid gap-2">
          {data.modules.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-2 border-b border-gray-100 text-sm">
              <span>{m.analog} <span className="text-gray-400 text-xs">({m.sap})</span></span>
              <StatusBadge status={m.status} />
            </div>
          ))}
        </div>
      </>}
    </KernelShell>
  );
}
