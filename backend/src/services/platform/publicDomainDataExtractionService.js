/**
 * Public Domain Data Extraction Service
 * 
 * This service provides comprehensive capabilities for extracting, processing, and managing
 * public domain data from government websites, research institutions, defense organizations,
 * universities, and private institutions. It includes specialized features for subsidy
 * applications with eligibility matching and filtering.
 */

class PublicDomainDataExtractionService {
  constructor() {
    // Data source configurations
    this.dataSources = new Map();
    
    // Extraction jobs tracking
    this.extractionJobs = new Map();
    
    // Processed data storage
    this.processedData = new Map();
    
    // Subsidy database
    this.subsidyDatabase = new Map();
    
    // Eligibility rules
    this.eligibilityRules = new Map();
    
    // Data filters
    this.dataFilters = new Map();
    
    // Compliance records
    this.complianceRecords = new Map();
    
    // Initialize default data sources
    this.initializeDefaultDataSources();
    
    // Initialize default eligibility rules
    this.initializeDefaultEligibilityRules();
  }

  /**
   * Initialize default data source configurations
   */
  initializeDefaultDataSources() {
    // Government portals
    this.dataSources.set('data.gov', {
      id: 'data.gov',
      name: 'Data.gov',
      type: 'government',
      country: 'US',
      baseUrl: 'https://api.data.gov',
      apiKey: process.env.DATA_GOV_API_KEY,
      rateLimit: 1000,
      lastSync: null,
      status: 'active',
      categories: ['federal', 'state', 'local']
    });

    this.dataSources.set('myscheme', {
      id: 'myscheme',
      name: 'MyScheme Portal',
      type: 'government',
      country: 'India',
      baseUrl: 'https://myscheme.gov.in',
      apiKey: null,
      rateLimit: 100,
      lastSync: null,
      status: 'active',
      categories: ['subsidies', 'schemes', 'welfare']
    });

    this.dataSources.set('opensubsidies', {
      id: 'opensubsidies',
      name: 'OpenSubsidies',
      type: 'agricultural',
      country: 'US',
      baseUrl: 'https://www.opensubsidies.org',
      apiKey: null,
      rateLimit: 500,
      lastSync: null,
      status: 'active',
      categories: ['farm-subsidies', 'agriculture']
    });

    this.dataSources.set('farmsubsidy', {
      id: 'farmsubsidy',
      name: 'FarmSubsidy.org',
      type: 'agricultural',
      country: 'EU',
      baseUrl: 'https://farmsubsidy.org',
      apiKey: null,
      rateLimit: 200,
      lastSync: null,
      status: 'active',
      categories: ['cap-subsidies', 'eu-agriculture']
    });

    // Research institutions
    this.dataSources.set('crossref', {
      id: 'crossref',
      name: 'Crossref',
      type: 'research',
      country: 'International',
      baseUrl: 'https://api.crossref.org',
      apiKey: null,
      rateLimit: 50,
      lastSync: null,
      status: 'active',
      categories: ['publications', 'metadata', 'scholarly']
    });

    this.dataSources.set('core', {
      id: 'core',
      name: 'CORE',
      type: 'research',
      country: 'International',
      baseUrl: 'https://core.ac.uk',
      apiKey: process.env.CORE_API_KEY,
      rateLimit: 10,
      lastSync: null,
      status: 'active',
      categories: ['open-access', 'research-papers']
    });

    // Defense organizations
    this.dataSources.set('dod-data', {
      id: 'dod-data',
      name: 'Department of Defense Data',
      type: 'defense',
      country: 'US',
      baseUrl: 'https://data.defense.gov',
      apiKey: process.env.DOD_API_KEY,
      rateLimit: 100,
      lastSync: null,
      status: 'active',
      categories: ['acquisition', 'legal', 'programs']
    });
  }

  /**
   * Initialize default eligibility rules for subsidy matching
   */
  initializeDefaultEligibilityRules() {
    this.eligibilityRules.set('age', {
      field: 'age',
      type: 'range',
      min: 18,
      max: null,
      required: false
    });

    this.eligibilityRules.set('income', {
      field: 'income',
      type: 'range',
      min: 0,
      max: null,
      currency: 'INR',
      required: true
    });

    this.eligibilityRules.set('gender', {
      field: 'gender',
      type: 'enum',
      values: ['all', 'male', 'female'],
      required: false
    });

    this.eligibilityRules.set('caste', {
      field: 'caste',
      type: 'enum',
      values: ['SC', 'ST', 'OBC', 'General'],
      required: false
    });

    this.eligibilityRules.set('residence', {
      field: 'residence',
      type: 'enum',
      values: ['rural', 'urban', 'both'],
      required: false
    });

    this.eligibilityRules.set('disability', {
      field: 'disability',
      type: 'boolean',
      required: false
    });

    this.eligibilityRules.set('bpl', {
      field: 'bpl',
      type: 'boolean',
      required: false
    });

    this.eligibilityRules.set('state', {
      field: 'state',
      type: 'array',
      required: false
    });
  }

