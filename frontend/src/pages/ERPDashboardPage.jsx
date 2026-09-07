import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, DollarSign, BarChart3, FileText, Building, Package, Users, RefreshCw } from 'lucide-react'
import { erpDashboardAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'

/**
 * ERP Dashboard - Production-grade ERP monitoring and control
 * Real backend: Comprehensive ERP services for GL sync, reconciliation, budget management
 * Provides complete visibility into enterprise resource planning operations
 */
export default function ERPDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch ERP dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['erp-dashboard'],
    queryFn: () => erpDashboardAPI.getDashboard().then(res => res.data),
    refetchInterval: 10000,
  })

  // Fetch sync status
  const { data: syncStatus, isLoading: syncLoading } = useQuery({
    queryKey: ['erp-sync-status'],
    queryFn: () => erpDashboardAPI.getSyncStatus().then(res => res.data),
    refetchInterval: 15000,
  })

  // Fetch GL entries
  const { data: glEntries, isLoading: glLoading } = useQuery({
    queryKey: ['erp-gl-entries'],
    queryFn: () => erpDashboardAPI.getGLEntries({ limit: 50 }).then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch reconciliation data
  const { data: reconciliation, isLoading: reconLoading } = useQuery({
    queryKey: ['erp-reconciliation'],
    queryFn: () => erpDashboardAPI.getReconciliation({ limit: 50 }).then(res => res.data),
    refetchInterval: 20000,
  })

  // Fetch financial reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['erp-reports'],
    queryFn: () => erpDashboardAPI.getFinancialReports({ limit: 20 }).then(res => res.data),
    refetchInterval: 60000,
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (syncType) => erpDashboardAPI.triggerSync(syncType),
    onSuccess: () => {
      toast.success('Sync initiated successfully')
      queryClient.invalidateQueries({ queryKey: ['erp-sync-status'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to initiate sync'),
  })

  // Conflict resolution mutation
  const resolveConflictMutation = useMutation({
    mutationFn: ({ conflictId, resolution }) => erpDashboardAPI.resolveConflict(conflictId, resolution),
    onSuccess: () => {
      toast.success('Conflict resolved successfully')
      queryClient.invalidateQueries({ queryKey: ['erp-reconciliation'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to resolve conflict'),
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100'
      case 'syncing': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSyncProgress = (syncData) => {
    if (!syncData) return 0
    return syncData.progress || 0
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-emerald-700" />
          ERP Dashboard
        </h1>
        <p className="text-gray-600">Enterprise Resource Planning - Complete monitoring and control system</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(syncStatus?.overallStatus)}>
                {syncStatus?.overallStatus || 'unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">GL Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{glEntries?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conflicts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reconciliation?.conflicts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.budgetUtilization || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="gl">GL Entries</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common ERP operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => syncMutation.mutate('full')}
                  variant="outline"
                  className="w-full"
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {syncMutation.isPending ? 'Syncing...' : 'Trigger Full Sync'}
                </Button>
                <Button 
                  onClick={() => setActiveTab('reconciliation')}
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Conflicts
                </Button>
                <Button 
                  onClick={() => setActiveTab('reports')}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Reports
                </Button>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['erp-dashboard'] })}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Progress</CardTitle>
                <CardDescription>Real-time synchronization status</CardDescription>
              </CardHeader>
              <CardContent>
                {syncLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading sync status...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Farmer Data</span>
                        <span className="text-sm text-gray-600">{syncStatus?.modules?.farmers || 0}%</span>
                      </div>
                      <Progress value={syncStatus?.modules?.farmers || 0} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Crop Data</span>
                        <span className="text-sm text-gray-600">{syncStatus?.modules?.crops || 0}%</span>
                      </div>
                      <Progress value={syncStatus?.modules?.crops || 0} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Financial Data</span>
                        <span className="text-sm text-gray-600">{syncStatus?.modules?.financial || 0}%</span>
                      </div>
                      <Progress value={syncStatus?.modules?.financial || 0} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Inventory Data</span>
                        <span className="text-sm text-gray-600">{syncStatus?.modules?.inventory || 0}%</span>
                      </div>
                      <Progress value={syncStatus?.modules?.inventory || 0} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Key financial metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading financial data...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Revenue</span>
                      <span className="text-sm font-mono font-semibold">₹{dashboard?.financials?.revenue?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Expenses</span>
                      <span className="text-sm font-mono font-semibold">₹{dashboard?.financials?.expenses?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Net Profit</span>
                      <span className={`text-sm font-mono font-semibold ${dashboard?.financials?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{dashboard?.financials?.profit?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cash Flow</span>
                      <span className="text-sm font-mono font-semibold">₹{dashboard?.financials?.cashFlow?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest ERP operations</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Loading activity...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboard?.recentActivity?.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</div>
                        </div>
                        <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>Detailed sync status for all ERP modules</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading sync status...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Last Full Sync</span>
                        <Badge className={getStatusColor(syncStatus?.lastSync?.status)}>
                          {syncStatus?.lastSync?.status || 'unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {syncStatus?.lastSync?.timestamp ? new Date(syncStatus.lastSync.timestamp).toLocaleString() : 'Never'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Duration: {syncStatus?.lastSync?.duration || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Next Scheduled Sync</span>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {syncStatus?.nextSync ? new Date(syncStatus.nextSync).toLocaleString() : 'Not scheduled'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-3">Module Sync Status</h3>
                    <div className="space-y-3">
                      {Object.entries(syncStatus?.modules || {}).map(([module, progress]) => (
                        <div key={module}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{module}</span>
                            <span className="text-sm text-gray-600">{progress}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => syncMutation.mutate('full')}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Trigger Full Sync
                    </Button>
                    <Button 
                      onClick={() => syncMutation.mutate('financial')}
                      variant="outline"
                      disabled={syncMutation.isPending}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Sync Financial Only
                    </Button>
                    <Button 
                      onClick={() => syncMutation.mutate('inventory')}
                      variant="outline"
                      disabled={syncMutation.isPending}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Sync Inventory Only
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gl">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger Entries</CardTitle>
              <CardDescription>Recent GL entries and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {glLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading GL entries...
                </div>
              ) : glEntries?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No GL entries found
                </div>
              ) : (
                <div className="space-y-2">
                  {glEntries?.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between border-b py-2">
                      <div className="flex-1">
                        <div className="font-medium">{entry.description}</div>
                        <div className="text-xs text-gray-500">
                          {entry.account} • {new Date(entry.date).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono ${entry.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.type === 'debit' ? '-' : '+'}₹{entry.amount?.toLocaleString()}
                        </div>
                        <Badge variant="outline">{entry.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation</CardTitle>
              <CardDescription>Track and resolve financial discrepancies</CardDescription>
            </CardHeader>
            <CardContent>
              {reconLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading reconciliation data...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Pending Reconciliation</div>
                      <div className="text-2xl font-bold text-yellow-600">{reconciliation?.pending || 0}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Active Conflicts</div>
                      <div className="text-2xl font-bold text-red-600">{reconciliation?.conflicts || 0}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Resolved Today</div>
                      <div className="text-2xl font-bold text-green-600">{reconciliation?.resolved || 0}</div>
                    </div>
                  </div>

                  {reconciliation?.conflicts > 0 && (
                    <div className="p-4 border rounded">
                      <h3 className="font-semibold mb-3">Active Conflicts</h3>
                      <div className="space-y-2">
                        {reconciliation?.items?.filter(item => item.status === 'conflict').map((conflict) => (
                          <div key={conflict.id} className="p-3 border rounded bg-red-50">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium">{conflict.description}</div>
                                <div className="text-xs text-gray-500">{new Date(conflict.detectedAt).toLocaleString()}</div>
                              </div>
                              <Badge variant="destructive">Conflict</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                              <div>
                                <span className="text-gray-500">Source Amount:</span>
                                <span className="ml-2 font-mono">₹{conflict.sourceAmount?.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Target Amount:</span>
                                <span className="ml-2 font-mono">₹{conflict.targetAmount?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                onClick={() => resolveConflictMutation.mutate({ 
                                  conflictId: conflict.id, 
                                  resolution: { action: 'use_source' } 
                                })}
                              >
                                Use Source
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveConflictMutation.mutate({ 
                                  conflictId: conflict.id, 
                                  resolution: { action: 'use_target' } 
                                })}
                              >
                                Use Target
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveConflictMutation.mutate({ 
                                  conflictId: conflict.id, 
                                  resolution: { action: 'manual_review' } 
                                })}
                              >
                                Manual Review
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets">
          <Card>
            <CardHeader>
              <CardTitle>Budget Management</CardTitle>
              <CardDescription>Track budget utilization and allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Budget management interface - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and view financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Loading reports...
                </div>
              ) : (
                <div className="space-y-2">
                  {reports?.map((report) => (
                    <div key={report.id} className="flex items-center justify-between border-b py-2">
                      <div className="flex-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-xs text-gray-500">
                          {report.type} • {new Date(report.generatedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">Download</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Asset Register</CardTitle>
              <CardDescription>Manage enterprise assets and depreciation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Asset register interface - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>Track project budgets and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Project management interface - requires additional implementation
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
