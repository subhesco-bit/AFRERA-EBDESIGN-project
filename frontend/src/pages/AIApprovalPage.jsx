import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApprovalAPI } from '../services/api';
import { AsyncState, Section } from '../components/common/DataPrimitives';
import Card from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';

const emptyForm = { domain: '', proposalType: '', proposedValue: '', currentValue: '', rationale: '' };

function DecisionRow({ proposal, onDecided }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const decide = useMutation({
    mutationFn: decision => aiApprovalAPI.decideProposal(proposal.id, { decision, rejectionReason }),
    onSuccess: onDecided,
  });
  const execute = useMutation({
    mutationFn: () => aiApprovalAPI.executeProposal(proposal.id),
    onSuccess: onDecided,
  });

  if (proposal.status === 'proposed') {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => decide.mutate('approved')} disabled={decide.isPending}>
          Approve
        </Button>
        <Input
          aria-label="Rejection reason" placeholder="Rejection reason (required to reject)"
          value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-56"
        />
        <Button size="sm" variant="destructive" disabled={decide.isPending || !rejectionReason.trim()}
          onClick={() => decide.mutate('rejected')}>
          Reject
        </Button>
        {decide.isError && (
          <span className="text-xs text-sev-critical">{decide.error?.response?.data?.error}</span>
        )}
      </div>
    );
  }

  if (proposal.status === 'approved') {
    return (
      <div className="mt-2">
        <Button size="sm" onClick={() => execute.mutate()} disabled={execute.isPending}>
          {execute.isPending ? 'Executing…' : 'Execute'}
        </Button>
        {execute.isError && (
          <span className="ml-2 text-xs text-sev-critical">{execute.error?.response?.data?.error}</span>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Real AI-proposal approval workflow backed by aiApprovalService.js
 * (ai_proposals table) - the service and route existed with proper
 * decide/execute authorization but had zero frontend caller anywhere.
 */
export default function AIApprovalPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-proposals', status],
    queryFn: () => aiApprovalAPI.getProposals({ status: status || undefined }).then(r => r.data?.data || []),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['ai-proposals'] });

  const createMutation = useMutation({
    mutationFn: payload => {
      let proposedValue = payload.proposedValue;
      try { proposedValue = JSON.parse(proposedValue); } catch { /* keep as plain string */ }
      return aiApprovalAPI.createProposal({ ...payload, proposedValue });
    },
    onSuccess: () => {
      setMessage('Proposal submitted for approval.');
      setForm(emptyForm);
      refresh();
    },
    onError: err => setMessage(err.response?.data?.error || 'Could not create proposal'),
  });

  const proposals = data || [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">AI Proposal Approval</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Human review queue for AI-suggested changes. High-impact domains (finance, insurance,
        pricing, procurement, subsidy, operations) require an administrator to execute.
      </p>

      <Section title="Submit a proposal">
        <form
          onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Input aria-label="Domain" placeholder="Domain (e.g. pricing, insurance)" required
            value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
          <Input aria-label="Proposal type" placeholder="Proposal type" required
            value={form.proposalType} onChange={e => setForm({ ...form, proposalType: e.target.value })} />
          <Input aria-label="Current value" placeholder="Current value (optional)"
            value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} />
          <Input aria-label="Proposed value" placeholder="Proposed value (JSON or text)" required
            value={form.proposedValue} onChange={e => setForm({ ...form, proposedValue: e.target.value })} />
          <Input aria-label="Rationale" placeholder="Rationale" required className="sm:col-span-2"
            value={form.rationale} onChange={e => setForm({ ...form, rationale: e.target.value })} />
          <Button type="submit" disabled={createMutation.isPending} className="sm:col-span-2">
            {createMutation.isPending ? 'Submitting…' : 'Submit proposal'}
          </Button>
        </form>
        {message && <p role="status" className="mt-2 text-sm">{message}</p>}
      </Section>

      <Section title="Proposals">
        <select
          aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}
          className="mb-3 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="proposed">Proposed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="executed">Executed</option>
        </select>

        <AsyncState
          loading={isLoading}
          error={error?.response?.data?.error || error?.message}
          empty={!isLoading && proposals.length === 0}
          emptyMessage="No proposals match this filter."
        >
          <div className="space-y-3">
            {proposals.map(p => (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{p.proposal_type} — {p.domain}</h3>
                    <p className="text-xs text-muted-foreground">{p.rationale}</p>
                  </div>
                  <span className="text-xs font-medium uppercase text-muted-foreground">{p.status}</span>
                </div>
                <DecisionRow proposal={p} onDecided={refresh} />
              </Card>
            ))}
          </div>
        </AsyncState>
      </Section>
    </main>
  );
}
