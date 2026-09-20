import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landRecordsAPI } from '../services/api';
import { AsyncState, Section, Value } from '../components/common/DataPrimitives';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';

const emptyForm = {
  surveyNumber: '', village: '', district: '', state: '',
  areaInHectares: '', areaInAcres: '', soilType: '', irrigationType: '',
  ownershipType: '', landUseType: '', khasraNumber: '',
};

/**
 * Real land-records register backed by landRecordsService.js
 * (migration 011_farmer_portal_enhancements.sql) - the service and route
 * existed but had zero frontend caller anywhere in the app.
 */
export default function LandRecordsPage() {
  const queryClient = useQueryClient();
  const [district, setDistrict] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['land-records', district],
    queryFn: () =>
      landRecordsAPI.getMyRecords({ district: district || undefined }).then(r => r.data?.data),
  });

  const addMutation = useMutation({
    mutationFn: payload =>
      landRecordsAPI.addRecord({
        ...payload,
        areaInHectares: payload.areaInHectares ? Number(payload.areaInHectares) : undefined,
        areaInAcres: payload.areaInAcres ? Number(payload.areaInAcres) : undefined,
      }),
    onSuccess: () => {
      setMessage('Land record added — pending verification.');
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['land-records'] });
    },
    onError: err => setMessage(err.response?.data?.error || 'Could not add land record'),
  });

  const syncMutation = useMutation({
    mutationFn: () => landRecordsAPI.syncWithGovernment(),
    onSuccess: res => {
      const { configured, reason, syncedCount } = res.data?.data || {};
      setMessage(
        configured === false
          ? `Not synced: ${reason || 'government land-records API is not configured on this deployment.'}`
          : `Sync complete — ${syncedCount ?? 0} record(s) synced.`,
      );
      queryClient.invalidateQueries({ queryKey: ['land-records'] });
    },
    onError: err => setMessage(err.response?.data?.error || 'Sync failed'),
  });

  const records = data?.records || [];
  const totals = data?.totals;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Land Records</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your registered land parcels, verification status, and government sync.
      </p>

      {totals && (
        <p className="mt-2 text-sm">
          Verified holdings: <Value value={totals.total_plots} emptyLabel="0" /> plot(s),{' '}
          <Value value={totals.total_hectares} unit="ha" />
        </p>
      )}

      <Section title="Add a land record">
        <form
          onSubmit={e => {
            e.preventDefault();
            addMutation.mutate(form);
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Input aria-label="Survey number" placeholder="Survey number" required
            value={form.surveyNumber} onChange={e => setForm({ ...form, surveyNumber: e.target.value })} />
          <Input aria-label="Khasra number" placeholder="Khasra number"
            value={form.khasraNumber} onChange={e => setForm({ ...form, khasraNumber: e.target.value })} />
          <Input aria-label="Village" placeholder="Village" required
            value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
          <Input aria-label="District" placeholder="District" required
            value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
          <Input aria-label="State" placeholder="State" required
            value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
          <Input aria-label="Area (hectares)" placeholder="Area (hectares)" type="number" step="0.01"
            value={form.areaInHectares} onChange={e => setForm({ ...form, areaInHectares: e.target.value })} />
          <Input aria-label="Area (acres)" placeholder="Area (acres)" type="number" step="0.01"
            value={form.areaInAcres} onChange={e => setForm({ ...form, areaInAcres: e.target.value })} />
          <Input aria-label="Soil type" placeholder="Soil type"
            value={form.soilType} onChange={e => setForm({ ...form, soilType: e.target.value })} />
          <Input aria-label="Irrigation type" placeholder="Irrigation type"
            value={form.irrigationType} onChange={e => setForm({ ...form, irrigationType: e.target.value })} />
          <Input aria-label="Ownership type" placeholder="Ownership type (owned/leased/...)"
            value={form.ownershipType} onChange={e => setForm({ ...form, ownershipType: e.target.value })} />
          <Input aria-label="Land use type" placeholder="Land use type"
            value={form.landUseType} onChange={e => setForm({ ...form, landUseType: e.target.value })} />
          <Button type="submit" disabled={addMutation.isPending} className="sm:col-span-2">
            {addMutation.isPending ? 'Adding…' : 'Add land record'}
          </Button>
        </form>
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      </Section>

      <Section title="Your records">
        <div className="mb-3 flex items-center gap-2">
          <Input aria-label="Filter by district" placeholder="Filter by district"
            value={district} onChange={e => setDistrict(e.target.value)} />
          <Button type="button" variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            {syncMutation.isPending ? 'Syncing…' : 'Sync with government records'}
          </Button>
        </div>

        <AsyncState
          loading={isLoading}
          error={error?.response?.data?.error || error?.message}
          empty={!isLoading && records.length === 0}
          emptyMessage="No land records yet."
        >
          <div className="space-y-3">
            {records.map(r => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">Survey {r.survey_number} — {r.village}, {r.district}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.state} · {r.ownership_type} · {r.land_use_type}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {r.verification_status}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  <Value value={r.area_in_hectares} unit="ha" decimals={2} />
                  {' · '}
                  <Value value={r.area_in_acres} unit="ac" decimals={2} />
                </p>
              </Card>
            ))}
          </div>
        </AsyncState>
      </Section>
    </main>
  );
}
