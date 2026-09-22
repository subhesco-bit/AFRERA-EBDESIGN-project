import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
// lucide-react 0.294.0 has no plain `Handshake` export — it arrived in a later
// release — so the build failed with MISSING_EXPORT. HeartHandshake is the
// handshake glyph this version ships; aliased so the usage below is unchanged.
import { BookOpen, Boxes, HeartHandshake as Handshake, Map as MapIcon, Sparkles, Cpu, Compass, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const DOORS = [
  { key: 'books', label: 'Books', icon: BookOpen, to: '/village-books', live: true },
  { key: 'lots', label: 'Lots', icon: Boxes, to: '/village-books#lots', live: true },
  { key: 'trade', label: 'Trade', icon: Handshake, to: '/value-chain-studio', live: true },
  { key: 'map', label: 'Map', icon: MapIcon, to: null, live: false },
  { key: 'companion', label: 'Companion', icon: Sparkles, to: '/ai/chat', live: true },
  { key: 'os', label: 'OS', icon: Cpu, to: '/system-administration', live: true },
];

function Pill({ children, tone = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-rose-100 text-rose-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
}

function Nav() {
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
      {DOORS.map((d) => {
        const Icon = d.icon;
        const content = (
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${d.live ? 'text-slate-700 hover:bg-slate-100' : 'cursor-not-allowed text-slate-400'}`}>
            <Icon className="h-4 w-4" />
            {d.label}
          </span>
        );
        return d.live && d.to ? (
          <Link key={d.key} to={d.to}>{content}</Link>
        ) : (
          <span key={d.key} title="Not yet built">{content}</span>
        );
      })}
      <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-400" title="Not yet built">
        <Compass className="h-4 w-4" /> Atlas
      </span>
    </nav>
  );
}

function gramsToKg(g) {
  return (Number(g) / 1000).toFixed(2);
}

function MintForm({ cells, onMinted }) {
  const [cellId, setCellId] = useState('');
  const [variety, setVariety] = useState('');
  const [grams, setGrams] = useState('');
  const [paisePerKg, setPaisePerKg] = useState('');

  const mint = useMutation({
    mutationFn: () => api.post('/lots/mint', {
      cellId, variety, grams: Number(grams), paisePerKg: Number(paisePerKg),
    }).then((r) => r.data),
    onSuccess: () => { setVariety(''); setGrams(''); setPaisePerKg(''); onMinted(); },
  });

  return (
    <form
      className="grid gap-3 sm:grid-cols-5"
      onSubmit={(e) => { e.preventDefault(); mint.mutate(); }}
    >
      <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={cellId} onChange={(e) => setCellId(e.target.value)} required>
        <option value="">Farmer cell…</option>
        {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Variety" value={variety} onChange={(e) => setVariety(e.target.value)} required />
      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Grams" type="number" min="1" value={grams} onChange={(e) => setGrams(e.target.value)} required />
      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Paise / kg" type="number" min="1" value={paisePerKg} onChange={(e) => setPaisePerKg(e.target.value)} required />
      <button type="submit" disabled={mint.isPending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {mint.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Mint lot
      </button>
      {mint.isError && <p className="sm:col-span-5 text-sm text-rose-600">{mint.error?.response?.data?.error || mint.error.message}</p>}
    </form>
  );
}

function SettleForm({ lotId, onSettled, onCancel }) {
  const [qtyGrams, setQtyGrams] = useState('');
  const [pricePaisePerKg, setPricePaisePerKg] = useState('');
  const [freightPaisePerKg, setFreightPaisePerKg] = useState('0');
  const [paymentRef, setPaymentRef] = useState('');

  const settle = useMutation({
    mutationFn: () => api.post(`/lots/${lotId}/settle`, {
      qtyGrams: Number(qtyGrams),
      pricePaisePerKg: Number(pricePaisePerKg),
      freightPaisePerKg: Number(freightPaisePerKg || 0),
      paymentRef,
    }).then((r) => r.data),
    onSuccess: () => onSettled(),
  });

  return (
    <form
      className="mt-2 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5"
      onSubmit={(e) => { e.preventDefault(); settle.mutate(); }}
    >
      <input className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Grams sold" type="number" min="1" value={qtyGrams} onChange={(e) => setQtyGrams(e.target.value)} required />
      <input className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Price paise/kg" type="number" min="1" value={pricePaisePerKg} onChange={(e) => setPricePaisePerKg(e.target.value)} required />
      <input className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Freight paise/kg" type="number" min="0" value={freightPaisePerKg} onChange={(e) => setFreightPaisePerKg(e.target.value)} />
      <input className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="paymentRef (required)" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} required />
      <div className="flex gap-1.5">
        <button type="submit" disabled={settle.isPending} className="flex-1 rounded-lg bg-slate-900 px-2 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
          {settle.isPending ? '…' : 'Settle'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">✕</button>
      </div>
      {settle.isError && <p className="sm:col-span-5 text-sm text-rose-600">{settle.error?.response?.data?.error || settle.error.message}</p>}
    </form>
  );
}

function LotRow({ lot, onChanged }) {
  const [settling, setSettling] = useState(false);
  const tone = lot.status === 'living' ? 'green' : lot.status === 'settled' ? 'slate' : 'red';

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{lot.variety}</p>
          <p className="text-xs text-slate-500">
            minted {gramsToKg(lot.minted_grams)} kg · remaining <b className="text-slate-700">{gramsToKg(lot.remaining_grams)} kg</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={tone}>{lot.status}</Pill>
          {lot.status === 'living' && (
            <button onClick={() => setSettling((s) => !s)} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
              Settle offtake <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {settling && (
        <SettleForm lotId={lot.id} onCancel={() => setSettling(false)} onSettled={() => { setSettling(false); onChanged(); }} />
      )}
    </li>
  );
}

export default function VillageBooksPage() {
  const queryClient = useQueryClient();

  const cellsQuery = useQuery({
    queryKey: ['lattice-cells'],
    queryFn: () => api.get('/lots/cells').then((r) => r.data.data),
  });

  const lotsQuery = useQuery({
    queryKey: ['lattice-lots'],
    queryFn: () => api.get('/lots').then((r) => r.data.data),
  });

  const [newCellName, setNewCellName] = useState('');
  const createCell = useMutation({
    mutationFn: () => api.post('/lots/cells', { name: newCellName }).then((r) => r.data),
    onSuccess: () => { setNewCellName(''); queryClient.invalidateQueries({ queryKey: ['lattice-cells'] }); },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['lattice-lots'] });
  };

  const cells = cellsQuery.data || [];
  const lots = lotsQuery.data || [];
  const living = lots.filter((l) => l.status === 'living');

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Village Books · front door</p>
        <h1 className="text-2xl font-bold text-slate-900">Mint a harvest, settle offtake, remaining mass stays on the lot.</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          The companion can propose a mint or a settlement — a clerk still names kilograms, paymentRef and loss. AI cannot write rupees.
        </p>
      </header>

      <Nav />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Farmer cells</h2>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newCellName.trim()) createCell.mutate(); }}>
            <input className="rounded-lg border border-slate-300 px-2 py-1 text-sm" placeholder="New cell name" value={newCellName} onChange={(e) => setNewCellName(e.target.value)} />
            <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-semibold text-white">Add</button>
          </form>
        </div>
        {cellsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading cells…</p>
        ) : cells.length === 0 ? (
          <p className="text-sm text-slate-500">No farmer cells yet — add one to mint a lot.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {cells.map((c) => <Pill key={c.id}>{c.name}{c.village ? ` · ${c.village}` : ''}</Pill>)}
          </div>
        )}
      </section>

      <section id="lots" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Mint a living lot</h2>
        <MintForm cells={cells} onMinted={refresh} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Living lots</h2>
          <Pill tone="green">{living.length} living</Pill>
        </div>
        {lotsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading lots…</p>
        ) : lots.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing minted yet.</p>
        ) : (
          <ul className="space-y-3">
            {lots.map((lot) => <LotRow key={lot.id} lot={lot} onChanged={refresh} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
