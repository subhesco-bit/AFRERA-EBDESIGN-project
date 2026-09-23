import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function OrganismPage() {
  const { data, loading, error } = useKernelGet('/organism');
  return (
    <KernelShell title="Organism" subtitle="Boot, diagnose, consult. Persists to PostgreSQL when configured; falls back to in-memory otherwise." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Auto-op', data.autoOp], ['Library cards', data.libraryCards], ['Bindings', data.bindings], ['Persisted', String(data.persisted)]]} />
        <p className="text-sm text-gray-600 mb-2">Booted: {data.bootedAt || 'not yet'}</p>
        <p className="text-sm text-gray-600">{data.diagnosis?.verdict}</p>
      </>}
    </KernelShell>
  );
}
