import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cpu, Play, Pause, RotateCcw, Activity, TrendingUp, AlertTriangle, Settings, BarChart3, Thermometer, Droplets, Wind, Sun, Database, GitBranch } from 'lucide-react'
import { digitalTwinAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'

/**
 * Digital Twin Dashboard - Production-grade farm simulation monitoring
 * Real backend: digitalTwinService with simulation engine
 * Provides visibility into farm digital twin and predictive models
 */
export default function DigitalTwinDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch digital twin status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['digital-twin-status'],
    queryFn: () => digitalTwinAPI.getStatus().then(res => res.data),
    refetchInterval: 10000,
  })

  // Fetch twins
  const { data: twins, isLoading: twinsLoading } = useQuery({
    queryKey: ['digital-twin-twins'],
    queryFn: () => digitalTwinAPI.getTwins().then(res => res.data),
    refetchInterval: 15000,
  })

  // Simulation mutation
  const simulationMutation = useMutation({
    mutationFn: ({ twinId, scenario }) => digitalTwinAPI.runSimulation(twinId, scenario),
    onSuccess: () => {
      toast.success('Simulation started successfully')
      queryClient.invalidateQueries({ queryKey: ['digital-twin-twins'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to start simulation'),
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (twinId) => digitalTwinAPI.syncRealData(twinId),
    onSuccess: () => {
      toast.success('Data sync completed')
      queryClient.invalidateQueries({ queryKey: ['digital-twin-twins'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to sync data'),
  })

  const getSimulationStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Cpu className="w-6 h-6 mr-2 text-cyan-700" />
          Digital Twin Dashboard
        </h1>
        <p className="text-gray-600">Farm simulation engine and predictive modeling</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Twins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{twins?.filter(t => t.status === 'active').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Running Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{twins?.filter(t => t.simulationStatus === 'running').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Predictive Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.modelCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Prediction Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status?.accuracy || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="twins">Digital Twins</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="models">Predictive Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common digital twin operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab('twins')}
                  variant="outline"
                  className="w-full"
                >
                  <Database className="w-4 h-4 mr-2" />
                  View All Twins
                </Button>
                <Button 
                  onClick={() => setActiveTab('simulations')}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </Button>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['digital-twin-status'] })}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Digital twin engine status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading status...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engine Status</span>
                      <Badge className={status?.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                        {status?.status || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-mono">{status?.metrics?.cpu || '0%'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-mono">{status?.metrics?.memory || '0%'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Sync Status</span>
                      <Badge variant={status?.syncStatus === 'synced' ? 'default' : 'secondary'}>
                        {status?.syncStatus || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Models</CardTitle>
                <CardDescription>Predictive models for simulation</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading models...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {status?.models?.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">{model.name}</span>
                        </div>
                        <Badge variant="outline">{model.accuracy}% accuracy</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Simulations</CardTitle>
                <CardDescription>Latest simulation results</CardDescription>
              </CardHeader>
              <CardContent>
                {twinsLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading simulations...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {twins?.filter(t => t.lastSimulation).slice(0, 5).map((twin) => (
                      <div key={twin.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{twin.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(twin.lastSimulation.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge className={getSimulationStatusColor(twin.lastSimulation.status)}>
                          {twin.lastSimulation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="twins">
          <Card>
            <CardHeader>
              <CardTitle>Digital Twins</CardTitle>
              <CardDescription>Manage farm digital twins</CardDescription>
            </CardHeader>
            <CardContent>
              {twinsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading twins...
                </div>
              ) : twins?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No digital twins found
                </div>
              ) : (
                <div className="space-y-4">
                  {twins?.map((twin) => (
                    <div key={twin.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{twin.name}</h3>
                          <p className="text-sm text-gray-600">{twin.description}</p>
                        </div>
                        <Badge className={twin.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                          {twin.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Farm ID:</span>
                          <span className="ml-2">{twin.farmId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Sync:</span>
                          <span className="ml-2">{twin.lastSync ? new Date(twin.lastSync).toLocaleString() : 'Never'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => simulationMutation.mutate({ twinId: twin.id, scenario: { type: 'standard' } })}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run Simulation
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => syncMutation.mutate(twin.id)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Sync Data
                        </Button>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulations">
          <Card>
            <CardHeader>
              <CardTitle>Simulations</CardTitle>
              <CardDescription>Active and completed simulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Simulation history interface - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Models</CardTitle>
              <CardDescription>Available ML models for predictions</CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading models...
                </div>
              ) : (
                <div className="space-y-4">
                  {status?.models?.map((model, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-gray-600">{model.description}</p>
                        </div>
                        <Badge variant="outline">{model.type}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Accuracy:</span>
                          <span className="ml-2 font-semibold">{model.accuracy}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Trained:</span>
                          <span className="ml-2">{new Date(model.lastTrained).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Version:</span>
                          <span className="ml-2">{model.version}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Retrain</Button>
                        <Button size="sm" variant="outline">View Performance</Button>
                        <Button size="sm" variant="outline">Export Model</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Digital Twin Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Advanced analytics view - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