  /**
   * Register a new data source
   */
  registerDataSource(sourceConfig) {
    const sourceId = sourceConfig.id || `source-${Date.now()}`;
    
    const source = {
      id: sourceId,
      name: sourceConfig.name,
      type: sourceConfig.type || 'generic',
      country: sourceConfig.country || 'Unknown',
      baseUrl: sourceConfig.baseUrl,
      apiKey: sourceConfig.apiKey,
      rateLimit: sourceConfig.rateLimit || 100,
      lastSync: null,
      status: 'active',
      categories: sourceConfig.categories || [],
      createdAt: new Date().toISOString()
    };

    this.dataSources.set(sourceId, source);
    return source;
  }

  /**
   * Get all data sources
   */
  getDataSources(filters = {}) {
    let sources = Array.from(this.dataSources.values());

    if (filters.type) {
      sources = sources.filter(s => s.type === filters.type);
    }

    if (filters.country) {
      sources = sources.filter(s => s.country === filters.country);
    }

    if (filters.status) {
      sources = sources.filter(s => s.status === filters.status);
    }

    if (filters.category) {
      sources = sources.filter(s => s.categories.includes(filters.category));
    }

    return sources;
  }

  /**
   * Get a specific data source
   */
  getDataSource(sourceId) {
    return this.dataSources.get(sourceId);
  }

