import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Fish, FlaskConical, HelpCircle, Leaf, Loader2, MessageSquare,
  PawPrint, Sparkles, Stethoscope, Trees,
} from 'lucide-react';
import { farmerSupportClinicAPI } from '../services/farmerSupportClinicAPI';

const SPECIES_OPTIONS = [
  { value: 'plant', label: 'Crop / plant (leaf, stem, fruit)' },
  { value: 'tree', label: 'Tree / orchard' },
  { value: 'soil', label: 'Soil' },
  { value: 'cow', label: 'Cow / cattle' },
  { value: 'buffalo', label: 'Buffalo' },
  { value: 'goat', label: 'Goat' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pig', label: 'Pig' },
  { value: 'horse', label: 'Horse' },
  { value: 'poultry', label: 'Poultry (chicken / duck)' },
  { value: 'fish', label: 'Fish / aquaculture' },
  { value: 'design', label: 'Building / design engineer' },
];

export default function FarmerSupportClinicPage() {
  const [species, setSpecies] = useState('plant');
  const [packId, setPackId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState(() => {
    try { return sessionStorage.getItem('farmerClinicSessionId') || ''; } catch { return ''; }
  });
  const [result, setResult] = useState(null);

  const caps = useQuery({
    queryKey: ['farmer-clinic-caps'],
    queryFn: () => farmerSupportClinicAPI.getCapabilities().then((r) => r.data?.data),
    retry: 1,
  });

  const packsForSpecies = (caps.data?.deepPacks || []).filter(
    (p) => (p.species || []).includes(species),
  );

  useEffect(() => {
    setPackId('');
  }, [species]);

  useEffect(() => {
    if (sessionId) {
      try { sessionStorage.setItem('farmerClinicSessionId', sessionId); } catch { /* ignore */ }
    }
  }, [sessionId]);

  const consultMut = useMutation({
    mutationFn: () => farmerSupportClinicAPI.consult({
      species,
      packId: packId || undefined,
      symptoms: symptoms || undefined,
      photoDescription: photoDescription || undefined,
      imageUrl: imageUrl || undefined,
      state: state || undefined,
      notes: notes || undefined,
      sessionId: sessionId || undefined,
    }).then((r) => r.data?.data),
    onSuccess: (data) => {
      setResult(data);
      if (data?.sessionId) setSessionId(data.sessionId);
      setSymptoms('');
    },
  });

  const triageMut = useMutation({
    mutationFn: () => farmerSupportClinicAPI.getTriage(species, packId || undefined).then((r) => r.data?.data),
    onSuccess: setResult,
  });

  const newChat = () => {
    setSessionId('');
    setResult(null);
    try { sessionStorage.removeItem('farmerClinicSessionId'); } catch { /* ignore */ }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-amber-50/40">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-200">
            <Stethoscope className="h-4 w-4" /> Farmer Support Clinic · v{caps.data?.planVersion || '1.1'}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Plant, soil, animal doctors + multi-turn chat
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Deep packs (mastitis, leaf blight, poultry ND…), leaf image URL vision when configured,
            and session chat history. Design is a separate engineer layer.
          </p>
        </header>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Important:</strong> Educational triage only — not a licensed diagnosis or prescription.
          Vision describes features; it does not certify a disease.
        </div>

        <form
          className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); consultMut.mutate(); }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block flex-1 text-sm font-semibold text-slate-800">
              Domain
              <select value={species} onChange={(e) => setSpecies(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={newChat}
              className="mt-6 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              New chat session
            </button>
          </div>

          {packsForSpecies.length > 0 && (
            <label className="block text-sm font-semibold text-slate-800">
              Deep pack (optional)
              <select value={packId} onChange={(e) => setPackId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal">
                <option value="">— Base triage —</option>
                {packsForSpecies.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm font-semibold text-slate-800">
            Symptoms / what you observe
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              placeholder="e.g. Right rear quarter hard and hot; milk has clots"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
          </label>

          <label className="block text-sm font-semibold text-slate-800">
            Photo description (words)
            <textarea value={photoDescription} onChange={(e) => setPhotoDescription(e.target.value)}
              rows={2}
              placeholder="Describe leaf spots, soil colour, udder, fish lesions…"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
          </label>

          <label className="block text-sm font-semibold text-slate-800">
            Image URL (vision hook)
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://… leaf or animal photo (needs OPENAI vision env)"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              When OPENAI_ENABLED + API key are set, the server asks a vision model to describe the image.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800">
              State (optional)
              <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Punjab"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Extra notes
              <input value={notes} onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
            </label>
          </div>

          {sessionId && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" /> Session: {sessionId.slice(0, 18)}…
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={consultMut.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:bg-slate-400">
              {consultMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Send (multi-turn)
            </button>
            <button type="button" onClick={() => triageMut.mutate()} disabled={triageMut.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800 hover:bg-slate-50">
              Triage questions only
            </button>
          </div>
          {(consultMut.isError || triageMut.isError) && (
            <p className="text-sm text-red-700">
              {(consultMut.error || triageMut.error)?.response?.data?.error
                || (consultMut.error || triageMut.error)?.message}
            </p>
          )}
        </form>

        {result && (
          <div className="mt-8 space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                {species === 'soil' && <FlaskConical className="h-5 w-5 text-amber-700" />}
                {(species === 'plant' || species === 'tree') && <Leaf className="h-5 w-5 text-emerald-700" />}
                {species === 'fish' && <Fish className="h-5 w-5 text-sky-700" />}
                {['cow', 'buffalo', 'goat', 'sheep', 'pig', 'horse', 'poultry'].includes(species) && (
                  <PawPrint className="h-5 w-5 text-indigo-700" />
                )}
                {species === 'design' && <Trees className="h-5 w-5 text-slate-700" />}
                <h2 className="text-lg font-bold">{result.specialist?.title}</h2>
              </div>
              {result.pack && (
                <p className="text-sm font-semibold text-emerald-800">Pack: {result.pack.label}</p>
              )}
              <p className="text-sm text-slate-600">{result.specialist?.focus}</p>
              <p className="mt-2 text-xs text-amber-800">{result.disclaimer}</p>

              {result.triageQuestions?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-800">Triage questions</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                    {result.triageQuestions.map((q) => (
                      <li key={q} className="rounded-lg bg-slate-50 px-3 py-2">{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.redFlags?.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <strong>Red flags — seek help urgently if:</strong>
                  <ul className="mt-1 list-inside list-disc">
                    {result.redFlags.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              )}

              {result.vision?.description && (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
                  <strong>Vision model notes:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{result.vision.description}</p>
                </div>
              )}
              {result.provenance?.['clinic.vision']?.source === 'unavailable' && imageUrl && (
                <p className="mt-2 text-xs text-slate-500">
                  Vision: {result.provenance['clinic.vision'].note}
                </p>
              )}

              {result.consult?.summary && (
                <div className="mt-4 rounded-xl bg-emerald-50/80 p-4 text-sm leading-6 text-slate-800">
                  <div className="mb-1 text-xs font-bold uppercase text-emerald-800">
                    Advisory · urgency: {result.consult.urgency}
                  </div>
                  {result.consult.summary}
                </div>
              )}

              {result.history?.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Session history</h3>
                  <ol className="space-y-2">
                    {result.history.map((t, i) => (
                      <li key={`${t.at}-${i}`} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                        <div className="font-semibold text-slate-700">You: {t.user}</div>
                        <div className="mt-1 text-slate-600">Advisor: {t.assistant?.slice(0, 280)}{(t.assistant?.length || 0) > 280 ? '…' : ''}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.specialistLinks && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.specialistLinks.map((l) => (
                    <Link key={l.href} to={l.href}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                      {l.label}<ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
