import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Cloud, Thermometer, Droplets, Wind, Sun, AlertTriangle, Activity, TrendingUp, MapPin, Calendar, RefreshCw, Download } from 'lucide-react'
import { climateMonitoringAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'

/**
 * Climate Monitoring Dashboard - Production-grade weather analytics
 * Real backend: climateMonitoringService with drought, flood, disease forecasting
 * Provides visibility into climate risks and agricultural impact
 */
export default function ClimateMonitoringDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch climate monitoring status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['climate-monitoring-status'],
    queryFn: () => climateMonitoringAPI.getStatus().then(res => res.data),
    refetchInterval: 15000,
  })

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['climate-monitoring-alerts'],
    queryFn: () => climateMonitoringAPI.getAlerts().then(res => res.data),
    refetchInterval: 10000,
  })

  // Fetch drought data
  const { data: droughtData, isLoading: droughtLoading } = useQuery({
    queryKey: ['climate-monitoring-drought'],
    queryFn: () => climateMonitoringAPI.getDroughtData({ limit: 10 }).then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch flood data
  const { data: floodData, isLoading: floodLoading } = useQuery({
    queryKey: ['climate-monitoring-flood'],
    queryFn: () => climateMonitoringAPI.getFloodData({ limit: 10 }).then(res => res.data),
    refetchInterval: 30000,
  })

  // Report generation mutation
  const reportMutation = useMutation({
    mutationFn: (params) => climateMonitoringAPI.generateReport(params),
    onSuccess: () => {
      toast.success('Report generated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate report'),
  })

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'drought': return <Droplets className="w-4 h-4" />
      case 'flood': return <Cloud className="w-4 h-4" />
      case 'temperature': return <Thermometer className="w-4 h-4" />
      case 'disease': return <AlertTriangle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Cloud className="w-6 h-6 mr-2 text-sky-700" />
          Climate Monitoring Dashboard
        </h1>
        <p className="text-gray-600">Weather analytics, drought/flood monitoring, and disease forecasting</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alerts?.filter(a => a.status === 'active').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Drought Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{status?.droughtRisk || 'Low'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Flood Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{status?.floodRisk || 'Low'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Disease Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{status?.diseaseAlerts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status?.forecastAccuracy || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="drought">Drought</TabsTrigger>
          <TabsTrigger value="flood">Flood</TabsTrigger>
          <TabsTrigger value="disease">Disease Forecast</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Conditions</CardTitle>
                <CardDescription>Real-time weather data</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading conditions...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Temperature</span>
                      </div>
                      <span className="text-sm font-mono">{status?.currentConditions?.temperature || 'N/A'}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Humidity</span>
                      </div>
                      <span className="text-sm font-mono">{status?.currentConditions?.humidity || 'N/A'}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wind className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Wind Speed</span>
                      </div>
                      <span className="text-sm font-mono">{status?.currentConditions?.windSpeed || 'N/A'} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Rainfall</span>
                      </div>
                      <span className="text-sm font-mono">{status?.currentConditions?.rainfall || 'N/A'} mm</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common climate operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab('alerts')}
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Alerts
                </Button>
                <Button 
                  onClick={() => setActiveTab('drought')}
                  variant="outline"
                  className="w-full"
                >
                  <Droplets className="w-4 h-4 mr-2" />
                  Drought Analysis
                </Button>
                <Button 
                  onClick={() => setActiveTab('reports')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['climate-monitoring-status'] })}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7-Day Forecast</CardTitle>
                <CardDescription>Weather predictions for the week</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading forecast...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {status?.forecast?.slice(0, 7).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{day.date}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm">{day.condition}</span>
                          <span className="text-sm font-mono">{day.temp}°C</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Risks</CardTitle>
                <CardDescription>Risk levels by agricultural region</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading risks...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {status?.regionalRisks?.map((region, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{region.name}</span>
                        </div>
                        <Badge className={getSeverityColor(region.risk)}>
                          {region.risk}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Climate Alerts</CardTitle>
              <CardDescription>Active and historical climate alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading alerts...
                </div>
              ) : alerts?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active alerts
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts?.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                          <div>
                            <h3 className="font-semibold">{alert.title}</h3>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2">{alert.location}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Issued:</span>
                          <span className="ml-2">{new Date(alert.issuedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {alert.recommendations && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm font-medium text-blue-800">Recommendations:</div>
                          <div className="text-sm text-blue-700">{alert.recommendations}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drought">
          <Card>
            <CardHeader>
              <CardTitle>Drought Analysis</CardTitle>
              <CardDescription>Drought risk assessment and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {droughtLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading drought data...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Overall Risk</div>
                      <div className="text-2xl font-bold text-orange-600">{status?.droughtRisk || 'Low'}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Affected Regions</div>
                      <div className="text-2xl font-bold">{droughtData?.affectedRegions || 0}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Severity Index</div>
                      <div className="text-2xl font-bold">{droughtData?.severityIndex || 0}</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-3">Regional Drought Status</h3>
                    <div className="space-y-2">
                      {droughtData?.regions?.map((region, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{region.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={region.droughtLevel} className="w-24" />
                            <Badge className={getSeverityColor(region.severity)}>
                              {region.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flood">
          <Card>
            <CardHeader>
              <CardTitle>Flood Analysis</CardTitle>
              <CardDescription>Flood risk assessment and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              {floodLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading flood data...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Overall Risk</div>
                      <div className="text-2xl font-bold text-blue-600">{status?.floodRisk || 'Low'}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">At Risk Areas</div>
                      <div className="text-2xl font-bold">{floodData?.atRiskAreas || 0}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Water Level</div>
                      <div className="text-2xl font-bold">{floodData?.waterLevel || 'Normal'}</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-3">Flood Risk Zones</h3>
                    <div className="space-y-2">
                      {floodData?.zones?.map((zone, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{zone.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={zone.riskLevel} className="w-24" />
                            <Badge className={getSeverityColor(zone.severity)}>
                              {zone.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disease">
          <Card>
            <CardHeader>
              <CardTitle>Disease Forecast</CardTitle>
              <CardDescription>Agricultural disease prediction and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Disease forecasting interface - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Climate Reports</CardTitle>
              <CardDescription>Generate and download climate analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => reportMutation.mutate({ type: 'weekly', format: 'pdf' })}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Weekly Report (PDF)
                  </Button>
                  <Button 
                    onClick={() => reportMutation.mutate({ type: 'monthly', format: 'pdf' })}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Monthly Report (PDF)
                  </Button>
                  <Button 
                    onClick={() => reportMutation.mutate({ type: 'regional', format: 'csv' })}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Regional Data (CSV)
                  </Button>
                  <Button 
                    onClick={() => reportMutation.mutate({ type: 'historical', format: 'csv' })}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Historical Data (CSV)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
