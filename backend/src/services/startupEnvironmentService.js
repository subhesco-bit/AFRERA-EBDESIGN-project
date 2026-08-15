/**
 * Startup Environment Service
 * 
 * This service provides comprehensive startup environment management including
 * incubation programs, mentorship, funding connections, resource allocation,
 * networking opportunities, and AI-powered startup assistance.
 */

class StartupEnvironmentService {
  constructor() {
    // Startup registry
    this.startups = new Map();
    
    // Incubation programs
    this.incubationPrograms = new Map();
    
    // Mentorship programs
    this.mentorshipPrograms = new Map();
    
    // Funding opportunities
    this.fundingOpportunities = new Map();
    
    // Resource allocations
    this.resourceAllocations = new Map();
    
    // Networking events
    this.networkingEvents = new Map();
    
    // AI startup recommendations
    this.aiRecommendations = new Map();
    
    // Progress tracking
    this.progressTracking = new Map();
    
    // Initialize default data
    this.initializeDefaultData();
  }

  /**
   * Initialize default startup environment data
   */
  initializeDefaultData() {
    // Sample startups
    this.startups.set('startup-001', {
      id: 'startup-001',
      name: 'AgriTech Solutions',
      description: 'AI-powered precision farming platform',
      founder: 'John Doe',
      email: 'john@agritech.com',
      sector: 'agriculture',
      stage: 'seed',
      status: 'active',
      teamSize: 5,
      foundedDate: '2023-06-15',
      incubationProgramId: 'incubator-001',
      mentorId: 'mentor-001',
      fundingRaised: 500000,
      fundingTarget: 2000000,
      milestones: [
        { id: 'm1', name: 'MVP Development', status: 'completed', completedAt: '2023-12-31' },
        { id: 'm2', name: 'Pilot Launch', status: 'in-progress', targetDate: '2024-06-30' }
      ],
      aiIntegration: {
        enabled: true,
        features: ['market-analysis', 'competitor-tracking', 'funding-prediction']
      },
      createdAt: '2023-06-15T00:00:00Z'
    });

    // Sample incubation program
    this.incubationPrograms.set('incubator-001', {
      id: 'incubator-001',
      name: 'AgriTech Incubator',
      description: 'Specialized incubator for agricultural technology startups',
      type: 'sector-specific',
      sector: 'agriculture',
      duration: 12,
      capacity: 20,
      currentOccupancy: 15,
      status: 'active',
      benefits: ['office-space', 'mentorship', 'funding-access', 'networking'],
      applicationDeadline: '2024-12-31',
      startDate: '2024-01-15',
      createdAt: '2023-01-01T00:00:00Z'
    });

    // Sample mentor
    this.mentorshipPrograms.set('mentor-001', {
      id: 'mentor-001',
      name: 'Dr. Sarah Johnson',
      expertise: ['agriculture', 'technology', 'business-development'],
      experience: 15,
      availability: 'part-time',
      status: 'active',
      mentees: ['startup-001'],
      bio: 'Former CTO of leading agri-tech company with 15+ years of experience',
      createdAt: '2023-01-01T00:00:00Z'
    });
  }

