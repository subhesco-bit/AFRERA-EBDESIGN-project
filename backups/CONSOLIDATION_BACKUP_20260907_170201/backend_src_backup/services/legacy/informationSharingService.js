/**
 * Information Sharing Service
 * 
 * This service provides comprehensive information sharing capabilities including
 * document sharing, knowledge repositories, collaboration tools, access control,
 * version management, and AI-powered content recommendations.
 */

class InformationSharingService {
  constructor() {
    // Documents storage
    this.documents = new Map();
    
    // Shared folders
    this.folders = new Map();
    
    // Access permissions
    this.permissions = new Map();
    
    // Sharing links
    this.sharingLinks = new Map();
    
    // Collaboration sessions
    this.collaborationSessions = new Map();
    
    // Content recommendations
    this.aiRecommendations = new Map();
    
    // Activity logs
    this.activityLogs = new Map();
    
    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default information sharing data
   */
  initializeDefaultData() {
    // Sample documents
    this.documents.set('doc-001', {
      id: 'doc-001',
      name: 'Agricultural Best Practices Guide',
      type: 'document',
      category: 'knowledge',
      format: 'pdf',
      size: 2500000,
      ownerId: 'user-001',
      folderId: 'folder-001',
      version: 1,
      status: 'active',
      tags: ['agriculture', 'best-practices', 'guide'],
      description: 'Comprehensive guide to agricultural best practices',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      accessCount: 45
    });

    this.documents.set('doc-002', {
      id: 'doc-002',
      name: 'Crop Disease Database',
      type: 'database',
      category: 'research',
      format: 'json',
      size: 5000000,
      ownerId: 'user-002',
      folderId: 'folder-002',
      version: 2,
      status: 'active',
      tags: ['crops', 'diseases', 'database', 'research'],
      description: 'Database of crop diseases and treatments',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      accessCount: 120
    });

    // Sample folders
    this.folders.set('folder-001', {
      id: 'folder-001',
      name: 'Agricultural Knowledge',
      parentId: null,
      ownerId: 'user-001',
      type: 'public',
      description: 'Collection of agricultural knowledge documents',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });

    this.folders.set('folder-002', {
      id: 'folder-002',
      name: 'Research Data',
      parentId: null,
      ownerId: 'user-002',
      type: 'restricted',
      description: 'Research data and findings',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    });
  }

  /**
   * Create a new document
   */
  createDocument(documentData) {
    const documentId = documentData.id || `doc-${Date.now()}`;
    
    const document = {
      id: documentId,
      name: documentData.name,
      type: documentData.type || 'document',
      category: documentData.category || 'general',
      format: documentData.format || 'unknown',
      size: documentData.size || 0,
      ownerId: documentData.ownerId,
      folderId: documentData.folderId || null,
      version: documentData.version || 1,
      status: documentData.status || 'active',
      tags: documentData.tags || [],
      description: documentData.description || '',
      metadata: documentData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0
    };

    this.documents.set(documentId, document);
    this.logActivity('document_created', documentId, documentData.ownerId);
    return document;
  }

  /**
   * Get all documents
   */
  getDocuments(filters = {}) {
    let documents = Array.from(this.documents.values());

    if (filters.status) {
      documents = documents.filter(d => d.status === filters.status);
    }

    if (filters.category) {
      documents = documents.filter(d => d.category === filters.category);
    }

    if (filters.type) {
      documents = documents.filter(d => d.type === filters.type);
    }

    if (filters.ownerId) {
      documents = documents.filter(d => d.ownerId === filters.ownerId);
    }

    if (filters.folderId) {
      documents = documents.filter(d => d.folderId === filters.folderId);
    }

    if (filters.tag) {
      documents = documents.filter(d => d.tags.includes(filters.tag));
    }

    return documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Get a specific document
   */
  getDocument(documentId) {
    const document = this.documents.get(documentId);
    if (document) {
      document.accessCount = (document.accessCount || 0) + 1;
      this.documents.set(documentId, document);
    }
    return document;
  }

  /**
   * Update document
   */
  updateDocument(documentId, updates) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updatedDocument = {
      ...document,
      ...updates,
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    };

    this.documents.set(documentId, updatedDocument);
    this.logActivity('document_updated', documentId, document.ownerId);
    return updatedDocument;
  }

  /**
   * Delete document
   */
  deleteDocument(documentId) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    this.documents.delete(documentId);
    this.logActivity('document_deleted', documentId, document.ownerId);
    return { success: true, message: `Document ${documentId} deleted` };
  }

