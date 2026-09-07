import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { informationSharingAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/informationSharingRoutes.js +
 * services/legacy/informationSharingService.js (document management, folder
 * organization, permissions, sharing links, real-time collaboration sessions,
 * AI recommendations - all 21 endpoints cross-checked against real service
 * methods 2026-08-29, zero broken calls; fixed a route-ordering bug where
 * GET /documents/search was shadowed by GET /documents/:documentId).
 * ActionCards grouped by the route file's own section structure into tabs.
 */
const TABS = [
  ['documents', 'Documents'],
  ['folders', 'Folders'],
  ['permissions', 'Permissions'],
  ['sharing', 'Sharing Links'],
  ['collaboration', 'Collaboration Sessions'],
  ['ai', 'AI Recommendations'],
  ['analytics', 'Activity & Analytics'],
]

function InformationSharingPage() {
  const [tab, setTab] = useState('documents')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Share2 className="w-6 h-6 mr-2 text-slate-700" />
          Information Sharing
        </h1>
        <p className="text-gray-600">Document management, folders, permissions, sharing links, live collaboration sessions and AI recommendations.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-slate-700 text-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'documents' && (
        <>
          <ActionCard title="List Documents" description="Get all documents, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'category', label: 'Category' }, { name: 'type', label: 'Type' }, { name: 'ownerId', label: 'Owner ID' }, { name: 'folderId', label: 'Folder ID' }, { name: 'tag', label: 'Tag' }]} onRun={(v) => informationSharingAPI.getDocuments(v)} />
          <ActionCard title="Get Document" description="Get a specific document by ID." fields={[{ name: 'documentId', label: 'Document ID' }]} onRun={(v) => informationSharingAPI.getDocument(v.documentId)} />
          <ActionCard title="Search Documents" description="Full-text search across documents." fields={[{ name: 'q', label: 'Query' }, { name: 'status', label: 'Status' }, { name: 'category', label: 'Category' }, { name: 'type', label: 'Type' }]} onRun={(v) => informationSharingAPI.searchDocuments(v.q, { status: v.status, category: v.category, type: v.type })} />
          <ActionCard title="Create Document" description="Create a new document." hasJsonPayload jsonPlaceholder='{"title": "Soil Survey Report", "ownerId": "user-1", "type": "report"}' onRun={(_, p) => informationSharingAPI.createDocument(p)} />
          <ActionCard title="Update Document" description="Update an existing document." fields={[{ name: 'documentId', label: 'Document ID' }]} hasJsonPayload jsonPlaceholder='{"status": "published"}' onRun={(v, p) => informationSharingAPI.updateDocument(v.documentId, p)} />
          <ActionCard title="Delete Document" description="Delete a document." fields={[{ name: 'documentId', label: 'Document ID' }]} onRun={(v) => informationSharingAPI.deleteDocument(v.documentId)} />
        </>
      )}

      {tab === 'folders' && (
        <>
          <ActionCard title="List Folders" description="Get all folders, optionally filtered." fields={[{ name: 'type', label: 'Type' }, { name: 'ownerId', label: 'Owner ID' }, { name: 'parentId', label: 'Parent ID' }]} onRun={(v) => informationSharingAPI.getFolders(v)} />
          <ActionCard title="Get Folder Tree" description="Get the folder hierarchy from a root folder (or the top level)." fields={[{ name: 'rootId', label: 'Root Folder ID (optional)' }]} onRun={(v) => informationSharingAPI.getFolderTree(v.rootId)} />
          <ActionCard title="Create Folder" description="Create a new folder." hasJsonPayload jsonPlaceholder='{"name": "R&D Reports", "ownerId": "user-1"}' onRun={(_, p) => informationSharingAPI.createFolder(p)} />
        </>
      )}

      {tab === 'permissions' && (
        <>
          <ActionCard title="Get Permissions" description="Get all permissions granted on a resource." fields={[{ name: 'resourceId', label: 'Resource ID' }, { name: 'resourceType', label: 'Resource Type (default: document)' }]} onRun={(v) => informationSharingAPI.getPermissions(v.resourceId, v.resourceType)} />
          <ActionCard title="Set Permission" description="Grant a permission on a resource to a user." hasJsonPayload jsonPlaceholder='{"resourceId": "doc-1", "userId": "user-2", "permission": "write"}' onRun={(_, p) => informationSharingAPI.setPermission(p)} />
          <ActionCard title="Check Permission" description="Check whether a user has a given permission on a resource." fields={[{ name: 'resourceId', label: 'Resource ID' }, { name: 'userId', label: 'User ID' }, { name: 'permission', label: 'Permission (default: read)' }]} onRun={(v) => informationSharingAPI.checkPermission(v.resourceId, v.userId, v.permission)} />
        </>
      )}

      {tab === 'sharing' && (
        <>
          <ActionCard title="Create Sharing Link" description="Create a shareable link for a resource." hasJsonPayload jsonPlaceholder='{"resourceId": "doc-1", "resourceType": "document", "createdBy": "user-1"}' onRun={(_, p) => informationSharingAPI.createSharingLink(p)} />
          <ActionCard title="Access Sharing Link" description="Resolve a sharing link by its token." fields={[{ name: 'token', label: 'Token' }]} onRun={(v) => informationSharingAPI.accessSharingLink(v.token)} />
        </>
      )}

      {tab === 'collaboration' && (
        <>
          <ActionCard title="List Collaboration Sessions" description="Get all collaboration sessions, optionally filtered." fields={[{ name: 'status', label: 'Status' }, { name: 'resourceId', label: 'Resource ID' }]} onRun={(v) => informationSharingAPI.getCollaborationSessions(v)} />
          <ActionCard title="Create Collaboration Session" description="Start a new collaboration session on a resource." hasJsonPayload jsonPlaceholder='{"resourceId": "doc-1", "createdBy": "user-1"}' onRun={(_, p) => informationSharingAPI.createCollaborationSession(p)} />
          <ActionCard title="Join Collaboration Session" description="Join an existing collaboration session." fields={[{ name: 'sessionId', label: 'Session ID' }, { name: 'userId', label: 'User ID' }]} onRun={(v) => informationSharingAPI.joinCollaborationSession(v.sessionId, v.userId)} />
          <ActionCard title="End Collaboration Session" description="End a collaboration session." fields={[{ name: 'sessionId', label: 'Session ID' }]} onRun={(v) => informationSharingAPI.endCollaborationSession(v.sessionId)} />
        </>
      )}

      {tab === 'ai' && (
        <>
          <ActionCard title="Generate AI Recommendations" description="Get AI-generated recommendations for a user given a context." fields={[{ name: 'userId', label: 'User ID' }]} hasJsonPayload jsonLabel="Context" jsonPlaceholder='{"recentDocuments": ["doc-1"], "role": "researcher"}' onRun={(v, p) => informationSharingAPI.generateAIRecommendations(v.userId, p)} />
        </>
      )}

      {tab === 'analytics' && (
        <>
          <ActionCard title="Get Activity Logs" description="Get activity logs for a resource." fields={[{ name: 'resourceId', label: 'Resource ID' }]} onRun={(v) => informationSharingAPI.getActivityLogs(v.resourceId)} />
          <ActionCard title="Sharing Analytics" description="Get aggregate information-sharing analytics." onRun={() => informationSharingAPI.getAnalytics()} />
          <ActionCard title="Service Health" description="Check the Information Sharing service health." onRun={() => informationSharingAPI.getHealthStatus()} />
        </>
      )}
    </div>
  )
}

export default InformationSharingPage