  /**
   * Update data source configuration
   */
  updateDataSource(sourceId, updates) {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    const updatedSource = {
      ...source,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.dataSources.set(sourceId, updatedSource);
    return updatedSource;
  }

  /**
   * Delete a data source
   */
  deleteDataSource(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    this.dataSources.delete(sourceId);
    return { success: true, message: `Data source ${sourceId} deleted` };
  }

  /**
   * Create an extraction job
   */
  createExtractionJob(jobConfig) {
    const jobId = jobConfig.id || `job-${Date.now()}`;
    
    const job = {
      id: jobId,
      sourceId: jobConfig.sourceId,
      type: jobConfig.type || 'full',
      filters: jobConfig.filters || {},
      status: 'pending',
      progress: 0,
      recordsExtracted: 0,
      recordsProcessed: 0,
      errors: [],
      startedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    this.extractionJobs.set(jobId, job);
    return job;
  }

  /**
   * Start an extraction job
   */
  async startExtractionJob(jobId) {
    const job = this.extractionJobs.get(jobId);
    if (!job) {
      throw new Error(`Extraction job ${jobId} not found`);
    }

    const source = this.dataSources.get(job.sourceId);
    if (!source) {
      throw new Error(`Data source ${job.sourceId} not found`);
    }

    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.extractionJobs.set(jobId, job);

    // Simulate extraction process
    return this.simulateExtraction(jobId, source);
  }

  /**
   * Run a data extraction job against a registered source.
   *
   * FIXED 2026-08-15: previously "simulated" extraction by fabricating a
   * random record count and generating entirely fake records via
   * generateSampleData() below — including fake government scheme names,
   * fake ministries, a dead example.com apply link, fake ₹ benefit amounts,
   * and (for the "agricultural" type) US states (California/Texas/Iowa) in
   * a platform built for Northeast India. This service has no real
   * connector to any actual government open-data portal, so it cannot
   * extract real data. The real, DB-backed, verified government scheme
   * registry is services/governmentSchemeService.js (government_schemes
   * table) — that is the canonical source for actual scheme data, not
   * this service. This method now honestly reports that no real extractor
   * is configured for the source's type, rather than fabricating records.
   */
  async simulateExtraction(jobId, source) {
    const job = this.extractionJobs.get(jobId);

    job.status = 'failed';
    job.progress = 0;
    job.recordsExtracted = 0;
    job.completedAt = new Date().toISOString();
    job.error = `No real extractor is configured for source type "${source.type}". This service has no live connector to an actual government/research open-data API in this environment — see services/governmentSchemeService.js for the real, verified government_schemes registry instead of extracted/simulated data.`;

    this.extractionJobs.set(jobId, job);
    this.processedData.set(jobId, []);

    return job;
  }

  /**
   * Previously generated entirely fabricated records (fake scheme names,
   * dead apply URLs, fake benefit amounts, wrong-country data). Removed —
   * no real extraction happens in this environment, so there is no real
   * data to generate a sample of. Kept as a no-op for callers that still
   * reference it, returning an empty result rather than fabricated records.
   */
  generateSampleData(type, count) {
    return [];
  }

  /**
   * Get extraction job status
   */
  getExtractionJob(jobId) {
    return this.extractionJobs.get(jobId);
  }

  /**
   * Get all extraction jobs
   */
  getExtractionJobs(filters = {}) {
    let jobs = Array.from(this.extractionJobs.values());

    if (filters.status) {
      jobs = jobs.filter(j => j.status === filters.status);
    }

    if (filters.sourceId) {
      jobs = jobs.filter(j => j.sourceId === filters.sourceId);
    }

    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Cancel an extraction job
   */
  cancelExtractionJob(jobId) {
    const job = this.extractionJobs.get(jobId);
    if (!job) {
      throw new Error(`Extraction job ${jobId} not found`);
    }

    if (job.status === 'completed') {
      throw new Error(`Cannot cancel completed job ${jobId}`);
    }

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();
    this.extractionJobs.set(jobId, job);

    return job;
  }

  /**
   * Get processed data from an extraction job
   */
  getProcessedData(jobId, filters = {}) {
    const data = this.processedData.get(jobId);
    if (!data) {
      throw new Error(`No processed data found for job ${jobId}`);
    }

    let filteredData = data;

    // Apply filters
    if (filters.category) {
      filteredData = filteredData.filter(d => d.category === filters.category);
    }

    if (filters.minAmount) {
      filteredData = filteredData.filter(d => 
        parseFloat(d.amount || d.benefits?.replace(/[₹,]/g, '')) >= filters.minAmount
      );
    }

    if (filters.maxAmount) {
      filteredData = filteredData.filter(d => 
        parseFloat(d.amount || d.benefits?.replace(/[₹,]/g, '')) <= filters.maxAmount
      );
    }

    if (filters.year) {
      filteredData = filteredData.filter(d => d.year === filters.year);
    }

    if (filters.state) {
      filteredData = filteredData.filter(d => d.state === filters.state);
    }

    return filteredData;
  }

  /**
   * Create a data filter
   */
  createDataFilter(filterConfig) {
    const filterId = filterConfig.id || `filter-${Date.now()}`;
    
    const filter = {
      id: filterId,
      name: filterConfig.name,
      type: filterConfig.type || 'custom',
      conditions: filterConfig.conditions || [],
      createdAt: new Date().toISOString()
    };

    this.dataFilters.set(filterId, filter);
    return filter;
  }

  /**
   * Get all data filters
   */
  getDataFilters() {
    return Array.from(this.dataFilters.values());
  }

  /**
   * Apply a filter to data
   */
  applyFilterToData(filterId, data) {
    const filter = this.dataFilters.get(filterId);
    if (!filter) {
      throw new Error(`Filter ${filterId} not found`);
    }

    return data.filter(record => {
      return filter.conditions.every(condition => {
        const field = record[condition.field];
        
        switch (condition.field) {
          case 'equals':
            return field === condition.value;
          case 'contains':
            return field && field.includes(condition.value);
          case 'greaterThan':
            return field > condition.value;
          case 'lessThan':
            return field < condition.value;
          case 'in':
            return condition.value.includes(field);
          default:
            return true;
        }
      });
    });
  }

  /**
   * Add subsidy to database
   */
  addSubsidy(subsidyData) {
    const subsidyId = subsidyData.id || `subsidy-${Date.now()}`;
    
    const subsidy = {
      id: subsidyId,
      name: subsidyData.name,
      description: subsidyData.description,
      category: subsidyData.category,
      ministry: subsidyData.ministry,
      department: subsidyData.department,
      state: subsidyData.state || 'Central',
      benefits: subsidyData.benefits,
      eligibility: subsidyData.eligibility || {},
      application_process: subsidyData.application_process,
      documents_required: subsidyData.documents_required,
      apply_url: subsidyData.apply_url,
      official_url: subsidyData.official_url,
      last_updated: subsidyData.last_updated || new Date().toISOString(),
      verified: subsidyData.verified || false,
      createdAt: new Date().toISOString()
    };

    this.subsidyDatabase.set(subsidyId, subsidy);
    return subsidy;
  }

  /**
   * Get subsidies from database
   */
  getSubsidies(filters = {}) {
    let subsidies = Array.from(this.subsidyDatabase.values());

    if (filters.category) {
      subsidies = subsidies.filter(s => s.category === filters.category);
    }

    if (filters.state) {
      subsidies = subsidies.filter(s => s.state === filters.state);
    }

    if (filters.ministry) {
      subsidies = subsidies.filter(s => s.ministry === filters.ministry);
    }

    if (filters.verified) {
      subsidies = subsidies.filter(s => s.verified === true);
    }

    return subsidies;
  }

  /**
   * Get a specific subsidy
   */
  getSubsidy(subsidyId) {
    return this.subsidyDatabase.get(subsidyId);
  }

  /**
   * Update subsidy information
   */
  updateSubsidy(subsidyId, updates) {
    const subsidy = this.subsidyDatabase.get(subsidyId);
    if (!subsidy) {
      throw new Error(`Subsidy ${subsidyId} not found`);
    }

    const updatedSubsidy = {
      ...subsidy,
      ...updates,
      last_updated: new Date().toISOString()
    };

    this.subsidyDatabase.set(subsidyId, updatedSubsidy);
    return updatedSubsidy;
  }

  /**
   * Delete subsidy
   */
  deleteSubsidy(subsidyId) {
    const subsidy = this.subsidyDatabase.get(subsidyId);
    if (!subsidy) {
      throw new Error(`Subsidy ${subsidyId} not found`);
    }

    this.subsidyDatabase.delete(subsidyId);
    return { success: true, message: `Subsidy ${subsidyId} deleted` };
  }

  /**
   * Match user profile against subsidies
   */
  matchSubsidies(userProfile) {
    const subsidies = Array.from(this.subsidyDatabase.values());
    const matches = [];

    subsidies.forEach(subsidy => {
      const eligibility = subsidy.eligibility || {};
      const matchResult = {
        subsidyId: subsidy.id,
        subsidyName: subsidy.name,
        score: 0,
        matchedCriteria: [],
        unmatchedCriteria: [],
        cannotVerify: []
      };

      // Check age eligibility
      if (eligibility.age_min !== undefined && userProfile.age !== undefined) {
        if (userProfile.age >= eligibility.age_min) {
          matchResult.matchedCriteria.push('age');
          matchResult.score += 20;
        } else {
          matchResult.unmatchedCriteria.push('age');
        }
      } else if (eligibility.age_min !== undefined) {
        matchResult.cannotVerify.push('age');
      }

      // Check gender eligibility
      if (eligibility.gender && eligibility.gender !== 'all' && userProfile.gender) {
        if (eligibility.gender === userProfile.gender) {
          matchResult.matchedCriteria.push('gender');
          matchResult.score += 15;
        } else {
          matchResult.unmatchedCriteria.push('gender');
        }
      } else if (eligibility.gender && eligibility.gender !== 'all') {
        matchResult.cannotVerify.push('gender');
      }

      // Check income eligibility
      if (eligibility.income_max !== undefined && userProfile.income !== undefined) {
        if (userProfile.income <= eligibility.income_max) {
          matchResult.matchedCriteria.push('income');
          matchResult.score += 25;
        } else {
          matchResult.unmatchedCriteria.push('income');
        }
      } else if (eligibility.income_max !== undefined) {
        matchResult.cannotVerify.push('income');
      }

      // Check residence eligibility
      if (eligibility.residence && userProfile.residence) {
        if (eligibility.residence === 'both' || eligibility.residence === userProfile.residence) {
          matchResult.matchedCriteria.push('residence');
          matchResult.score += 15;
        } else {
          matchResult.unmatchedCriteria.push('residence');
        }
      } else if (eligibility.residence) {
        matchResult.cannotVerify.push('residence');
      }

      // Check state eligibility
      if (eligibility.state && userProfile.state) {
        if (eligibility.state.includes('All') || eligibility.state.includes(userProfile.state)) {
          matchResult.matchedCriteria.push('state');
          matchResult.score += 15;
        } else {
          matchResult.unmatchedCriteria.push('state');
        }
      } else if (eligibility.state) {
        matchResult.cannotVerify.push('state');
      }

      // Check disability eligibility
      if (eligibility.disability !== undefined && userProfile.disability !== undefined) {
        if (eligibility.disability === userProfile.disability) {
          matchResult.matchedCriteria.push('disability');
          matchResult.score += 10;
        } else {
          matchResult.unmatchedCriteria.push('disability');
        }
      } else if (eligibility.disability !== undefined) {
        matchResult.cannotVerify.push('disability');
      }

      // Check BPL eligibility
      if (eligibility.bpl !== undefined && userProfile.bpl !== undefined) {
        if (eligibility.bpl === userProfile.bpl) {
          matchResult.matchedCriteria.push('bpl');
          matchResult.score += 10;
        } else {
          matchResult.unmatchedCriteria.push('bpl');
        }
      } else if (eligibility.bpl !== undefined) {
        matchResult.cannotVerify.push('bpl');
      }

      // Only include matches with score > 0
      if (matchResult.score > 0) {
        matches.push(matchResult);
      }
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Add eligibility rule
   */
  addEligibilityRule(ruleConfig) {
    const ruleId = ruleConfig.field || `rule-${Date.now()}`;
    
    const rule = {
      id: ruleId,
      field: ruleConfig.field,
      type: ruleConfig.type || 'string',
      values: ruleConfig.values || [],
      min: ruleConfig.min,
      max: ruleConfig.max,
      required: ruleConfig.required || false,
      createdAt: new Date().toISOString()
    };

    this.eligibilityRules.set(ruleId, rule);
    return rule;
  }

  /**
   * Get all eligibility rules
   */
  getEligibilityRules() {
    return Array.from(this.eligibilityRules.values());
  }

  /**
   * Update eligibility rule
   */
  updateEligibilityRule(ruleId, updates) {
    const rule = this.eligibilityRules.get(ruleId);
    if (!rule) {
      throw new Error(`Eligibility rule ${ruleId} not found`);
    }

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.eligibilityRules.set(ruleId, updatedRule);
    return updatedRule;
  }

  /**
   * Delete eligibility rule
   */
  deleteEligibilityRule(ruleId) {
    const rule = this.eligibilityRules.get(ruleId);
    if (!rule) {
      throw new Error(`Eligibility rule ${ruleId} not found`);
    }

    this.eligibilityRules.delete(ruleId);
    return { success: true, message: `Eligibility rule ${ruleId} deleted` };
  }

  /**
   * Record compliance information
   */
  recordCompliance(complianceData) {
    const recordId = complianceData.id || `compliance-${Date.now()}`;
    
    const record = {
      id: recordId,
      sourceId: complianceData.sourceId,
      legalBasis: complianceData.legalBasis || 'legitimate_interest',
      dataMinimization: complianceData.dataMinimization || true,
      purposeLimitation: complianceData.purposeLimitation || true,
      transparencyMeasures: complianceData.transparencyMeasures || [],
      technicalSafeguards: complianceData.technicalSafeguards || [],
      dataSubjectRights: complianceData.dataSubjectRights || [],
      retentionPeriod: complianceData.retentionPeriod,
      createdAt: new Date().toISOString()
    };

    this.complianceRecords.set(recordId, record);
    return record;
  }

  /**
   * Get compliance records
   */
  getComplianceRecords(filters = {}) {
    let records = Array.from(this.complianceRecords.values());

    if (filters.sourceId) {
      records = records.filter(r => r.sourceId === filters.sourceId);
    }

    if (filters.legalBasis) {
      records = records.filter(r => r.legalBasis === filters.legalBasis);
    }

    return records;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dataSources: {
        total: this.dataSources.size,
        active: Array.from(this.dataSources.values()).filter(s => s.status === 'active').length
      },
      extractionJobs: {
        total: this.extractionJobs.size,
        running: Array.from(this.extractionJobs.values()).filter(j => j.status === 'running').length,
        pending: Array.from(this.extractionJobs.values()).filter(j => j.status === 'pending').length
      },
      subsidyDatabase: {
        total: this.subsidyDatabase.size
      },
      eligibilityRules: {
        total: this.eligibilityRules.size
      },
      complianceRecords: {
        total: this.complianceRecords.size
      }
    };
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const jobs = Array.from(this.extractionJobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    
    return {
      totalDataSources: this.dataSources.size,
      totalExtractionJobs: jobs.length,
      completedExtractionJobs: completedJobs.length,
      totalRecordsExtracted: completedJobs.reduce((sum, j) => sum + j.recordsExtracted, 0),
      totalSubsidies: this.subsidyDatabase.size,
      totalEligibilityRules: this.eligibilityRules.size,
      totalComplianceRecords: this.complianceRecords.size,
      averageExtractionTime: completedJobs.length > 0 
        ? completedJobs.reduce((sum, j) => {
            const time = new Date(j.completedAt) - new Date(j.startedAt);
            return sum + time;
          }, 0) / completedJobs.length
        : 0
    };
  }
}

// Export singleton instance
const publicDomainDataExtractionService = new PublicDomainDataExtractionService();

module.exports = publicDomainDataExtractionService;
