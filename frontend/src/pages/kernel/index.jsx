import { Link } from 'react-router-dom';
import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

const PAGES = [
  ['body', 'Body', '11-part reflex kernel'], ['brain', 'Brain', '5-tissue decision cortex'],
  ['vet', 'Vet', 'AFRERA-VET veterinary coding'], ['mesh', 'Mesh', 'Lattice bridge network'],
  ['ligaments', 'Ligaments', 'Bridge catalog by status'], ['pulse', 'Pulse', 'The Chakhao lot walk'],
  ['charter', 'Charter', '18-criteria module audit'], ['companion', 'Companion', 'Living agentic proposals'],
  ['economy', 'Economy', 'Library-first token savings'], ['flows', 'Flows', '11 real process families'],
  ['ledger', 'Ledger', 'ERP atlas & trial balance'], ['library', 'Library', 'Doctrine knowledge base'],
  ['lots', 'Lots / Cells', 'Stakeholder write matrix'], ['modules', 'Modules', 'Workflow definitions'],
  ['nerve', 'Nerve', 'Consult the library'], ['organism', 'Organism', 'Boot / diagnose / consult'],
  ['os', 'OS', 'Governance & classification'], ['platform', 'Platform', 'Composed ERP platform view'],
  ['share', 'Share', 'Village shared-asset booking'], ['systems', 'Systems', 'Byte-verified AI audit'],
  ['trade', 'Trade', 'Offtake-settle flow'], ['warehouse', 'Warehouse', 'Warehouse-intake flow'],
];

export default function KernelIndexPage() {
  const { data, loading, error } = useKernelGet('/health');
  return (
    <KernelShell title="AFRERA Kernel" subtitle="Real pine-shadow-ported logic, live from backend/src/lib/ via /api/v1/afrera-kernel." loading={loading} error={error}>
      {data && <StatGrid stats={[['Status', data.status], ['Module', data.module], ['Ported', String(data.ported)]]} />}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PAGES.map(([slug, name, desc]) => (
          <Link key={slug} to={`/kernel/${slug}`} className="block p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition">
            <div className="font-semibold">{name}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </Link>
        ))}
      </div>
    </KernelShell>
  );
}