  /**
   * Register a new startup
   */
  registerStartup(startupData) {
    const startupId = startupData.id || `startup-${Date.now()}`;
    
    const startup = {
      id: startupId,
      name: startupData.name,
      description: startupData.description,
      founder: startupData.founder,
      email: startupData.email,
      sector: startupData.sector || 'general',
      stage: startupData.stage || 'idea',
      status: startupData.status || 'pending',
      teamSize: startupData.teamSize || 1,
      foundedDate: startupData.foundedDate || new Date().toISOString().split('T')[0],
      incubationProgramId: startupData.incubationProgramId || null,
      mentorId: startupData.mentorId || null,
      fundingRaised: startupData.fundingRaised || 0,
      fundingTarget: startupData.fundingTarget || 0,
      milestones: startupData.milestones || [],
      aiIntegration: startupData.aiIntegration || {
        enabled: false,
        features: []
      },
      metadata: startupData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.startups.set(startupId, startup);
    return startup;
  }

  /**
   * Get all startups
   */
  getStartups(filters = {}) {
    let startups = Array.from(this.startups.values());

    if (filters.status) {
      startups = startups.filter(s => s.status === filters.status);
    }

    if (filters.sector) {
      startups = startups.filter(s => s.sector === filters.sector);
    }

    if (filters.stage) {
      startups = startups.filter(s => s.stage === filters.stage);
    }

    if (filters.incubationProgramId) {
      startups = startups.filter(s => s.incubationProgramId === filters.incubationProgramId);
    }

    return startups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get a specific startup
   */
  getStartup(startupId) {
    return this.startups.get(startupId);
  }

  /**
   * Update startup
   */
  updateStartup(startupId, updates) {
    const startup = this.startups.get(startupId);
    if (!startup) {
      throw new Error(`Startup ${startupId} not found`);
    }

    const updatedStartup = {
      ...startup,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.startups.set(startupId, updatedStartup);
    return updatedStartup;
  }

  /**
   * Create incubation program
   */
  createIncubationProgram(programData) {
    const programId = programData.id || `incubator-${Date.now()}`;
    
    const program = {
      id: programId,
      name: programData.name,
      description: programData.description,
      type: programData.type || 'general',
      sector: programData.sector || 'general',
      duration: programData.duration || 12,
      capacity: programData.capacity || 20,
      currentOccupancy: 0,
      status: programData.status || 'active',
      benefits: programData.benefits || [],
      applicationDeadline: programData.applicationDeadline,
      startDate: programData.startDate,
      endDate: programData.endDate,
      requirements: programData.requirements || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.incubationPrograms.set(programId, program);
    return program;
  }

  /**
   * Get all incubation programs
   */
  getIncubationPrograms(filters = {}) {
    let programs = Array.from(this.incubationPrograms.values());

    if (filters.status) {
      programs = programs.filter(p => p.status === filters.status);
    }

    if (filters.type) {
      programs = programs.filter(p => p.type === filters.type);
    }

    if (filters.sector) {
      programs = programs.filter(p => p.sector === filters.sector);
    }

    return programs;
  }

  /**
   * Apply for incubation program
   */
  applyForIncubation(programId, applicationData) {
    const program = this.incubationPrograms.get(programId);
    if (!program) {
      throw new Error(`Incubation program ${programId} not found`);
    }

    if (program.currentOccupancy >= program.capacity) {
      throw new Error('Incubation program is at full capacity');
    }

    const application = {
      id: `app-${Date.now()}`,
      programId: programId,
      startupId: applicationData.startupId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      approvedAt: null,
      rejectionReason: null
    };

    // Store application in program
    if (!program.applications) {
      program.applications = [];
    }
    program.applications.push(application);
    program.updatedAt = new Date().toISOString();
    this.incubationPrograms.set(programId, program);

    return application;
  }

  /**
   * Create mentor
   */
  createMentor(mentorData) {
    const mentorId = mentorData.id || `mentor-${Date.now()}`;
    
    const mentor = {
      id: mentorId,
      name: mentorData.name,
      expertise: mentorData.expertise || [],
      experience: mentorData.experience || 0,
      availability: mentorData.availability || 'full-time',
      status: mentorData.status || 'active',
      mentees: mentorData.mentees || [],
      bio: mentorData.bio || '',
      rate: mentorData.rate || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mentorshipPrograms.set(mentorId, mentor);
    return mentor;
  }

  /**
   * Get all mentors
   */
  getMentors(filters = {}) {
    let mentors = Array.from(this.mentorshipPrograms.values());

    if (filters.status) {
      mentors = mentors.filter(m => m.status === filters.status);
    }

    if (filters.expertise) {
      mentors = mentors.filter(m => m.expertise.includes(filters.expertise));
    }

    if (filters.availability) {
      mentors = mentors.filter(m => m.availability === filters.availability);
    }

    return mentors;
  }

  /**
   * Assign mentor to startup
   */
  assignMentor(startupId, mentorId) {
    const startup = this.startups.get(startupId);
    if (!startup) {
      throw new Error(`Startup ${startupId} not found`);
    }

    const mentor = this.mentorshipPrograms.get(mentorId);
    if (!mentor) {
      throw new Error(`Mentor ${mentorId} not found`);
    }

    startup.mentorId = mentorId;
    startup.updatedAt = new Date().toISOString();
    this.startups.set(startupId, startup);

    mentor.mentees.push(startupId);
    mentor.updatedAt = new Date().toISOString();
    this.mentorshipPrograms.set(mentorId, mentor);

    return { startup, mentor };
  }

  /**
   * Create funding opportunity
   */
  createFundingOpportunity(fundingData) {
    const fundingId = fundingData.id || `funding-${Date.now()}`;
    
    const funding = {
      id: fundingId,
      name: fundingData.name,
      provider: fundingData.provider,
      type: fundingData.type || 'equity',
      amount: fundingData.amount || 0,
      currency: fundingData.currency || 'INR',
      sector: fundingData.sector || 'general',
      stage: fundingData.stage || 'any',
      deadline: fundingData.deadline,
      requirements: fundingData.requirements || [],
      status: fundingData.status || 'open',
      description: fundingData.description || '',
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

    if (filters.sector) {
      opportunities = opportunities.filter(f => f.sector === filters.sector);
    }

    if (filters.type) {
      opportunities = opportunities.filter(f => f.type === filters.type);
    }

    if (filters.stage) {
      opportunities = opportunities.filter(f => f.stage === filters.stage || f.stage === 'any');
    }

    return opportunities.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  /**
   * Apply for funding
   */
  applyForFunding(fundingId, applicationData) {
    const funding = this.fundingOpportunities.get(fundingId);
    if (!funding) {
      throw new Error(`Funding opportunity ${fundingId} not found`);
    }

    const application = {
      id: `funding-app-${Date.now()}`,
      fundingId: fundingId,
      startupId: applicationData.startupId,
      amountRequested: applicationData.amountRequested,
      pitchDeck: applicationData.pitchDeck,
      financials: applicationData.financials,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      approvedAt: null,
      rejectionReason: null
    };

    if (!funding.applications) {
      funding.applications = [];
    }
    funding.applications.push(application);
    funding.updatedAt = new Date().toISOString();
    this.fundingOpportunities.set(fundingId, funding);

    return application;
  }

  /**
   * Allocate resources to startup
   */
  allocateResources(startupId, resources) {
    const startup = this.startups.get(startupId);
    if (!startup) {
      throw new Error(`Startup ${startupId} not found`);
    }

    const allocation = {
      id: `resource-${Date.now()}`,
      startupId: startupId,
      resources: {
        officeSpace: resources.officeSpace || false,
        equipment: resources.equipment || [],
        software: resources.software || [],
        budget: resources.budget || 0,
        credits: resources.credits || []
      },
      allocatedAt: new Date().toISOString(),
      expiresAt: resources.expiresAt || null,
      status: 'active'
    };

    this.resourceAllocations.set(allocation.id, allocation);
    return allocation;
  }

  /**
   * Create networking event
   */
  createNetworkingEvent(eventData) {
    const eventId = eventData.id || `event-${Date.now()}`;
    
    const event = {
      id: eventId,
      name: eventData.name,
      description: eventData.description,
      type: eventData.type || 'meetup',
      date: eventData.date,
      location: eventData.location || 'virtual',
      capacity: eventData.capacity || 50,
      registered: 0,
      targetAudience: eventData.targetAudience || 'all',
      status: eventData.status || 'upcoming',
      speakers: eventData.speakers || [],
      agenda: eventData.agenda || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.networkingEvents.set(eventId, event);
    return event;
  }

  /**
   * Get all networking events
   */
  getNetworkingEvents(filters = {}) {
    let events = Array.from(this.networkingEvents.values());

    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Register for networking event
   */
  registerForEvent(eventId, startupId) {
    const event = this.networkingEvents.get(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    if (event.registered >= event.capacity) {
      throw new Error('Event is at full capacity');
    }

    if (!event.attendees) {
      event.attendees = [];
    }
    event.attendees.push(startupId);
    event.registered = event.attendees.length;
    event.updatedAt = new Date().toISOString();
    this.networkingEvents.set(eventId, event);

    return event;
  }

  /**
   * Generate AI startup recommendations
   */
  async generateAIRecommendations(startupId, recommendationType) {
    const startup = this.startups.get(startupId);
    if (!startup) {
      throw new Error(`Startup ${startupId} not found`);
    }

    const recommendations = {
      startupId: startupId,
      type: recommendationType,
      recommendations: [],
      confidence: null,
      implemented: false,
      reason: 'No real recommendation model is connected to this service.',
      generatedAt: new Date().toISOString()
    };

    if (recommendationType === 'funding') {
      recommendations.recommendations = [
        {
          opportunity: 'Government Startup Grant',
          matchScore: 0.85,
          reason: 'Your agricultural technology focus aligns with this grant',
          amount: 1000000,
          deadline: '2024-12-31'
        },
        {
          opportunity: 'Angel Investor Network',
          matchScore: 0.78,
          reason: 'Your seed stage and team size match investor criteria',
          amount: 500000,
          deadline: '2024-09-30'
        }
      ];
    } else if (recommendationType === 'mentorship') {
      recommendations.recommendations = [
        {
          mentor: 'Dr. Sarah Johnson',
          expertise: ['agriculture', 'technology'],
          matchScore: 0.92,
          reason: 'Expertise matches your sector and technology focus'
        },
        {
          mentor: 'Mark Thompson',
          expertise: ['business-development', 'funding'],
          matchScore: 0.85,
          reason: 'Can help with funding and business scaling'
        }
      ];
    } else if (recommendationType === 'growth') {
      recommendations.recommendations = [
        {
          action: 'Expand to new markets',
          description: 'Consider expanding to neighboring states with similar agricultural profiles',
          priority: 'high',
          estimatedImpact: '30% revenue increase'
        },
        {
          action: 'Develop partnerships',
          description: 'Partner with agricultural equipment manufacturers for integrated solutions',
          priority: 'medium',
          estimatedImpact: '20% market reach increase'
        }
      ];
    } else {
      recommendations.recommendations = [
        {
          action: 'Join incubation program',
          description: 'Apply to AgriTech Incubator for mentorship and resources',
          priority: 'high',
          estimatedImpact: 'Accelerated growth trajectory'
        }
      ];
    }

    this.aiRecommendations.set(`${startupId}-${recommendationType}-${Date.now()}`, recommendations);
    return recommendations;
  }

  /**
   * Track startup progress
   */
  trackProgress(startupId, progressData) {
    const startup = this.startups.get(startupId);
    if (!startup) {
      throw new Error(`Startup ${startupId} not found`);
    }

    const progress = {
      id: `progress-${Date.now()}`,
      startupId: startupId,
      metrics: {
        revenue: progressData.revenue || 0,
        users: progressData.users || 0,
        teamSize: progressData.teamSize || startup.teamSize,
        fundingRaised: progressData.fundingRaised || startup.fundingRaised,
        milestonesCompleted: progressData.milestonesCompleted || 0
      },
      achievements: progressData.achievements || [],
      challenges: progressData.challenges || [],
      nextGoals: progressData.nextGoals || [],
      recordedAt: new Date().toISOString()
    };

    if (!this.progressTracking.has(startupId)) {
      this.progressTracking.set(startupId, []);
    }
    this.progressTracking.get(startupId).push(progress);

    return progress;
  }

  /**
   * Get startup progress history
   */
  getStartupProgress(startupId) {
    return this.progressTracking.get(startupId) || [];
  }

  /**
   * Get startup environment analytics
   */
  getAnalytics() {
    const startups = Array.from(this.startups.values());
    const programs = Array.from(this.incubationPrograms.values());
    const mentors = Array.from(this.mentorshipPrograms.values());
    const funding = Array.from(this.fundingOpportunities.values());

    return {
      startups: {
        total: startups.length,
        active: startups.filter(s => s.status === 'active').length,
        bySector: this.groupBySector(startups),
        byStage: this.groupByStage(startups),
        totalFundingRaised: startups.reduce((sum, s) => sum + s.fundingRaised, 0),
        averageTeamSize: startups.length > 0 ? startups.reduce((sum, s) => sum + s.teamSize, 0) / startups.length : 0
      },
      incubation: {
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p.status === 'active').length,
        totalCapacity: programs.reduce((sum, p) => sum + p.capacity, 0),
        currentOccupancy: programs.reduce((sum, p) => sum + p.currentOccupancy, 0)
      },
      mentorship: {
        totalMentors: mentors.length,
        activeMentors: mentors.filter(m => m.status === 'active').length,
        totalMentees: mentors.reduce((sum, m) => sum + m.mentees.length, 0)
      },
      funding: {
        totalOpportunities: funding.length,
        openOpportunities: funding.filter(f => f.status === 'open').length,
        totalAvailable: funding.reduce((sum, f) => sum + f.amount, 0)
      },
      networking: {
        totalEvents: this.networkingEvents.size,
        upcomingEvents: Array.from(this.networkingEvents.values()).filter(e => e.status === 'upcoming').length
      }
    };
  }

  /**
   * Group startups by sector
   */
  groupBySector(startups) {
    const grouped = {};
    startups.forEach(s => {
      const sector = s.sector || 'other';
      grouped[sector] = (grouped[sector] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group startups by stage
   */
  groupByStage(startups) {
    const grouped = {};
    startups.forEach(s => {
      const stage = s.stage || 'unknown';
      grouped[stage] = (grouped[stage] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      startups: this.startups.size,
      incubationPrograms: this.incubationPrograms.size,
      mentors: this.mentorshipPrograms.size,
      fundingOpportunities: this.fundingOpportunities.size,
      networkingEvents: this.networkingEvents.size,
      resourceAllocations: this.resourceAllocations.size,
      aiRecommendations: this.aiRecommendations.size
    };
  }
}

// Export singleton instance
const startupEnvironmentService = new StartupEnvironmentService();

module.exports = startupEnvironmentService;
