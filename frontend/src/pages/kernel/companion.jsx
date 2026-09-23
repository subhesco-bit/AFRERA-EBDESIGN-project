import { useEffect } from 'react';
import { useKernelPost } from './useKernelApi';
import KernelShell from './KernelShell';

const DEMO_BOOKS = {
  lots: [{ id: 'lot-1', variety: 'Chakhao Poireiton', remainingGrams: 180000, status: 'minted', cellId: 'c1', cellName: 'Enghi' }],
  orders: [{ id: 'o1', cellName: 'Enghi', variety: 'Chakhao', qtyGrams: 40000, buyer: 'Guwahati Mandi', status: 'open', lotId: 'lot-1' }],
  cells: [{ id: 'c2', name: 'Ronghang', household: 'Ronghang house', lotCount: 0 }],
  herd: [], weatherAlerts: [], energyWindows: [], iotReadings: [], kpis: { journalBalanced: true },
};

export default function CompanionPage() {
  const { data, loading, error, run } = useKernelPost();
  useEffect(() => { run('/companion/propose', { books: DEMO_BOOKS, gates: [] }); }, [run]);

  return (
    <KernelShell title="Companion" subtitle="Proposes. A clerk approves. Never writes ₹." loading={loading} error={error}>
      {data && <>
        <p className="text-sm text-gray-600 mb-4">{data.memory}</p>
        <div className="grid gap-3">
          {data.proposals.map((p) => (
            <div key={p.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="font-semibold">{p.title}</div>
              <p className="text-sm text-gray-600">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">{data.firewall}</p>
      </>}
    </KernelShell>
  );
}
