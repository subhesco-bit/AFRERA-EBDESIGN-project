import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, RefreshCw, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { farmerTrainingAPI } from '../services/api';

const listFrom = (value) => Array.isArray(value) ? value : value?.programs || value?.results || value?.data || [];
const labelFor = (program) => program.name || program.title || program.program_name || program.program_id || 'Unnamed program';

export default function TrainingAcademyPage() {
  const [programs, setPrograms] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });
  const [form, setForm] = useState({ farmerId: '', programId: '' });
  const [registration, setRegistration] = useState({ loading: false, error: null, data: null });

  const loadPrograms = () => {
    setState({ loading: true, error: null });
    farmerTrainingAPI.getPrograms().then((response) => {
      setPrograms(listFrom(response?.data));
      setState({ loading: false, error: null });
    }).catch((error) => setState({ loading: false, error: error.message || 'Training programs could not be loaded.' }));
  };

  useEffect(() => { loadPrograms(); }, []);

  const register = async (event) => {
    event.preventDefault();
    setRegistration({ loading: true, error: null, data: null });
    try {
      const response = await farmerTrainingAPI.register({
        farmer_id: form.farmerId.trim(), program_id: form.programId,
        registration_date: new Date().toISOString(), payment_status: 'pending', subsidy_applied: false,
      });
      setRegistration({ loading: false, error: null, data: response?.data });
    } catch (error) {
      setRegistration({ loading: false, error: error.message || 'Registration could not be completed.', data: null });
    }
  };

  return <main className="min-h-full space-y-6 bg-v42-paddy/40 p-4 sm:p-6">
    <header className="mx-auto max-w-6xl"><div className="flex items-center gap-3"><BookOpen className="text-v42-forest" aria-hidden="true" /><h1 className="font-display text-3xl font-semibold text-v42-ink">Training Academy</h1></div><p className="mt-2 max-w-2xl text-sm text-v42-ink2">Training programs returned by the farmer training service.</p></header>
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <Card><CardHeader><CardTitle>Available programs</CardTitle><CardDescription>Only programs currently returned by the API are shown.</CardDescription></CardHeader><CardContent>
        {state.loading && <p aria-busy="true">Loading training programs...</p>}
        {state.error && <div className="space-y-3"><p role="alert">{state.error}</p><Button type="button" variant="outline" onClick={loadPrograms}><RefreshCw size={16} aria-hidden="true" /> Retry</Button></div>}
        {!state.loading && !state.error && !programs.length && <p role="status">No training programs are available.</p>}
        {Boolean(programs.length) && <ul className="grid gap-3 sm:grid-cols-2" aria-label="Training programs">{programs.map((program, index) => <li key={program.id || program.program_id || index} className="rounded-md border border-v42-line p-4"><h3 className="font-semibold text-v42-ink">{labelFor(program)}</h3>{program.description && <p className="mt-1 text-sm text-v42-ink2">{program.description}</p>}{program.duration && <p className="mt-2 text-xs text-v42-mut">Duration: {String(program.duration)}</p>}</li>)}</ul>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus size={18} aria-hidden="true" /> Register</CardTitle><CardDescription>Submit a registration to the training service.</CardDescription></CardHeader><CardContent><form onSubmit={register} className="space-y-4"><div><label className="text-sm font-medium" htmlFor="training-farmer">Farmer ID</label><input className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" id="training-farmer" required value={form.farmerId} onChange={(event) => setForm({ ...form, farmerId: event.target.value })} /></div><div><label className="text-sm font-medium" htmlFor="training-program">Program</label><select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" id="training-program" required value={form.programId} onChange={(event) => setForm({ ...form, programId: event.target.value })}><option value="">Select a returned program</option>{programs.map((program, index) => <option key={program.id || program.program_id || index} value={program.id || program.program_id}>{labelFor(program)}</option>)}</select></div><Button type="submit" disabled={registration.loading || !programs.length}>{registration.loading ? 'Registering...' : 'Register for training'}</Button>{registration.error && <p role="alert">{registration.error}</p>}{registration.data && <p className="flex items-start gap-2 text-sm" role="status"><CheckCircle2 size={18} aria-hidden="true" /> Registration response received from the training API.</p>}</form><p className="mt-4 text-xs text-v42-mut">Registration details and any AI assessment are supplied by the API. Review them before acting.</p></CardContent></Card>
    </div>
  </main>;
}
