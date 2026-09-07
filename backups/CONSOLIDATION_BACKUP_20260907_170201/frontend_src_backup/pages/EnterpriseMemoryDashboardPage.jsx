import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Search, BookOpen, TrendingUp, AlertCircle, CheckCircle, Clock, Network, Lightbulb } from 'lucide-react'
import { enterpriseMemoryAPI } from '../services/api'
import toast from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

/**
 * Enterprise Memory Dashboard - Production-grade learning system monitoring
 * Real backend: enterpriseMemoryService with case log and learning system
 * Provides visibility into autonomous learning and knowledge accumulation
 */
export default function EnterpriseMemoryDashboardPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch cases
  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['enterprise-memory-cases'],
    queryFn: () => enterpriseMemoryAPI.getCases().then(res => res.data),
    refetchInterval: 15000,
  })

  // Fetch learning insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['enterprise-memory-insights'],
    queryFn: () => enterpriseMemoryAPI.getLearningInsights().then(res => res.data),
    refetchInterval: 30000,
  })

  // Fetch knowledge graph
  const { data: knowledgeGraph, isLoading: graphLoading } = useQuery({
    queryKey: ['enterprise-memory-knowledge-graph'],
    queryFn: () => enterpriseMemoryAPI.getKnowledgeGraph().then(res => res.data),
    refetchInterval: 60000,
  })

  // Search cases mutation
  const searchMutation = useMutation({
    mutationFn: (query) => enterpriseMemoryAPI.searchCases(query),
    onSuccess: (res) => {
      queryClient.setQueryData(['enterprise-memory-cases'], res.data)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Search failed'),
  })

  // Create case mutation
  const createCaseMutation = useMutation({
    mutationFn: (data) => enterpriseMemoryAPI.createCase(data),
    onSuccess: () => {
      toast.success('Case created successfully')
      queryClient.invalidateQueries({ queryKey: ['enterprise-memory-cases'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create case'),
  })

  // Update case mutation
  const updateCaseMutation = useMutation({
    mutationFn: ({ caseId, data }) => enterpriseMemoryAPI.updateCase(caseId, data),
    onSuccess: () => {
      toast.success('Case updated successfully')
      queryClient.invalidateQueries({ queryKey: ['enterprise-memory-cases'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update case'),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-purple-600 bg-purple-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Database className="w-6 h-6 mr-2 text-indigo-700" />
          Enterprise Memory Dashboard
        </h1>
        <p className="text-gray-600">Monitor autonomous learning, case tracking, and knowledge accumulation</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases?.filter(c => c.status === 'open' || c.status === 'in_progress').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Knowledge Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeGraph?.nodes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Learning Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cases">Case Log</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>Recent learnings from autonomous operations</CardDescription>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Loading insights...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights?.recent?.slice(0, 5).map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">{insight.title}</div>
                          <div className="text-xs text-gray-500">{insight.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
                <CardDescription>Overview of cases by status and severity</CardDescription>
              </CardHeader>
              <CardContent>
                {casesLoading ? (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Loading cases...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Open</span>
                      <Badge className="bg-blue-100 text-blue-600">
                        {cases?.filter(c => c.status === 'open').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">In Progress</span>
                      <Badge className="bg-purple-100 text-purple-600">
                        {cases?.filter(c => c.status === 'in_progress').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolved</span>
                      <Badge className="bg-green-100 text-green-600">
                        {cases?.filter(c => c.status === 'resolved').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Closed</span>
                      <Badge className="bg-gray-100 text-gray-600">
                        {cases?.filter(c => c.status === 'closed').length || 0}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Graph Status</CardTitle>
                <CardDescription>Knowledge network health and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {graphLoading ? (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Loading graph...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Nodes</span>
                      <span className="text-sm font-mono">{knowledgeGraph?.nodes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Edges</span>
                      <span className="text-sm font-mono">{knowledgeGraph?.edges || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Updated</span>
                      <span className="text-sm">
                        {knowledgeGraph?.lastUpdated ? new Date(knowledgeGraph.lastUpdated).toLocaleString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Health Score</span>
                      <Badge className={knowledgeGraph?.healthScore > 80 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}>
                        {knowledgeGraph?.healthScore || 0}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common operations on enterprise memory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab('cases')}
                  variant="outline"
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View All Cases
                </Button>
                <Button 
                  onClick={() => setActiveTab('knowledge')}
                  variant="outline"
                  className="w-full"
                >
                  <Network className="w-4 h-4 mr-2" />
                  Explore Knowledge Graph
                </Button>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['enterprise-memory-cases'] })}
                  variant="outline"
                  className="w-full"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>Case Log</CardTitle>
              <CardDescription>Complete log of cases and their learning outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>

              {casesLoading ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Loading cases...
                </div>
              ) : cases?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No cases found
                </div>
              ) : (
                <div className="space-y-4">
                  {cases?.map((caseItem) => (
                    <div key={caseItem.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{caseItem.title}</h3>
                          <p className="text-sm text-gray-600">{caseItem.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSeverityColor(caseItem.severity)}>
                            {caseItem.severity}
                          </Badge>
                          <Badge className={getStatusColor(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2">{new Date(caseItem.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2">{caseItem.category}</span>
                        </div>
                      </div>
                      {caseItem.learning && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="text-sm font-medium text-yellow-800">Learning:</div>
                          <div className="text-sm text-yellow-700">{caseItem.learning}</div>
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Similar Cases</Button>
                        {caseItem.status !== 'closed' && (
                          <Button size="sm" onClick={() => updateCaseMutation.mutate({ caseId: caseItem.id, data: { status: 'closed' } })}>
                            Close Case
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph</CardTitle>
              <CardDescription>Visual representation of accumulated knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              {graphLoading ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Loading knowledge graph...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Total Knowledge Nodes</div>
                      <div className="text-2xl font-bold">{knowledgeGraph?.nodes || 0}</div>
                    </div>
                    <div className="p-4 border rounded">
                      <div className="text-sm text-gray-500 mb-1">Relationships</div>
                      <div className="text-2xl font-bold">{knowledgeGraph?.edges || 0}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-2">Top Knowledge Domains</h3>
                    <div className="space-y-2">
                      {knowledgeGraph?.domains?.slice(0, 5).map((domain, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{domain.name}</span>
                          <Badge variant="outline">{domain.count} nodes</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h3 className="font-semibold mb-2">Recent Knowledge Additions</h3>
                    <div className="space-y-2">
                      {knowledgeGraph?.recent?.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium">{item.title}</div>
                            <div className="text-xs text-gray-500">{new Date(item.addedAt).toLocaleString()}</div>
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

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Learning Insights</CardTitle>
              <CardDescription>AI-generated insights from case analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Loading insights...
                </div>
              ) : (
                <div className="space-y-4">
                  {insights?.insights?.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h3 className="font-semibold">{insight.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-medium text-blue-800">Recommendation:</div>
                        <div className="text-sm text-blue-700">{insight.recommendation}</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Based on {insight.caseCount} cases • Confidence: {insight.confidence}%
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
              <CardTitle>Memory Analytics</CardTitle>
              <CardDescription>Performance metrics and learning trends</CardDescription>
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
