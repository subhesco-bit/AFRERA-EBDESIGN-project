import { useState } from 'react';
import { useKernelGet, useKernelPost } from './useKernelApi';
import KernelShell from './KernelShell';

export default function VetPage() {
  const { data: species, loading, error } = useKernelGet('/vet/species');
  const { data: proposal, run, loading: proposing } = useKernelPost();
  const [selected, setSelected] = useState('cattle');

  return (
    <KernelShell title="Vet" subtitle="AFRERA-VET: August AI proposes village codes. Clerk/vet confirms. Human ICD is the wrong genome." loading={loading} error={error}>
      <div className="flex gap-2 flex-wrap mb-4">
        {species?.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.id)} className={`px-3 py-1 rounded-full text-sm border ${selected === s.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}>{s.name}</button>
        ))}
      </div>
      <button
        disabled={proposing}
        onClick={() => run('/vet/propose', { species: selected, signs: ['hot-udder', 'clotted-milk'] })}
        className="mb-4 px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50"
      >
        {proposing ? 'Proposing…' : `Propose a code for ${selected}`}
      </button>
      {proposal && (
        <div className="p-4 border border-teal-200 bg-teal-50 rounded-lg">
          <div className="font-semibold">{proposal.decision} {proposal.code && `— ${proposal.code.label} (${proposal.code.id})`}</div>
          <p className="text-sm text-gray-700 mt-1">{proposal.reason}</p>
        </div>
      )}
    </KernelShell>
  );
}
