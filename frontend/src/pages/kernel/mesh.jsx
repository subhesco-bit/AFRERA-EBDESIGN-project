import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid } from './KernelShell';

export default function MeshPage() {
  const { data, loading, error } = useKernelGet('/lattice/stats');
  return (
    <KernelShell title="Mesh" subtitle="32 organs, 138 core+mesh bridges. Integrity is weighted living + 45% partial." loading={loading} error={error}>
      {data && <>
        <StatGrid stats={[['Integrity', data.integrity + '%'], ['Bridges', data.bridges], ['Living', data.living], ['Partial', data.partial], ['Missing', data.missing], ['Organs', data.organs], ['Isolated', data.isolated], ['Weak', data.weak]]} />
        <p className="text-sm text-gray-600">Technical ligaments: {data.technical} · Thoughtful ligaments: {data.thoughtful}</p>
      </>}
    </KernelShell>
  );
}
