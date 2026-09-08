import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bot, Sparkles, MessageSquare, Cloud, Brain, RefreshCw, Send, CheckCircle2, XCircle } from 'lucide-react';
import { aiBackboneAPI } from '../services/api';
import { AsyncState, Section } from '../components/common/DataPrimitives';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

/**
 * AI Backbone — layer 2 of AFRERA's AI system, backend/src/services/aiBackboneService.js,
 * mounted at /api/v1/ai-backbone. Real integrations to Claude, ChatGPT, Gemini,
 * Azure OpenAI, and Hugging Face — separate from layer 1, the internal
 * signal-bus/MCDA decision core (backend/src/core/*) that runs AFRERA's own
 * business logic without calling any external model.
 *
 * Every number on this page is either live from the backend's real request
 * tracker or an honest "not configured" state — never a placeholder value.
 * Provider API keys are never exposed here; the status endpoint redacts them
 * server-side (see the fix in aiBackboneService.getAIProviderStatus).
 */

const PROVIDER_META = {
  claude: { label: 'Claude', vendor: 'Anthropic', icon: Sparkles },
  openai: { label: 'ChatGPT', vendor: 'OpenAI', icon: MessageSquare },
  gemini: { label: 'Gemini', vendor: 'Google', icon: Bot },
  azure: { label: 'Azure OpenAI', vendor: 'Microsoft', icon: Cloud },
  huggingface: { label: 'Hugging Face', vendor: 'Open models', icon: Brain },
};
const PROVIDER_ORDER = ['claude', 'openai', 'gemini', 'azure', 'huggingface'];