  /**
   * Create a folder
   */
  createFolder(folderData) {
    const folderId = folderData.id || `folder-${Date.now()}`;
    
    const folder = {
      id: folderId,
      name: folderData.name,
      parentId: folderData.parentId || null,
      ownerId: folderData.ownerId,
      type: folderData.type || 'private',
      description: folderData.description || '',
      metadata: folderData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.folders.set(folderId, folder);
    this.logActivity('folder_created', folderId, folderData.ownerId);
    return folder;
  }

  /**
   * Get all folders
   */
  getFolders(filters = {}) {
    let folders = Array.from(this.folders.values());

    if (filters.type) {
      folders = folders.filter(f => f.type === filters.type);
    }

    if (filters.ownerId) {
      folders = folders.filter(f => f.ownerId === filters.ownerId);
    }

    if (filters.parentId !== undefined) {
      folders = folders.filter(f => f.parentId === filters.parentId);
    }

    return folders;
  }

  /**
   * Get folder tree structure
   */
  getFolderTree(rootId = null) {
    const buildTree = (parentId) => {
      const children = this.getFolders({ parentId }).map(folder => ({
        ...folder,
        children: buildTree(folder.id),
        documentCount: this.getDocuments({ folderId: folder.id }).length
      }));
      return children;
    };

    return buildTree(rootId);
  }

  /**
   * Set permission for document or folder
   */
  setPermission(permissionData) {
    const permissionId = permissionData.id || `perm-${Date.now()}`;
    
    const permission = {
      id: permissionId,
      resourceId: permissionData.resourceId,
      resourceType: permissionData.resourceType || 'document',
      userId: permissionData.userId,
      role: permissionData.role || 'viewer',
      permissions: permissionData.permissions || ['read'],
      grantedBy: permissionData.grantedBy,
      expiresAt: permissionData.expiresAt || null,
      createdAt: new Date().toISOString()
    };

    this.permissions.set(permissionId, permission);
    this.logActivity('permission_granted', permissionData.resourceId, permissionData.grantedBy);
    return permission;
  }

  /**
   * Get permissions for a resource
   */
  getPermissions(resourceId, resourceType = 'document') {
    return Array.from(this.permissions.values()).filter(
      p => p.resourceId === resourceId && p.resourceType === resourceType
    );
  }

  /**
   * Check if user has permission
   */
  checkPermission(resourceId, userId, requiredPermission = 'read') {
    const permissions = this.getPermissions(resourceId);
    const userPermission = permissions.find(p => p.userId === userId);
    
    if (!userPermission) {
      return false;
    }

    return userPermission.permissions.includes(requiredPermission);
  }

  /**
   * Create sharing link
   */
  createSharingLink(linkData) {
    const linkId = linkData.id || `link-${Date.now()}`;
    
    const link = {
      id: linkId,
      resourceId: linkData.resourceId,
      resourceType: linkData.resourceType || 'document',
      token: this.generateToken(),
      createdBy: linkData.createdBy,
      expiresAt: linkData.expiresAt || null,
      accessLimit: linkData.accessLimit || null,
      accessCount: 0,
      password: linkData.password || null,
      permissions: linkData.permissions || ['read'],
      createdAt: new Date().toISOString()
    };

    this.sharingLinks.set(linkId, link);
    this.logActivity('link_created', linkData.resourceId, linkData.createdBy);
    return link;
  }

  /**
   * Get sharing link by token
   */
  getSharingLinkByToken(token) {
    const link = Array.from(this.sharingLinks.values()).find(l => l.token === token);
    
    if (link) {
      // Check if expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return null;
      }
      
      // Check if access limit reached
      if (link.accessLimit && link.accessCount >= link.accessLimit) {
        return null;
      }
      
      link.accessCount = link.accessCount + 1;
      this.sharingLinks.set(link.id, link);
    }
    
    return link;
  }

  /**
   * Generate random token
   */
  generateToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Create collaboration session
   */
  createCollaborationSession(sessionData) {
    const sessionId = sessionData.id || `session-${Date.now()}`;
    
    const session = {
      id: sessionId,
      resourceId: sessionData.resourceId,
      resourceType: sessionData.resourceType || 'document',
      createdBy: sessionData.createdBy,
      participants: [sessionData.createdBy],
      status: 'active',
      mode: sessionData.mode || 'edit',
      startedAt: new Date().toISOString(),
      endedAt: null,
      changes: []
    };

    this.collaborationSessions.set(sessionId, session);
    this.logActivity('collaboration_started', sessionData.resourceId, sessionData.createdBy);
    return session;
  }

  /**
   * Get all collaboration sessions
   */
  getCollaborationSessions(filters = {}) {
    let sessions = Array.from(this.collaborationSessions.values());

    if (filters.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }

    if (filters.resourceId) {
      sessions = sessions.filter(s => s.resourceId === filters.resourceId);
    }

    return sessions;
  }

