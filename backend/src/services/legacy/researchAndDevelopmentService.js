/**
 * Research and Development (R&D) Service
 * 
 * This service provides comprehensive R&D management capabilities including
 * project management, research collaboration, innovation tracking, patent management,
 * funding management, and AI-powered research assistance.
 */

class ResearchAndDevelopmentService {
  constructor() {
    // R&D projects storage
    this.rdProjects = new Map();
    
    // Research collaborations
    this.collaborations = new Map();
    
    // Innovation tracking
    this.innovations = new Map();
    
    // Patent management
    this.patents = new Map();
    
    // Funding opportunities
    this.fundingOpportunities = new Map();
    
    // Research publications
    this.publications = new Map();
    
    // AI research assistants
    this.aiAssistants = new Map();
    
    // Research knowledge base
    this.knowledgeBase = new Map();
    
    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default R&D data
   */
  initializeDefaultData() {
    // Sample R&D projects
    this.rdProjects.set('rd-001', {
      id: 'rd-001',
      name: 'Smart Irrigation System Optimization',
      description: 'AI-powered irrigation system using IoT sensors and machine learning',
      category: 'agriculture-technology',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-15',
      endDate: '2025-12-31',
      budget: 5000000,
      spent: 2500000,
      team: ['researcher-001', 'researcher-002', 'researcher-003'],
      milestones: [
        { id: 'm1', name: 'Sensor Deployment', status: 'completed', dueDate: '2024-06-30' },
        { id: 'm2', name: 'ML Model Training', status: 'in-progress', dueDate: '2024-12-31' },
        { id: 'm3', name: 'Field Testing', status: 'pending', dueDate: '2025-06-30' }
      ],
      aiIntegration: {
        enabled: true,
        models: ['tensorflow', 'pytorch'],
        features: ['predictive-analytics', 'anomaly-detection']
      },
      createdAt: '2024-01-15T00:00:00Z'
    });

    this.rdProjects.set('rd-002', {
      id: 'rd-002',
      name: 'Crop Disease Detection Using Computer Vision',
      description: 'Deep learning model for early detection of crop diseases',
      category: 'plant-health',
      status: 'active',
      priority: 'high',
      startDate: '2024-03-01',
      endDate: '2026-03-31',
      budget: 7500000,
      spent: 3000000,
      team: ['researcher-004', 'researcher-005'],
      milestones: [
        { id: 'm1', name: 'Data Collection', status: 'completed', dueDate: '2024-09-30' },
        { id: 'm2', name: 'Model Development', status: 'in-progress', dueDate: '2025-03-31' }
      ],
      aiIntegration: {
        enabled: true,
        models: ['tensorflow', 'opencv'],
        features: ['image-classification', 'object-detection']
      },
      createdAt: '2024-03-01T00:00:00Z'
    });

    // Sample funding opportunities
    this.fundingOpportunities.set('fund-001', {
      id: 'fund-001',
      name: 'Agricultural Innovation Grant',
      provider: 'Government of India',
      description: 'Grant for innovative agricultural technologies',
      category: 'government',
      amount: 10000000,
      deadline: '2025-06-30',
      eligibility: ['agriculture-technology', 'plant-health'],
      status: 'open',
      applicationUrl: '/grants/apply/fund-001',
      createdAt: '2024-01-01T00:00:00Z'
    });
  }

  /**
   * Create a new R&D project
   */
  createRDProject(projectData) {
    const projectId = projectData.id || `rd-${Date.now()}`;
    
    const project = {
      id: projectId,
      name: projectData.name,
      description: projectData.description,
      category: projectData.category || 'general',
      status: projectData.status || 'planning',
      priority: projectData.priority || 'medium',
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      budget: projectData.budget || 0,
      spent: 0,
      team: projectData.team || [],
      milestones: projectData.milestones || [],
      aiIntegration: projectData.aiIntegration || {
        enabled: false,
        models: [],
        features: []
      },
      metadata: projectData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.rdProjects.set(projectId, project);
    return project;
  }

  /**
   * Get all R&D projects
   */
  getRDProjects(filters = {}) {
    let projects = Array.from(this.rdProjects.values());

    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      projects = projects.filter(p => p.category === filters.category);
    }

    if (filters.priority) {
      projects = projects.filter(p => p.priority === filters.priority);
    }

    if (filters.aiEnabled === 'true') {
      projects = projects.filter(p => p.aiIntegration.enabled === true);
    }

    return projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get a specific R&D project
   */
  getRDProject(projectId) {
    return this.rdProjects.get(projectId);
  }

  /**
   * Update R&D project
   */
  updateRDProject(projectId, updates) {
    let project = this.rdProjects.get(projectId);
    if (!project) {
      throw new Error(`R&D project ${projectId} not found`);
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.rdProjects.set(projectId, updatedProject);
    return updatedProject;
  }

  /**
   * Delete R&D project
   */
  deleteRDProject(projectId) {
    let project = this.rdProjects.get(projectId);
    if (!project) {
      throw new Error(`R&D project ${projectId} not found`);
    }

    this.rdProjects.delete(projectId);
    return { success: true, message: `R&D project ${projectId} deleted` };
  }

  /**
   * Add milestone to project
   */
  addMilestone(projectId, milestoneData) {
    let project = this.rdProjects.get(projectId);
    if (!project) {
      throw new Error(`R&D project ${projectId} not found`);
    }

    const milestone = {
      id: milestoneData.id || `m-${Date.now()}`,
      name: milestoneData.name,
      description: milestoneData.description,
      status: milestoneData.status || 'pending',
      dueDate: milestoneData.dueDate,
      completedAt: milestoneData.completedAt || null
    };

    project.milestones.push(milestone);
    project.updatedAt = new Date().toISOString();
    this.rdProjects.set(projectId, project);

    return milestone;
  }

  /**
   * Update milestone status
   */
  updateMilestone(projectId, milestoneId, updates) {
    let project = this.rdProjects.get(projectId);
    if (!project) {
      throw new Error(`R&D project ${projectId} not found`);
    }

    let milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    Object.assign(milestone, updates);
    if (updates.status === 'completed' && !milestone.completedAt) {
      milestone.completedAt = new Date().toISOString();
    }

    project.updatedAt = new Date().toISOString();
    this.rdProjects.set(projectId, project);

    return milestone;
  }

  /**
   * Create research collaboration
   */
  createCollaboration(collaborationData) {
    const collaborationId = collaborationData.id || `collab-${Date.now()}`;
    
    const collaboration = {
      id: collaborationId,
      name: collaborationData.name,
      description: collaborationData.description,
      type: collaborationData.type || 'research',
      partners: collaborationData.partners || [],
      projectId: collaborationData.projectId,
      status: collaborationData.status || 'active',
      startDate: collaborationData.startDate,
      endDate: collaborationData.endDate,
      budget: collaborationData.budget || 0,
      objectives: collaborationData.objectives || [],
      deliverables: collaborationData.deliverables || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.collaborations.set(collaborationId, collaboration);
    return collaboration;
  }

  /**
   * Get all collaborations
   */
  getCollaborations(filters = {}) {
    let collaborations = Array.from(this.collaborations.values());

    if (filters.status) {
      collaborations = collaborations.filter(c => c.status === filters.status);
    }

    if (filters.type) {
      collaborations = collaborations.filter(c => c.type === filters.type);
    }

    if (filters.projectId) {
      collaborations = collaborations.filter(c => c.projectId === filters.projectId);
    }

    return collaborations;
  }

  /**
   * Create innovation record
   */
  createInnovation(innovationData) {
    const innovationId = innovationData.id || `innovation-${Date.now()}`;
    
    const innovation = {
      id: innovationId,
      title: innovationData.title,
      description: innovationData.description,
      category: innovationData.category || 'process',
      projectId: innovationData.projectId,
      inventor: innovationData.inventor || [],
      status: innovationData.status || 'concept',
      stage: innovationData.stage || 'idea',
      potentialImpact: innovationData.potentialImpact || 'medium',
      estimatedValue: innovationData.estimatedValue || 0,
      patentStatus: innovationData.patentStatus || 'not-filed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.innovations.set(innovationId, innovation);
    return innovation;
  }

  /**
   * Get all innovations
   */
  getInnovations(filters = {}) {
    let innovations = Array.from(this.innovations.values());

    if (filters.status) {
      innovations = innovations.filter(i => i.status === filters.status);
    }

    if (filters.category) {
      innovations = innovations.filter(i => i.category === filters.category);
    }

    if (filters.projectId) {
      innovations = innovations.filter(i => i.projectId === filters.projectId);
    }

    if (filters.patentStatus) {
      innovations = innovations.filter(i => i.patentStatus === filters.patentStatus);
    }

    return innovations;
  }

  /**
   * Create patent record
   */
  createPatent(patentData) {
    const patentId = patentData.id || `patent-${Date.now()}`;
    
    const patent = {
      id: patentId,
      title: patentData.title,
      description: patentData.description,
      innovationId: patentData.innovationId,
      inventors: patentData.inventors || [],
      filingDate: patentData.filingDate,
      grantDate: patentData.grantDate || null,
      status: patentData.status || 'pending',
      patentNumber: patentData.patentNumber || null,
      jurisdiction: patentData.jurisdiction || 'IN',
      category: patentData.category || 'invention',
      expirationDate: patentData.expirationDate || null,
      maintenanceFees: patentData.maintenanceFees || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.patents.set(patentId, patent);
    return patent;
  }

  /**
   * Get all patents
   */
  getPatents(filters = {}) {
    let patents = Array.from(this.patents.values());

    if (filters.status) {
      patents = patents.filter(p => p.status === filters.status);
    }

    if (filters.jurisdiction) {
      patents = patents.filter(p => p.jurisdiction === filters.jurisdiction);
    }

    if (filters.innovationId) {
      patents = patents.filter(p => p.innovationId === filters.innovationId);
    }

    return patents;
  }

  /**
   * Create funding opportunity
   */
  createFundingOpportunity(fundingData) {
    const fundingId = fundingData.id || `fund-${Date.now()}`;
    
    const funding = {
      id: fundingId,
      name: fundingData.name,
      provider: fundingData.provider,
      description: fundingData.description,
      category: fundingData.category || 'general',
      amount: fundingData.amount || 0,
      currency: fundingData.currency || 'INR',
      deadline: fundingData.deadline,
      eligibility: fundingData.eligibility || [],
      requirements: fundingData.requirements || [],
      status: fundingData.status || 'open',
      applicationUrl: fundingData.applicationUrl,
      documents: fundingData.documents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.fundingOpportunities.set(fundingId, funding);
    return funding;
  }

  /**
   * Get all funding opportunities
   */
  getFundingOpportunities(filters = {}) {
    let opportunities = Array.from(this.fundingOpportunities.values());

    if (filters.status) {
      opportunities = opportunities.filter(f => f.status === filters.status);
    }

    if (filters.category) {
      opportunities = opportunities.filter(f => f.category === filters.category);
    }

    if (filters.provider) {
      opportunities = opportunities.filter(f => f.provider === filters.provider);
    }

    return opportunities.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  /**
   * Apply for funding
   */
  applyForFunding(fundingId, applicationData) {
    let funding = this.fundingOpportunities.get(fundingId);
    if (!funding) {
      throw new Error(`Funding opportunity ${fundingId} not found`);
    }

    const application = {
      id: `app-${Date.now()}`,
      fundingId: fundingId,
      projectId: applicationData.projectId,
      applicant: applicationData.applicant,
      proposal: applicationData.proposal,
      budget: applicationData.budget,
      timeline: applicationData.timeline,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };

    // Store application in funding record
    if (!funding.applications) {
      funding.applications = [];
    }
    funding.applications.push(application);
    funding.updatedAt = new Date().toISOString();
    this.fundingOpportunities.set(fundingId, funding);

    return application;
  }

  /**
   * Create publication record
   */
  createPublication(publicationData) {
    const publicationId = publicationData.id || `pub-${Date.now()}`;
    
    const publication = {
      id: publicationId,
      title: publicationData.title,
      abstract: publicationData.abstract,
      authors: publicationData.authors || [],
      projectId: publicationData.projectId,
      type: publicationData.type || 'journal',
      venue: publicationData.venue,
      publicationDate: publicationData.publicationDate,
      doi: publicationData.doi || null,
      keywords: publicationData.keywords || [],
      status: publicationData.status || 'draft',
      citations: publicationData.citations || 0,
      downloads: publicationData.downloads || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.publications.set(publicationId, publication);
    return publication;
  }

  /**
   * Get all publications
   */
  getPublications(filters = {}) {
    let publications = Array.from(this.publications.values());

    if (filters.status) {
      publications = publications.filter(p => p.status === filters.status);
    }

    if (filters.type) {
      publications = publications.filter(p => p.type === filters.type);
    }

    if (filters.projectId) {
      publications = publications.filter(p => p.projectId === filters.projectId);
    }

    return publications.sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate));
  }

  /**
   * AI-powered research assistance
   */
  async getAIResearchAssistance(query, context = {}) {
    // Simulate AI research assistance
    const assistance = {
      query: query,
      response: this.generateAIResponse(query, context),
      sources: this.generateRelevantSources(query),
      suggestions: this.generateSuggestions(query, context),
      confidence: null,
      implemented: false,
      reason: 'No real research-assistance AI model is connected to this service — response/sources/suggestions below are template-generated, not model output.',
      timestamp: new Date().toISOString()
    };

    return assistance;
  }

  /**
   * Generate AI response for research query
   */
  generateAIResponse(query, context) {
    // FIXED 2026-09-01: Previously selected random response with Math.random
    // No real research AI is connected in this environment; honestly report
    // unavailable state instead of fabricating plausible-looking research responses.
    return {
      status: 'unavailable',
      reason: 'Research AI service not configured. Implement Claude AI integration or provide ANTHROPIC_API_KEY.',
      query: query,
      context: context,
      available_features: ['AI research assistant', 'literature review', 'experimental design'],
      configuration_required: 'ANTHROPIC_API_KEY',
      suggested_approach: 'Claude AI coordinator can provide research assistance when configured'
    };
  }

  /**
   * Generate relevant research sources
   */
  generateRelevantSources(query) {
    return [
      { type: 'journal', title: 'Agricultural Technology Advances', year: 2024 },
      { type: 'conference', title: 'AI in Agriculture Summit', year: 2024 },
      { type: 'dataset', title: 'Crop Yield Historical Data', year: 2023 },
      { type: 'repository', title: 'Open Agricultural Models', year: 2024 }
    ];
  }

  /**
   * Generate research suggestions
   */
  generateSuggestions(query, context) {
    return [
      'Consider implementing a pilot study before full deployment',
      'Integrate with existing IoT infrastructure for data collection',
      'Collaborate with agricultural research institutions for validation',
      'Develop a scalable architecture for future expansion'
    ];
  }

  /**
   * Add knowledge to research knowledge base
   */
  addKnowledge(knowledgeData) {
    const knowledgeId = knowledgeData.id || `kb-${Date.now()}`;
    
    const knowledge = {
      id: knowledgeId,
      title: knowledgeData.title,
      content: knowledgeData.content,
      category: knowledgeData.category || 'general',
      tags: knowledgeData.tags || [],
      source: knowledgeData.source || 'internal',
      relatedProjects: knowledgeData.relatedProjects || [],
      confidence: knowledgeData.confidence || 0.8,
      verified: knowledgeData.verified || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.knowledgeBase.set(knowledgeId, knowledge);
    return knowledge;
  }

  /**
   * Search knowledge base
   */
  searchKnowledgeBase(query, filters = {}) {
    let knowledge = Array.from(this.knowledgeBase.values());

    // Simple keyword matching
    if (query) {
      const queryLower = query.toLowerCase();
      knowledge = knowledge.filter(k => 
        k.title.toLowerCase().includes(queryLower) ||
        k.content.toLowerCase().includes(queryLower) ||
        k.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    }

    if (filters.category) {
      knowledge = knowledge.filter(k => k.category === filters.category);
    }

    if (filters.verified === 'true') {
      knowledge = knowledge.filter(k => k.verified === true);
    }

    return knowledge;
  }

  /**
   * Get R&D analytics
   */
  getRDAnalytics() {
    const projects = Array.from(this.rdProjects.values());
    const innovations = Array.from(this.innovations.values());
    const patents = Array.from(this.patents.values());
    const publications = Array.from(this.publications.values());

    return {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
        totalSpent: projects.reduce((sum, p) => sum + p.spent, 0),
        aiEnabled: projects.filter(p => p.aiIntegration.enabled).length
      },
      innovations: {
        total: innovations.length,
        patented: innovations.filter(i => i.patentStatus === 'granted').length,
        inDevelopment: innovations.filter(i => i.status === 'in-development').length,
        totalValue: innovations.reduce((sum, i) => sum + i.estimatedValue, 0)
      },
      patents: {
        total: patents.length,
        granted: patents.filter(p => p.status === 'granted').length,
        pending: patents.filter(p => p.status === 'pending').length
      },
      publications: {
        total: publications.length,
        published: publications.filter(p => p.status === 'published').length,
        totalCitations: publications.reduce((sum, p) => sum + p.citations, 0)
      },
      collaborations: {
        total: this.collaborations.size,
        active: Array.from(this.collaborations.values()).filter(c => c.status === 'active').length
      }
    };
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      projects: this.rdProjects.size,
      collaborations: this.collaborations.size,
      innovations: this.innovations.size,
      patents: this.patents.size,
      fundingOpportunities: this.fundingOpportunities.size,
      publications: this.publications.size,
      knowledgeBase: this.knowledgeBase.size
    };
  }
}

// Export singleton instance
const researchAndDevelopmentService = new ResearchAndDevelopmentService();

module.exports = researchAndDevelopmentService;
