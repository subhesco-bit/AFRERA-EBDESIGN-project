import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Thermometer, Snowflake, AlertTriangle, CheckCircle, Clock, Package, Building, Activity, TrendingUp, RefreshCw, MapPin } from 'lucide-react'
import { coldStorageAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'

/**
 * Cold Storage Dashboard - Production-grade cold chain monitoring
 * Real backend: coldStorageService with temperature tracking and facility management
 * Provides visibility into cold storage operations and compliance
 */
export default function ColdStorageDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch cold storage status (real aggregate — coldStorageService.getSystemStatus)
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['cold-storage-status'],
    queryFn: () => coldStorageAPI.getStatus().then(res => res.data.data),
    refetchInterval: 10000,
  })

  // Fetch facilities (enriched with real occupancy/temperature — coldStorageService.getFacilitiesWithStatus)
  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ['cold-storage-facilities'],
    queryFn: () => coldStorageAPI.getFacilities().then(res => res.data.data),
    refetchInterval: 15000,
  })

  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const effectiveFacilityId = selectedFacilityId || facilities?.[0]?.id

  // Real temperature readings for the selected/first facility
  const { data: temperatureReadings, isLoading: temperatureLoading } = useQuery({
    queryKey: ['cold-storage-temperature', effectiveFacilityId],
    queryFn: () => coldStorageAPI.getTemperatureData(effectiveFacilityId).then(res => res.data.data),
    enabled: activeTab === 'temperature' && !!effectiveFacilityId,
    refetchInterval: 15000,
  })

  // Real compliance rollup for the selected/first facility
  const { data: complianceStats, isLoading: complianceLoading } = useQuery({
    queryKey: ['cold-storage-compliance', effectiveFacilityId],
    queryFn: () => coldStorageAPI.getComplianceStatus(effectiveFacilityId).then(res => res.data.data),
    enabled: activeTab === 'compliance' && !!effectiveFacilityId,
    refetchInterval: 30000,
  })

  // Book facility mutation
  const bookMutation = useMutation({
    mutationFn: ({ facilityId, data }) => coldStorageAPI.bookFacility(facilityId, data),
    onSuccess: () => {
      toast.success('Facility booked successfully')
      queryClient.invalidateQueries({ queryKey: ['cold-storage-facilities'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to book facility'),
  })

  const getTemperatureStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return 'text-red-600 bg-red-100'
    if (utilization >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Snowflake className="w-6 h-6 mr-2 text-cyan-700" />
          Cold Storage Dashboard
        </h1>
        <p className="text-gray-600">Cold chain monitoring, temperature tracking, and facility management</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{facilities?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Temperature Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{status?.activeAlerts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.avgUtilization || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status?.complianceRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.avgTemperature || 'N/A'}°C</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common cold storage operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab('facilities')}
                  variant="outline"
                  className="w-full"
                >
                  <Building className="w-4 h-4 mr-2" />
                  View Facilities
                </Button>
                <Button 
                  onClick={() => setActiveTab('temperature')}
                  variant="outline"
                  className="w-full"
                >
                  <Thermometer className="w-4 h-4 mr-2" />
                  Monitor Temperature
                </Button>
                <Button 
                  onClick={() => setActiveTab('compliance')}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Compliance
                </Button>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['cold-storage-status'] })}
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
                <CardTitle>System Health</CardTitle>
                <CardDescription>Cold storage system status</CardDescription>
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
                      <span className="text-sm">System Status</span>
                      <Badge className={status?.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                        {status?.status || 'unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sensors Active</span>
                      <span className="text-sm font-mono">{status?.activeSensors || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Sync</span>
                      <span className="text-sm">
                        {status?.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alert Threshold</span>
                      <span className="text-sm font-mono">{status?.alertThreshold || 'N/A'}°C</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temperature Summary</CardTitle>
                <CardDescription>Current temperature across all facilities</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading temperature data...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Min Temperature</span>
                      <span className="text-sm font-mono">{status?.minTemp || 'N/A'}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max Temperature</span>
                      <span className="text-sm font-mono">{status?.maxTemp || 'N/A'}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Temperature</span>
                      <span className="text-sm font-mono">{status?.avgTemperature || 'N/A'}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Facilities in Range</span>
                      <span className="text-sm font-mono">{status?.inRange || 0}/{facilities?.length || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Latest temperature and compliance alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading alerts...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {status?.recentAlerts?.slice(0, 5).map((alert, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{alert.facility}</div>
                          <div className="text-xs text-gray-500">{alert.message}</div>
                          <div className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleString()}</div>
                        </div>
                        <Badge className={getTemperatureStatusColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facilities">
          <Card>
            <CardHeader>
              <CardTitle>Cold Storage Facilities</CardTitle>
              <CardDescription>Manage and monitor all cold storage facilities</CardDescription>
            </CardHeader>
            <CardContent>
              {facilitiesLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading facilities...
                </div>
              ) : facilities?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No facilities found
                </div>
              ) : (
                <div className="space-y-4">
                  {facilities?.map((facility) => (
                    <div key={facility.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{facility.name}</h3>
                          <p className="text-sm text-gray-600">{facility.location}</p>
                        </div>
                        <Badge className={facility.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                          {facility.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Capacity:</span>
                          <span className="ml-2">{facility.capacity} tons</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Current:</span>
                          <span className="ml-2">{facility.currentLoad} tons</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Temperature:</span>
                          <span className="ml-2">{facility.currentTemp}°C</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedFacilityId(facility.id); setActiveTab('temperature') }}
                        >
                          Temperature Log
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedFacilityId(facility.id); setActiveTab('compliance') }}
                        >
                          Compliance
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => bookMutation.mutate({ facilityId: facility.id, data: { duration: '1 month' } })}
                        >
                          Book Space
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Monitoring</CardTitle>
              <CardDescription>
                Real-time temperature readings
                {facilities?.length > 1 && (
                  <select
                    className="ml-3 border rounded px-2 py-1 text-sm"
                    value={effectiveFacilityId || ''}
                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!effectiveFacilityId ? (
                <div className="text-center py-8 text-gray-500">No facilities available</div>
              ) : temperatureLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading temperature readings...
                </div>
              ) : !temperatureReadings?.length ? (
                <div className="text-center py-8 text-gray-500">
                  No temperature readings recorded yet for this facility
                </div>
              ) : (
                <div className="space-y-2">
                  {temperatureReadings.map((reading) => (
                    <div key={reading.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-cyan-600" />
                        <span className="font-mono text-sm">{Number(reading.recorded_temperature_c).toFixed(1)}°C</span>
                        {reading.recorded_humidity_pct != null && (
                          <span className="text-xs text-gray-500">{Number(reading.recorded_humidity_pct).toFixed(0)}% humidity</span>
                        )}
                        {reading.sensor_id && (
                          <span className="text-xs text-gray-400">sensor {reading.sensor_id}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(reading.recorded_at).toLocaleString()}</span>
                        <Badge className={reading.is_compliant ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                          {reading.is_compliant ? 'in range' : `${Number(reading.deviation_c).toFixed(1)}°C off`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Utilization</CardTitle>
              <CardDescription>Storage utilization and capacity planning</CardDescription>
            </CardHeader>
            <CardContent>
              {facilitiesLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading utilization data...
                </div>
              ) : (
                <div className="space-y-4">
                  {facilities?.map((facility) => (
                    <div key={facility.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{facility.name}</span>
                        </div>
                        <Badge className={getUtilizationColor(facility.utilization)}>
                          {facility.utilization}% utilized
                        </Badge>
                      </div>
                      <Progress value={facility.utilization} className="mb-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <span className="ml-2">{facility.capacity - facility.currentLoad} tons</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reserved:</span>
                          <span className="ml-2">{facility.reserved || 0} tons</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Temperature-range compliance for the last 24 hours (real rollup, not cached)</CardDescription>
            </CardHeader>
            <CardContent>
              {!effectiveFacilityId ? (
                <div className="text-center py-8 text-gray-500">No facilities available</div>
              ) : complianceLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading compliance data...
                </div>
              ) : !complianceStats || complianceStats.status === 'no_data' ? (
                <div className="text-center py-8 text-gray-500">
                  No temperature readings recorded yet for this facility
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Compliance rate</span>
                    <Badge className={
                      complianceStats.status === 'fully_compliant' ? 'bg-green-100 text-green-600'
                        : complianceStats.status === 'mostly_compliant' ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-red-100 text-red-600'
                    }>
                      {complianceStats.compliancePct}%
                    </Badge>
                  </div>
                  <Progress value={complianceStats.compliancePct || 0} />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Readings (24h)</span>
                      <span className="font-mono">{complianceStats.totalReadings}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Non-compliant</span>
                      <span className="font-mono text-red-600">{complianceStats.nonCompliantReadings}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Min / Max</span>
                      <span className="font-mono">{complianceStats.minTempC}°C / {complianceStats.maxTempC}°C</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Declared range</span>
                      <span className="font-mono">
                        {complianceStats.declaredRangeC?.min ?? 'N/A'}°C – {complianceStats.declaredRangeC?.max ?? 'N/A'}°C
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
