import { Activity } from 'lucide-react'
import { realtimeMonitoringAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/realtimeMonitoringRoutes.js +
 * services/legacy/realtimeMonitoringService.js. All 5 methods verified to
 * exist (2026-08-29). In-memory resource monitoring/alerting engine,
 * platform-staff only. Action-oriented, ActionCard pattern.
 */
function RealtimeMonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-indigo-600" />
          Realtime Monitoring
        </h1>
        <p className="text-gray-600">Start, stop and inspect real-time resource monitors. Platform staff only.</p>
      </div>

      <ActionCard
        title="Start Monitoring"
        description="Start a new monitor for a resource."
        fields={[{ name: 'resourceId', label: 'Resource ID' }]}
        hasJsonPayload
        jsonLabel="Monitor config (JSON)"
        jsonPlaceholder='{"intervalMs": 30000, "threshold": 80}'
        onRun={(v, payload) => realtimeMonitoringAPI.startMonitoring(v.resourceId, payload)}
      />
      <ActionCard
        title="Get All Monitors"
        description="List all active monitors."
        onRun={() => realtimeMonitoringAPI.getAllMonitors()}
      />
      <ActionCard
        title="Get Monitor Status"
        description="Fetch the status of a single monitor by ID."
        fields={[{ name: 'id', label: 'Monitor ID' }]}
        onRun={(v) => realtimeMonitoringAPI.getMonitoringStatus(v.id)}
      />
      <ActionCard
        title="Stop Monitoring"
        description="Stop and remove a monitor by ID."
        fields={[{ name: 'id', label: 'Monitor ID' }]}
        onRun={(v) => realtimeMonitoringAPI.stopMonitoring(v.id)}
      />
      <ActionCard
        title="Health Check"
        description="Check the health of the monitoring engine."
        onRun={() => realtimeMonitoringAPI.healthCheck()}
      />
    </div>
  )
}

export default RealtimeMonitoringPage
