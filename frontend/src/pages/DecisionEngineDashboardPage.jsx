import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Brain, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, Settings, Play, Pause, RotateCcw } from 'lucide-react'
import { decisionEngineAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

/**
 * Decision Engine Dashboard - Production-grade monitoring and control
 * Real backend: backend/src/core/decisionEngine.js with 19 rules
 * Provides visibility into autonomous decision-making system
 */
export default function DecisionEngineDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch decision engine status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['decision-engine-status'],
    queryFn: () => decisionEngineAPI.getStatus().then(res => res.data),
    refetchInterval: 5000,
  })

  // Fetch active decisions
  const { data: activeDecisions, isLoading: decisionsLoading } = useQuery({
    queryKey: ['decision-engine-active'],
    queryFn: () => decisionEngineAPI.getActiveDecisions().then(res => res.data),
    refetchInterval: 10000,
  })

  // Fetch decision history
  const { data: decisionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['decision-engine-history'],
    queryFn: () => decisionEngineAPI.getDecisionHistory({ limit: 50 }).then(res => res.data),
    refetchInterval: 15000,
  })

  // Fetch rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['decision-engine-rules'],
    queryFn: () => decisionEngineAPI.getRules().then(res => res.data),
    refetchInterval: 30000,
  })

  // Decision evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: (data) => decisionEngineAPI.evaluateDecision(data),
    onSuccess: (res) => {
      toast.success('Decision evaluated successfully')
      queryClient.invalidateQueries({ queryKey: ['decision-engine-active'] })
      queryClient.invalidateQueries({ queryKey: ['decision-engine-history'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to evaluate decision'),
  })

  // Rule management mutations
  const createRuleMutation = useMutation({
    mutationFn: (data) => decisionEngineAPI.createRule(data),
    onSuccess: () => {
      toast.success('Rule created successfully')
      queryClient.invalidateQueries({ queryKey: ['decision-engine-rules'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create rule'),
  })

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, data }) => decisionEngineAPI.updateRule(ruleId, data),
    onSuccess: () => {
      toast.success('Rule updated successfully')
      queryClient.invalidateQueries({ queryKey: ['decision-engine-rules'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update rule'),
  })

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => decisionEngineAPI.deleteRule(ruleId),
    onSuccess: () => {
      toast.success('Rule deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['decision-engine-rules'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete rule'),
  })

  const triggerDecisionMutation = useMutation({
    mutationFn: ({ ruleId, context }) => decisionEngineAPI.triggerDecision(ruleId, context),
    onSuccess: () => {
      toast.success('Decision triggered successfully')
      queryClient.invalidateQueries({ queryKey: ['decision-engine-active'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to trigger decision'),
  })

  const statusColor = status?.status === 'active' ? 'text-green-600' : 'text-red-600'
  const statusBg = status?.status === 'active' ? 'bg-green-100' : 'bg-red-100'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-blue-700" />
          Decision Engine Dashboard
        </h1>
        <p className="text-gray-600">Monitor and control autonomous decision-making across the platform</p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Engine Status</CardTitle>
          <CardDescription>Real-time decision engine health and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Loading status...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={statusBg + ' ' + statusColor}>
                  {status?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Rules</span>
                <span className="text-sm text-gray-600">{status?.activeRules || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text font-medium">Decisions Today</span>
                <span className="text-sm text-gray-600">{status?.decisionsToday || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-gray-600">{status?.successRate || 0}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active-decisions">Active Decisions</TabsTrigger>
          <TabsTrigger value="history">Decision History</TabsTrigger>
          <TabsTrigger value="rules">Rules Management</TabsTrigger>
          <TabsTrigger value="outcomes">Decision Outcomes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['decision-engine-status'] })}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
                <Button 
                  onClick={() => setActiveTab('rules')}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Rules
                </Button>
                <Button 
                  onClick={() => setActiveTab('active-decisions')}
                  variant="outline"
                  className="w-full"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  View Active
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-mono">{status?.metrics?.cpu || '0%'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-mono">{status?.metrics?.memory || '0%'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Queue Size</span>
                  <span className="text-sm font-mono">{status?.metrics?.queueSize || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <span className="text-sm font-mono">{status?.metrics?.avgResponseTime || '0ms'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {decisionHistory?.slice(0, 5).map((decision) => (
                      <div key={decision.id} className="text-sm border-b pb-2 last:border-0">
                        <div className="font-medium">{decision.rule || 'Unknown Rule'}</div>
                        <div className="text-xs text-gray-500">{new Date(decision.timestamp).toLocaleString()}</div>
                        <Badge variant={decision.outcome === 'approved' ? 'default' : 'secondary'}>
                          {decision.outcome || 'pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active-decisions">
          <Card>
            <CardHeader>
              <CardTitle>Active Decisions</CardTitle>
              <CardDescription>Currently processing decisions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {decisionsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading decisions...
                </div>
              ) : activeDecisions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active decisions at this time
                </div>
              ) : (
                <div className="space-y-4">
                  {activeDecisions?.map((decision) => (
                    <div key={decision.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{decision.rule}</h3>
                          <p className="text-sm text-gray-600">{decision.description}</p>
                        </div>
                        <Badge variant={decision.priority === 'high' ? 'destructive' : 'default'}>
                          {decision.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <span className="ml-2">{new Date(decision.startedAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Estimated:</span>
                          <span className="ml-2">{decision.estimatedDuration || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Cancel</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Decision History</CardTitle>
              <CardDescription>Historical decisions and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading history...
                </div>
              ) : (
                <div className="space-y-2">
                  {decisionHistory?.map((decision) => (
                    <div key={decision.id} className="flex items-center justify-between border-b py-2">
                      <div className="flex-1">
                        <div className="font-medium">{decision.rule}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(decision.timestamp).toLocaleString()} • {decision.duration || 'N/A'}
                        </div>
                      </div>
                      <Badge 
                        variant={decision.outcome === 'approved' ? 'default' : decision.outcome === 'rejected' ? 'destructive' : 'secondary'}
                      >
                        {decision.outcome || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Rules Management</CardTitle>
              <CardDescription>Manage decision engine rules and policies</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading rules...
                </div>
              ) : (
                <div className="space-y-4">
                  {rules?.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="text-sm mb-2">
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2">{rule.category}</span>
                      </div>
                      <div className="text-sm mb-2">
                        <span className="text-gray-500">Priority:</span>
                        <span className="ml-2">{rule.priority}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => triggerDecisionMutation.mutate({ ruleId: rule.id, context: {} })}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateRuleMutation.mutate({ ruleId: rule.id, data: { enabled: !rule.enabled } })}
                        >
                          {rule.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle>Decision Outcomes</CardTitle>
              <CardDescription>Track outcomes and impact of autonomous decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Select a decision from history to view detailed outcomes
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
