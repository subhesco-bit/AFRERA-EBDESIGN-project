import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { researchAndDevelopmentAPI } from '../services/api';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/researchAndDevelopmentRoutes.js +
 * services/legacy/researchAndDevelopmentService.js (R&D project management,
 * collaborations, innovations, patents, funding, publications, AI research
 * assistance, knowledge base, analytics - all 21 endpoints cross-checked
 * against real service methods 2026-08-29, zero broken calls). ActionCards
 * grouped by the route file's own section structure into tabs.
 */
const TABS = [
  ['projects', 'Projects & Milestones'],
  ['collaborations', 'Collaborations'],
  ['innovations', 'Innovations & Patents'],
  ['funding', 'Funding'],
  ['publications', 'Publications'],
  ['ai', 'AI Assistance & Knowledge'],
  ['analytics', 'Analytics'],
];

function ResearchAndDevelopmentPage() {
  const [tab, setTab] = useState('projects');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <FlaskConical className="w-6 h-6 mr-2 text-slate-700" />
          Research and Development
        </h1>
        <p className="text-gray-600">R&amp;D project management, collaborations, innovations, patents, funding, publications and AI research assistance.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <>
          <ActionCard title="List R&D Projects" description="Get all R&D projects, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'category', label: 'Category' }, { name: 'priority', label: 'Priority' }, { name: 'aiEnabled', label: 'AI Enabled (true/false)' }]} onRun={(v) => researchAndDevelopmentAPI.getRDProjects(v)} />
          <ActionCard title="Get R&D Project" description="Get a specific R&D project by ID." fields={[{ name: 'projectId', label: 'Project ID' }]} onRun={(v) => researchAndDevelopmentAPI.getRDProject(v.projectId)} />
          <ActionCard title="Create R&D Project" description="Create a new R&D project." hasJsonPayload jsonPlaceholder='{"name": "Drought-resistant Paddy", "category": "crop-science", "priority": "high"}' onRun={(_, p) => researchAndDevelopmentAPI.createRDProject(p)} />
          <ActionCard title="Update R&D Project" description="Update an existing R&D project." fields={[{ name: 'projectId', label: 'Project ID' }]} hasJsonPayload jsonPlaceholder='{"status": "active"}' onRun={(v, p) => researchAndDevelopmentAPI.updateRDProject(v.projectId, p)} />
          <ActionCard title="Delete R&D Project" description="Delete an R&D project." fields={[{ name: 'projectId', label: 'Project ID' }]} onRun={(v) => researchAndDevelopmentAPI.deleteRDProject(v.projectId)} />
          <ActionCard title="Add Milestone" description="Add a milestone to a project." fields={[{ name: 'projectId', label: 'Project ID' }]} hasJsonPayload jsonPlaceholder='{"title": "Field trial complete", "dueDate": "2026-12-01"}' onRun={(v, p) => researchAndDevelopmentAPI.addMilestone(v.projectId, p)} />
          <ActionCard title="Update Milestone" description="Update a milestone's status." fields={[{ name: 'projectId', label: 'Project ID' }, { name: 'milestoneId', label: 'Milestone ID' }]} hasJsonPayload jsonPlaceholder='{"status": "completed"}' onRun={(v, p) => researchAndDevelopmentAPI.updateMilestone(v.projectId, v.milestoneId, p)} />
        </>
      )}

      {tab === 'collaborations' && (
        <>
          <ActionCard title="List Collaborations" description="Get all collaborations, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'type', label: 'Type' }, { name: 'projectId', label: 'Project ID' }]} onRun={(v) => researchAndDevelopmentAPI.getCollaborations(v)} />
          <ActionCard title="Create Collaboration" description="Create a new collaboration." hasJsonPayload jsonPlaceholder='{"partner": "ICAR", "type": "research", "projectId": "proj-1"}' onRun={(_, p) => researchAndDevelopmentAPI.createCollaboration(p)} />
        </>
      )}

      {tab === 'innovations' && (
        <>
          <ActionCard title="List Innovations" description="Get all innovations, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'category', label: 'Category' }, { name: 'projectId', label: 'Project ID' }, { name: 'patentStatus', label: 'Patent Status' }]} onRun={(v) => researchAndDevelopmentAPI.getInnovations(v)} />
          <ActionCard title="Create Innovation" description="Record a new innovation." hasJsonPayload jsonPlaceholder='{"title": "Low-cost soil sensor", "category": "agtech"}' onRun={(_, p) => researchAndDevelopmentAPI.createInnovation(p)} />
          <ActionCard title="List Patents" description="Get all patents, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'jurisdiction', label: 'Jurisdiction' }, { name: 'innovationId', label: 'Innovation ID' }]} onRun={(v) => researchAndDevelopmentAPI.getPatents(v)} />
          <ActionCard title="Create Patent" description="File a new patent record." hasJsonPayload jsonPlaceholder='{"title": "Soil sensor apparatus", "innovationId": "inn-1", "jurisdiction": "IN"}' onRun={(_, p) => researchAndDevelopmentAPI.createPatent(p)} />
        </>
      )}

      {tab === 'funding' && (
        <>
          <ActionCard title="List Funding Opportunities" description="Get all funding opportunities, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'category', label: 'Category' }, { name: 'provider', label: 'Provider' }]} onRun={(v) => researchAndDevelopmentAPI.getFundingOpportunities(v)} />
          <ActionCard title="Create Funding Opportunity" description="Add a new funding opportunity." hasJsonPayload jsonPlaceholder='{"title": "DST Agri Grant", "provider": "DST", "amount": 500000}' onRun={(_, p) => researchAndDevelopmentAPI.createFundingOpportunity(p)} />
          <ActionCard title="Apply for Funding" description="Submit an application for a funding opportunity." fields={[{ name: 'fundingId', label: 'Funding ID' }]} hasJsonPayload jsonPlaceholder='{"projectId": "proj-1", "amountRequested": 200000}' onRun={(v, p) => researchAndDevelopmentAPI.applyForFunding(v.fundingId, p)} />
        </>
      )}

      {tab === 'publications' && (
        <>
          <ActionCard title="List Publications" description="Get all publications, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'type', label: 'Type' }, { name: 'projectId', label: 'Project ID' }]} onRun={(v) => researchAndDevelopmentAPI.getPublications(v)} />
          <ActionCard title="Create Publication" description="Record a new publication." hasJsonPayload jsonPlaceholder='{"title": "Yield impact of biochar", "type": "journal", "projectId": "proj-1"}' onRun={(_, p) => researchAndDevelopmentAPI.createPublication(p)} />
        </>
      )}

      {tab === 'ai' && (
        <>
          <ActionCard title="AI Research Assistance" description="Ask the AI research assistant a question." fields={[{ name: 'query', label: 'Query' }]} hasJsonPayload jsonLabel="Context (optional)" jsonPlaceholder='{"projectId": "proj-1"}' onRun={(v, p) => researchAndDevelopmentAPI.getAIResearchAssistance(v.query, p)} />
          <ActionCard title="Search Knowledge Base" description="Search the R&D knowledge base." fields={[{ name: 'q', label: 'Query' }, { name: 'category', label: 'Category' }, { name: 'verified', label: 'Verified (true/false)' }]} onRun={(v) => researchAndDevelopmentAPI.searchKnowledgeBase(v.q, { category: v.category, verified: v.verified })} />
          <ActionCard title="Add Knowledge" description="Add an entry to the knowledge base." hasJsonPayload jsonPlaceholder='{"title": "Biochar soil amendment", "category": "soil-science", "content": "..."}' onRun={(_, p) => researchAndDevelopmentAPI.addKnowledge(p)} />
        </>
      )}

      {tab === 'analytics' && (
        <>
          <ActionCard title="R&D Analytics" description="Get aggregate R&D analytics." onRun={() => researchAndDevelopmentAPI.getRDAnalytics()} />
          <ActionCard title="Service Health" description="Check the R&D service health." onRun={() => researchAndDevelopmentAPI.getHealthStatus()} />
        </>
      )}
    </div>
  );
}

export default ResearchAndDevelopmentPage;
