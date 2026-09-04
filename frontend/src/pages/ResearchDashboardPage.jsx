import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, FileText, Users, Database, Activity, BookOpen, FlaskConical, BarChart3, Lightbulb, Award } from 'lucide-react';
import { researchAndDevelopmentAPI } from '../services/api';

// This dashboard previously showed entirely invented data - hardcoded named
// field trials ("Chak-Hao Black Rice Variety" in Imphal), fabricated AI
// insight percentages (+35%, 92%, +28%) with no backing, and a
// `researchAPI.getStats()` call to `/research/stats`, a route that doesn't
// exist on the backend (see services/api.js comment above `researchAPI`).
// The backend does have a real, working R&D service though
// (backend/src/routes/researchAndDevelopmentRoutes.js +
// services/legacy/researchAndDevelopmentService.js, exposed here as
// `researchAndDevelopmentAPI`) that was never wired to any UI. This page now
// calls that real API for every tab. Some collections (collaborations,
// innovations, patents, publications, knowledge base) start out empty on a
// fresh backend - that's shown honestly as an empty state rather than
// papered over with invented rows.
function ResearchDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analytics } = useQuery({
    queryKey: ['rd-analytics'],
    queryFn: () => researchAndDevelopmentAPI.getRDAnalytics().then(r => r.data?.data),
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['rd-projects'],
    queryFn: () => researchAndDevelopmentAPI.getRDProjects({}).then(r => r.data?.data),
    enabled: activeTab === 'overview' || activeTab === 'trials',
  });

  const { data: innovations, isLoading: innovationsLoading } = useQuery({
    queryKey: ['rd-innovations'],
    queryFn: () => researchAndDevelopmentAPI.getInnovations({}).then(r => r.data?.data),
    enabled: activeTab === 'data',
  });

  const { data: knowledge, isLoading: knowledgeLoading } = useQuery({
    queryKey: ['rd-knowledge'],
    queryFn: () => researchAndDevelopmentAPI.searchKnowledgeBase('').then(r => r.data?.data),
    enabled: activeTab === 'knowledge',
  });

  const { data: collaborations, isLoading: collaborationsLoading } = useQuery({
    queryKey: ['rd-collaborations'],
    queryFn: () => researchAndDevelopmentAPI.getCollaborations({}).then(r => r.data?.data),
    enabled: activeTab === 'collaboration',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Research Portal</h1>
        <p className="text-gray-600">Field trial management, data partnerships, and innovation research platform</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'trials', label: 'R&D Projects', icon: FlaskConical },
          { id: 'data', label: 'Innovations & Patents', icon: Lightbulb },
          { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          { id: 'collaboration', label: 'Collaboration', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center whitespace-nowrap ${
              activeTab === tab.id ?
                'bg-teal-600 text-white' :
                'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats - real numbers from researchAndDevelopmentAPI.getRDAnalytics() */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <FlaskConical className="w-8 h-8 text-teal-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analytics?.projects?.active ?? 0} / {analytics?.projects?.total ?? 0}
              </div>
              <div className="text-sm text-gray-600">R&D Projects</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analytics?.projects?.aiEnabled ?? 0}
              </div>
              <div className="text-sm text-gray-600">AI-Enabled Projects</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-green-600" />
                <span className="text-sm text-gray-500">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analytics?.collaborations?.active ?? 0}
              </div>
              <div className="text-sm text-gray-600">Collaborations</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-gray-500">Published</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {analytics?.publications?.total ?? 0}
              </div>
              <div className="text-sm text-gray-600">Publications</div>
            </div>
          </div>

          {/* Budget summary - derived from real project data, not invented percentages */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-teal-600" />
              R&D Budget Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Committed Budget</div>
                <div className="text-2xl font-bold text-teal-600">
                  {analytics?.projects?.totalBudget != null ? `₹${analytics.projects.totalBudget.toLocaleString()}` : '—'}
                </div>
                <div className="text-xs text-gray-500">Across all R&D projects</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.projects?.totalSpent != null ? `₹${analytics.projects.totalSpent.toLocaleString()}` : '—'}
                </div>
                <div className="text-xs text-gray-500">Reported to date</div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Patents</div>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.patents?.granted ?? 0} granted / {analytics?.patents?.pending ?? 0} pending
                </div>
                <div className="text-xs text-gray-500">Out of {analytics?.patents?.total ?? 0} filed</div>
              </div>
            </div>
          </div>

          {/* Active Projects - real data from researchAndDevelopmentAPI.getRDProjects() */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">R&D Projects</h3>
            {projectsLoading && <div className="text-sm text-gray-500">Loading projects...</div>}
            {!projectsLoading && (!projects || projects.length === 0) && (
              <div className="text-sm text-gray-500">No R&D projects registered yet</div>
            )}
            {!projectsLoading && projects?.length > 0 && (
              <div className="space-y-3">
                {projects.map((trial) => (
                  <div key={trial.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{trial.name}</div>
                      <div className="text-sm text-gray-500">{trial.category} • {trial.priority} priority</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      trial.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                      {trial.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* R&D Projects Tab - real data, replaces the previous "Field Trial
          Management" tab which was a hardcoded static placeholder */}
      {activeTab === 'trials' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">R&D Project Management</h3>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <FlaskConical className="w-5 h-5 text-teal-600 mr-3 mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800">Project Tracking</div>
                <div className="text-sm text-gray-600">
                  Field trials, technology pilots, and applied research projects are tracked here with milestones, budget, and AI-integration status.
                </div>
              </div>
            </div>
          </div>
          {projectsLoading && <div className="text-sm text-gray-500">Loading projects...</div>}
          {!projectsLoading && (!projects || projects.length === 0) && (
            <div className="text-center py-8 text-gray-500">No R&D projects registered yet</div>
          )}
          {!projectsLoading && projects?.length > 0 && (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.description}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-gray-600">Budget</div>
                      <div className="font-medium">₹{(project.budget || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Spent</div>
                      <div className="font-medium">₹{(project.spent || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Team</div>
                      <div className="font-medium">{project.team?.length || 0} members</div>
                    </div>
                    <div>
                      <div className="text-gray-600">AI Integration</div>
                      <div className="font-medium">{project.aiIntegration?.enabled ? 'Enabled' : 'Not enabled'}</div>
                    </div>
                  </div>
                  {project.milestones?.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium text-gray-700 mb-2">Milestones</div>
                      <div className="space-y-1">
                        {project.milestones.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{m.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              m.status === 'completed' ? 'bg-green-100 text-green-800' :
                                m.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-600'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Innovations & Patents Tab - real data, replaces the previous
          "Data Partnerships" tab which listed invented named partners
          (Assam Agricultural University, ICAR, etc.) with fabricated data
          point counts and no API behind them. */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Innovations & Patents</h3>
          {innovationsLoading && <div className="text-sm text-gray-500">Loading innovations...</div>}
          {!innovationsLoading && (!innovations || innovations.length === 0) && (
            <div className="text-sm text-gray-500">
              No innovations recorded yet. As field trials and projects yield patentable results, they'll be tracked here.
            </div>
          )}
          {!innovationsLoading && innovations?.length > 0 && (
            <div className="space-y-3">
              {innovations.map((innovation) => (
                <div key={innovation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800">{innovation.title}</div>
                    <div className="text-sm text-gray-500">{innovation.category} • {innovation.stage}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {innovation.patentStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Knowledge Base Tab - real data from researchAndDevelopmentAPI.searchKnowledgeBase() */}
      {activeTab === 'knowledge' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Knowledge Base</h3>
          {knowledgeLoading && <div className="text-sm text-gray-500">Loading knowledge base...</div>}
          {!knowledgeLoading && (!knowledge || knowledge.length === 0) && (
            <div className="text-sm text-gray-500">
              No knowledge base entries yet. Best practices, technology assessments, and case studies added by researchers will appear here.
            </div>
          )}
          {!knowledgeLoading && knowledge?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledge.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{entry.title}</h4>
                  <div className="text-sm text-gray-600">{entry.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab - real breakdown from researchAndDevelopmentAPI.getRDAnalytics(),
          replaces the previous "would be implemented here" placeholder */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">R&D Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <FlaskConical className="w-4 h-4 mr-2 text-teal-600" /> Projects
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-medium">{analytics?.projects?.total ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Active</span><span className="font-medium">{analytics?.projects?.active ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Completed</span><span className="font-medium">{analytics?.projects?.completed ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">AI-Enabled</span><span className="font-medium">{analytics?.projects?.aiEnabled ?? 0}</span></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 mr-2 text-orange-600" /> Innovations
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-medium">{analytics?.innovations?.total ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Patented</span><span className="font-medium">{analytics?.innovations?.patented ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">In Development</span><span className="font-medium">{analytics?.innovations?.inDevelopment ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Estimated Value</span><span className="font-medium">₹{(analytics?.innovations?.totalValue ?? 0).toLocaleString()}</span></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-purple-600" /> Patents
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total Filed</span><span className="font-medium">{analytics?.patents?.total ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Granted</span><span className="font-medium">{analytics?.patents?.granted ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pending</span><span className="font-medium">{analytics?.patents?.pending ?? 0}</span></div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-600" /> Publications
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-medium">{analytics?.publications?.total ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Published</span><span className="font-medium">{analytics?.publications?.published ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total Citations</span><span className="font-medium">{analytics?.publications?.totalCitations ?? 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Tab - real data from researchAndDevelopmentAPI.getCollaborations() */}
      {activeTab === 'collaboration' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collaborative Research</h3>
          {collaborationsLoading && <div className="text-sm text-gray-500">Loading collaborations...</div>}
          {!collaborationsLoading && (!collaborations || collaborations.length === 0) && (
            <div className="text-sm text-gray-500">
              No active research collaborations yet. Institutions and partners can be onboarded through the R&D collaboration workflow.
            </div>
          )}
          {!collaborationsLoading && collaborations?.length > 0 && (
            <div className="space-y-3">
              {collaborations.map((collab) => (
                <div key={collab.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-800">{collab.name}</div>
                      <div className="text-sm text-gray-500">{collab.partners?.length || 0} partners • {collab.type}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      collab.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                      {collab.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResearchDashboardPage;
