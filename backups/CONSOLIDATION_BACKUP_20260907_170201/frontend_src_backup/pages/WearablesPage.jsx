import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Watch, Activity, RefreshCw, Link2, Link2Off } from 'lucide-react'
import { wearableAPI } from '../services/api'
import { AsyncState, Section } from '../components/common/DataPrimitives'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'

/**
 * Wearables — connection status across Fitbit, Apple Health, Samsung Health.
 * Fitbit is the only one reachable from a web page (real OAuth2 REST API).
 * Apple Health / Samsung Health have no third-party cloud API; they only
 * ever show data once AFRERA's mobile app pushes a device reading — this
 * page says that honestly rather than offering a "Connect" button that
 * cannot work. See wearableIntegrationService.js.
 */
function ProviderCard({ title, note, status, onConnect, onSync, onDisconnect, connectDisabled, syncing }) {
  const connection = status?.connection
  const isActive = connection?.status === 'active'

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{status?.sync_method === 'server_oauth' ? 'Server-connected' : 'Mobile app pushes data here'}</CardDescription>
        </div>
        {isActive ? (
          <Badge className="border-transparent bg-sev-info/15 text-sev-info hover:bg-sev-info/15">Connected</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        {connection?.last_synced_at && (
          <p className="text-xs text-muted-foreground">Last synced: {new Date(connection.last_synced_at).toLocaleString()}</p>
        )}
        <div className="flex gap-2">
          {onConnect && !isActive && (
            <Button size="sm" onClick={onConnect} disabled={connectDisabled}>
              <Link2 className="mr-1 h-3.5 w-3.5" /> Connect
            </Button>
          )}
          {onSync && isActive && (
            <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          )}
          {onDisconnect && isActive && (
            <Button size="sm" variant="ghost" onClick={onDisconnect}>
              <Link2Off className="mr-1 h-3.5 w-3.5" /> Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function WearablesPage() {
  const queryClient = useQueryClient()

  const { data: status, isLoading, error } = useQuery({
    queryKey: ['wearable-status'],
    queryFn: () => wearableAPI.getStatus().then((r) => r.data?.data),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['wearable-recent-activity'],
    queryFn: () => wearableAPI.getRecentActivity(7).then((r) => r.data?.data),
  })

  const connectFitbit = useMutation({
    mutationFn: () => wearableAPI.getFitbitAuthUrl(),
    onSuccess: (res) => {
      const authUrl = res.data?.data?.authUrl
      if (authUrl) window.location.href = authUrl
    },
  })

  const syncFitbit = useMutation({
    mutationFn: () => wearableAPI.syncFitbit(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wearable-status'] }),
  })

  const disconnect = useMutation({
    mutationFn: (provider) => wearableAPI.disconnect(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wearable-status'] }),
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Watch className="h-6 w-6" /> Wearables
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fitbit connects directly (a real OAuth2 API). Apple Health and Samsung Health have no
        equivalent cloud API for third parties — those only show data after the AFRERA mobile app
        reads it locally and pushes it here.
      </p>

      <Section title="Connections">
        <AsyncState loading={isLoading} error={error?.response?.data?.error || error?.message}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ProviderCard
              title="Fitbit"
              status={status?.fitbit}
              onConnect={() => connectFitbit.mutate()}
              connectDisabled={!status?.fitbit?.configured || connectFitbit.isPending}
              onSync={() => syncFitbit.mutate()}
              syncing={syncFitbit.isPending}
              onDisconnect={() => disconnect.mutate('fitbit')}
              note={!status?.fitbit?.configured ? 'Not configured — set FITBIT_CLIENT_ID/SECRET in backend/.env.' : null}
            />
            <ProviderCard title="Apple Health" status={status?.apple_health} note={status?.apple_health?.note} onDisconnect={() => disconnect.mutate('apple_health')} />
            <ProviderCard title="Samsung Health" status={status?.samsung_health} note={status?.samsung_health?.note} onDisconnect={() => disconnect.mutate('samsung_health')} />
          </div>
        </AsyncState>
      </Section>

      {recentActivity && (
        <Section title="Recent activity (last 7 days)" description="Real averages from synced data — no data shown until something has synced.">
          <Card>
            <CardContent className="flex flex-wrap gap-6 pt-6 text-sm">
              <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> {recentActivity.avg_steps ?? '—'} avg steps/day</div>
              <div>{recentActivity.avg_calories_burned ?? '—'} avg kcal burned/day</div>
              <div>{recentActivity.avg_active_minutes ?? '—'} avg active min/day</div>
              <div className="text-muted-foreground">{recentActivity.days_with_data} of {recentActivity.window_days} days have data</div>
            </CardContent>
          </Card>
        </Section>
      )}
    </main>
  )
}