  /**
   * Join collaboration session
   */
  joinCollaborationSession(sessionId, userId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    this.collaborationSessions.set(sessionId, session);
    return session;
  }

  /**
   * End collaboration session
   */
  endCollaborationSession(sessionId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Collaboration session ${sessionId} not found`);
    }

    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    this.collaborationSessions.set(sessionId, session);
    this.logActivity('collaboration_ended', session.resourceId, session.createdBy);
    return session;
  }

  /**
   * Generate AI content recommendations
   */
  async generateAIRecommendations(userId, context) {
    const recommendations = {
      userId: userId,
      context: context,
      recommendations: [],
      confidence: null,
      implemented: false,
      reason: 'No real recommendation model is connected — relevance scores below are not yet computed.',
      generatedAt: new Date().toISOString()
    };

    if (context.type === 'related_documents') {
      const documents = this.getDocuments();
      recommendations.recommendations = documents.slice(0, 5).map(doc => ({
        documentId: doc.id,
        name: doc.name,
        relevance: null,
        reason: 'Similar content based on tags and category'
      }));
    } else if (context.type === 'suggested_folders') {
      const folders = this.getFolders();
      recommendations.recommendations = folders.slice(0, 3).map(folder => ({
        folderId: folder.id,
        name: folder.name,
        relevance: null,
        reason: 'Based on your recent activity'
      }));
    } else {
      recommendations.recommendations = [
        {
          action: 'Share with team',
          description: 'Consider sharing this document with your team for collaboration',
          priority: 'medium'
        },
        {
          action: 'Add to knowledge base',
          description: 'This document could be valuable for the knowledge base',
          priority: 'high'
        }
      ];
    }

    this.aiRecommendations.set(`${userId}-${Date.now()}`, recommendations);
    return recommendations;
  }

  /**
   * Log activity
   */
  logActivity(action, resourceId, userId) {
    const logId = `log-${Date.now()}`;
    
    const log = {
      id: logId,
      action: action,
      resourceId: resourceId,
      userId: userId,
      timestamp: new Date().toISOString()
    };

    if (!this.activityLogs.has(resourceId)) {
      this.activityLogs.set(resourceId, []);
    }
    this.activityLogs.get(resourceId).push(log);
  }

  /**
   * Get activity logs for a resource
   */
  getActivityLogs(resourceId) {
    return this.activityLogs.get(resourceId) || [];
  }

  /**
   * Get sharing analytics
   */
  getAnalytics() {
    const documents = Array.from(this.documents.values());
    const folders = Array.from(this.folders.values());
    const links = Array.from(this.sharingLinks.values());
    const sessions = Array.from(this.collaborationSessions.values());

    return {
      documents: {
        total: documents.length,
        active: documents.filter(d => d.status === 'active').length,
        byType: this.groupByType(documents),
        byCategory: this.groupByCategory(documents),
        totalSize: documents.reduce((sum, d) => sum + d.size, 0),
        totalAccesses: documents.reduce((sum, d) => sum + (d.accessCount || 0), 0)
      },
      folders: {
        total: folders.length,
        byType: this.groupByType(folders)
      },
      sharing: {
        totalLinks: links.length,
        activeLinks: links.filter(l => !l.expiresAt || new Date(l.expiresAt) > new Date()).length,
        totalAccesses: links.reduce((sum, l) => sum + l.accessCount, 0)
      },
      collaboration: {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.status === 'active').length,
        totalParticipants: sessions.reduce((sum, s) => sum + s.participants.length, 0)
      }
    };
  }

  /**
   * Group items by type
   */
  groupByType(items) {
    const grouped = {};
    items.forEach(item => {
      const type = item.type || 'other';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group documents by category
   */
  groupByCategory(documents) {
    const grouped = {};
    documents.forEach(doc => {
      const category = doc.category || 'other';
      grouped[category] = (grouped[category] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Search documents
   */
  searchDocuments(query, filters = {}) {
    let documents = this.getDocuments(filters);
    
    if (query) {
      const queryLower = query.toLowerCase();
      documents = documents.filter(d => 
        d.name.toLowerCase().includes(queryLower) ||
        d.description.toLowerCase().includes(queryLower) ||
        d.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    }

    return documents;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      documents: this.documents.size,
      folders: this.folders.size,
      permissions: this.permissions.size,
      sharingLinks: this.sharingLinks.size,
      collaborationSessions: this.collaborationSessions.size,
      aiRecommendations: this.aiRecommendations.size,
      activityLogs: this.activityLogs.size
    };
  }
}

// Export singleton instance
const informationSharingService = new InformationSharingService();

module.exports = informationSharingService;
