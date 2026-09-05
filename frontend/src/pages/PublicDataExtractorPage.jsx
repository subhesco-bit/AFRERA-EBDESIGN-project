import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Download, Plus, ShieldCheck } from 'lucide-react';
import { publicDataAPI } from '../services/api';
import { AsyncState, Section } from '../components/common/DataPrimitives';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PublicDataExtractorPage() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState({ name: '', publisher: '', dataset_key: '', source_url: '', allowed_hosts: '', license: '' });
  const [selectedSource, setSelectedSource] = useState('');
  const [filterText, setFilterText] = useState('{}');
  const [message, setMessage] = useState(null);

  const sourcesQuery = useQuery({
    queryKey: ['public-data-sources'],
    queryFn: () => publicDataAPI.listSources().then((response) => response.data?.data || []),
  });

  const registerMutation = useMutation({
    mutationFn: () => publicDataAPI.registerSource({ ...source, allowed_hosts: source.allowed_hosts.split(',').map((host) => host.trim()).filter(Boolean) }),
    onSuccess: () => {
      setMessage('Source registered. Only HTTPS requests to its approved host will be accepted.');
      setSource({ name: '', publisher: '', dataset_key: '', source_url: '', allowed_hosts: '', license: '' });
      queryClient.invalidateQueries({ queryKey: ['public-data-sources'] });
    },
    onError: (error) => setMessage(error.response?.data?.error || error.message),
  });

  const extractMutation = useMutation({
    mutationFn: () => publicDataAPI.extract(selectedSource, JSON.parse(filterText)),
    onSuccess: (response) => setMessage(`Extraction ${response.data?.data?.status || 'completed'}: ${response.data?.data?.records_loaded || 0} records loaded.`),
    onError: (error) => setMessage(error.response?.data?.error || error.message),
  });

  const updateSource = (event) => setSource((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Database className="h-6 w-6" /> Public Data Extractor</h1>
      <p className="mt-1 text-sm text-muted-foreground">Governed ingestion with approved sources, provenance, filtering, hashes, and audit runs.</p>

      {message && <div role="status" className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm">{message}</div>}

      <Section title="Approved sources" description="Only administrators can register or extract from a source.">
        <AsyncState loading={sourcesQuery.isLoading} error={sourcesQuery.error?.response?.data?.error || sourcesQuery.error?.message}>
          <div className="space-y-2">
            {(sourcesQuery.data || []).map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div><strong>{item.name}</strong><span className="ml-2 text-muted-foreground">{item.publisher} · {item.dataset_key}</span></div>
                <Button size="sm" variant="outline" onClick={() => setSelectedSource(item.id)}><Download className="mr-1 h-3.5 w-3.5" /> Select</Button>
              </div>
            ))}
          </div>
        </AsyncState>
      </Section>

      <Section title="Register a source">
        <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
          {['name', 'publisher', 'dataset_key', 'source_url', 'allowed_hosts', 'license'].map((field) => (
            <label key={field} className="text-sm font-medium">{field.replace('_', ' ')}
              <input name={field} value={source[field]} onChange={updateSource} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" placeholder={field === 'allowed_hosts' ? 'data.gov.in, example.org' : ''} />
            </label>
          ))}
          <Button className="sm:col-span-2" disabled={registerMutation.isPending} onClick={() => registerMutation.mutate()}><Plus className="mr-1 h-4 w-4" /> Register approved source</Button>
        </CardContent></Card>
      </Section>

      <Section title="Extract and filter">
        <Card><CardContent className="space-y-3 pt-6">
          <label className="block text-sm font-medium">Source
            <select value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
              <option value="">Select an approved source</option>
              {(sourcesQuery.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Filter JSON
            <textarea value={filterText} onChange={(event) => setFilterText(event.target.value)} rows={4} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm" />
          </label>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Every run stores the source, publisher, license, retrieval time, filter, and record hash.</p>
          <Button disabled={!selectedSource || extractMutation.isPending} onClick={() => extractMutation.mutate()}><Download className="mr-1 h-4 w-4" /> Run extraction</Button>
        </CardContent></Card>
      </Section>
    </main>
  );
}
