import { useKernelGet } from './useKernelApi';
import KernelShell, { StatGrid, StatusBadge } from './KernelShell';
import { useLattice } from '../../lib/latticeStore';

/**
 * Lattice concept/bridge explorer. Real backend: /lattice/stats,
 * /lattice/concepts, /lattice/concepts/:id, /lattice/bridges
 * (backend/src/routes/afreraKernel.js -> backend/src/lib/lattice).
 * State (selection, filters, proposal drafts, showMesh) is the ported
 * pine-shadow src/lib/lattice/store.ts (frontend/src/lib/latticeStore.js).
 */
export default function MeshPage() {
  const { data: stats, loading: statsLoading, error: statsError } = useKernelGet('/lattice/stats');
  const { data: concepts, loading: conceptsLoading } = useKernelGet('/lattice/concepts');
  const {
    selectedConceptId, selectConcept,
    statusFilter, setStatusFilter,
    query, setQuery,
    proposed, toggleProposed,
    showMesh, setShowMesh,
  } = useLattice();
  const { data: detail, loading: detailLoading } = useKernelGet(
    selectedConceptId ? `/lattice/concepts/${selectedConceptId}` : '/lattice/concepts',
  );

  const filteredConcepts = (concepts || []).filter((c) => {
    if (query && !`${c.id} ${c.name}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const bridges = (detail?.bridges || []).filter((b) => statusFilter === 'all' || b.status === statusFilter);

  return (
    <KernelShell title="Mesh" subtitle="32 organs, 138 core+mesh bridges. Integrity is weighted living + 45% partial." loading={statsLoading} error={statsError}>
      {stats && (
        <>
          <StatGrid stats={[['Integrity', stats.integrity + '%'], ['Bridges', stats.bridges], ['Living', stats.living], ['Partial', stats.partial], ['Missing', stats.missing], ['Organs', stats.organs], ['Isolated', stats.isolated], ['Weak', stats.weak]]} />
          <p className="text-sm text-gray-600 mb-6">Technical ligaments: {stats.technical} · Thoughtful ligaments: {stats.thoughtful}</p>
        </>
      )}

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organs…"
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
          {['all', 'living', 'partial', 'missing'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setShowMesh(!showMesh)}
          className={`px-3 py-1.5 rounded-lg text-sm border ${showMesh ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600'}`}
        >
          Mesh links {showMesh ? 'on' : 'off'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 border border-gray-200 rounded-lg p-2 max-h-96 overflow-y-auto">
          {conceptsLoading && <p className="text-sm text-gray-500 p-2">Loading organs…</p>}
          {filteredConcepts.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConcept(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${selectedConceptId === c.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-50'}`}
            >
              {c.name} <span className="text-xs text-gray-400">{c.id}</span>
            </button>
          ))}
        </div>

        <div className="col-span-2 border border-gray-200 rounded-lg p-4">
          {detailLoading && <p className="text-sm text-gray-500">Loading bridges…</p>}
          {detail?.concept && (
            <>
              <h3 className="font-semibold mb-2">{detail.concept.name} <span className="text-xs text-gray-400">{detail.concept.short}</span></h3>
              <div className="space-y-2">
                {bridges.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <div className="text-sm">{b.id}</div>
                      <div className="text-xs text-gray-400">{b.kind}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      {b.status === 'missing' && (
                        <button
                          onClick={() => toggleProposed(b.id)}
                          className={`text-xs px-2 py-1 rounded border ${proposed.includes(b.id) ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-500'}`}
                        >
                          {proposed.includes(b.id) ? 'Proposed' : 'Propose'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {bridges.length === 0 && <p className="text-sm text-gray-400">No bridges match this filter.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </KernelShell>
  );
}