function ProviderStatusBadge({ configured, enabled }) {
  if (configured && enabled) {
    return (
      <Badge className="gap-1 border-transparent bg-sev-info/15 text-sev-info hover:bg-sev-info/15">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <XCircle className="h-3 w-3" /> Not configured
    </Badge>
  );
}

function ProviderCard({ name, config, stats }) {
  const meta = PROVIDER_META[name];
  const Icon = meta.icon;
  const configured = Boolean(config?.configured);
  const enabled = Boolean(config?.enabled);
  const total = stats?.total ?? 0;
  const success = stats?.success ?? 0;
  const failed = stats?.failed ?? 0;
  const successRate = total > 0 ? Math.round((success / total) * 100) : null;

  return (
    <Card className={!configured ? 'opacity-70' : undefined}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div>
            <CardTitle className="text-base">{meta.label}</CardTitle>
            <CardDescription>{meta.vendor}</CardDescription>
          </div>
        </div>
        <ProviderStatusBadge configured={configured} enabled={enabled} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Model</span>
          <span className="font-mono text-xs">{config?.model || config?.deployment || '—'}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Requests</span>
          <span>{total > 0 ? `${total} (${success} ok, ${failed} failed)` : 'none yet'}</span>
        </div>
        {successRate !== null && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={successRate >= 80 ? 'h-full bg-data-real' : successRate >= 50 ? 'h-full bg-data-estimated' : 'h-full bg-sev-critical'}
              style={{ width: `${successRate}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SetupNotice() {
  return (
    <div
      role="note"
      aria-label="No AI provider configured"
      className="rounded-lg border border-border border-l-4 border-l-sev-notice bg-muted/40 p-4"
    >
      <p className="mb-1 font-semibold">No AI provider is configured yet</p>
      <p className="mb-2 text-sm text-muted-foreground">
        The backbone code and routes are live, but every provider is missing an API key. Set at
        least one in the backend <code className="rounded bg-muted px-1 py-0.5">.env</code> file
        (template in <code className="rounded bg-muted px-1 py-0.5">backend/.env.example</code>),
        e.g. <code className="rounded bg-muted px-1 py-0.5">CLAUDE_ENABLED=true</code> and{' '}
        <code className="rounded bg-muted px-1 py-0.5">CLAUDE_API_KEY=...</code>, then restart the
        backend.
      </p>
    </div>
  );
}

export default function AIBackbonePage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  const { data: status, isLoading, error } = useQuery({
    queryKey: ['ai-backbone-status'],
    queryFn: () => aiBackboneAPI.getAIProviderStatus().then((r) => r.data?.data),
    refetchInterval: 20000,
  });

  const availableProviders = status?.availableProviders || [];

  const callMutation = useMutation({
    mutationFn: () => aiBackboneAPI.callAI({ prompt, ...(provider ? { provider } : {}) }),
    onMutate: () => {
      setLastResult(null);
      setLastError(null);
    },
    onSuccess: (res) => {
      setLastResult(res.data?.data);
      queryClient.invalidateQueries({ queryKey: ['ai-backbone-status'] });
    },
    onError: (err) => {
      setLastError(err.response?.data?.error || err.message);
      queryClient.invalidateQueries({ queryKey: ['ai-backbone-status'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => aiBackboneAPI.resetAIStatistics(),
    onSuccess: () => {
      toast.success('AI backbone statistics reset');
      queryClient.invalidateQueries({ queryKey: ['ai-backbone-status'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message),
  });

  const providerOptions = useMemo(
    () => PROVIDER_ORDER.filter((p) => availableProviders.includes(p)),
    [availableProviders],
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">AI Backbone</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Layer 2 of AFRERA's AI system — real, unified access to Claude, ChatGPT, Gemini, Azure
        OpenAI, and Hugging Face for natural-language reasoning tasks, distinct from the internal
        signal-bus decision core that runs pricing, matching, and risk scoring on AFRERA's own
        data without calling any external model.
      </p>

      <Section title="Provider status" description="Live from the backend's real request tracker — not simulated.">
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}>
          {availableProviders.length === 0 && !isLoading && <SetupNotice />}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDER_ORDER.map((name) => (
              <ProviderCard
                key={name}
                name={name}
                config={status?.providers?.[name]}
                stats={status?.statistics?.providerStats?.[name]}
              />
            ))}
          </div>
          {status?.statistics?.totalRequests > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {status.statistics.totalRequests} total requests this session ·{' '}
                {status.statistics.successfulRequests} succeeded · {status.statistics.failedRequests} failed
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reset statistics
              </Button>
            </div>
          )}
        </AsyncState>
      </Section>

      <Section title="Ask the backbone" description="Sends a real request to the selected provider — no canned response.">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <label htmlFor="ai-backbone-prompt" className="mb-1 block text-sm font-medium">
                Prompt
              </label>
              <textarea
                id="ai-backbone-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Summarise the risk factors in this quarter's procurement plan..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={providerOptions.length === 0}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="ai-backbone-provider" className="text-sm font-medium">
                Provider
              </label>
              <select
                id="ai-backbone-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                disabled={providerOptions.length === 0}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Auto (first configured)</option>
                {providerOptions.map((p) => (
                  <option key={p} value={p}>{PROVIDER_META[p].label}</option>
                ))}
              </select>
              <Button
                onClick={() => callMutation.mutate()}
                disabled={!prompt.trim() || providerOptions.length === 0 || callMutation.isPending}
                size="sm"
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                {callMutation.isPending ? 'Sending…' : 'Send'}
              </Button>
            </div>

            {providerOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No provider is configured, so this form is disabled rather than pretending to work.
              </p>
            )}

            {lastError && (
              <div role="alert" className="rounded-md border border-sev-critical/30 bg-sev-critical/10 p-3 text-sm text-sev-critical">
                <strong>Request failed.</strong> {lastError}
              </div>
            )}

            {lastResult && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {PROVIDER_META[lastResult.provider]?.label || lastResult.provider} · {lastResult.model}
                  </span>
                  {lastResult.usage && (
                    <span>
                      {lastResult.usage.total_tokens ?? lastResult.usage.totalTokenCount ??
                        ((lastResult.usage.input_tokens || 0) + (lastResult.usage.output_tokens || 0)) ??
                        '—'} tokens
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{lastResult.content}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
