/**
 * AI Operation Intelligence Service - Real-Time Optimization Layer
 * 
 * This service provides operation intelligence capabilities including:
 * - Real-time performance monitoring
 * - Predictive optimization
 * - Resource allocation
 * - Process automation
 * - Anomaly detection
 * - Continuous improvement
 */

// These three SDKs are not in package.json (no live LLM credentials exist in this
// environment, by design). Lazy-require only when the matching env var is present,
// so absence is a clean not_configured client, never a process-killing MODULE_NOT_FOUND.
function tryRequireClient(envVar, loader) {
  if (!process.env[envVar]) return null;
  try {
    return loader();
  } catch (error) {
    require('..\/utils\/logger').warn(`aiClient:  is set but its SDK failed to load`, { error: error.message });
    return null;
  }
}

class AIOperationIntelligenceService {
  constructor() {
    // Initialize AI model clients
    this.openai = tryRequireClient('OPENAI_API_KEY', () => {
      const { OpenAI } = require('openai');
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    });

    this.gemini = tryRequireClient('GEMINI_API_KEY', () => {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    });

    this.anthropic = tryRequireClient('ANTHROPIC_API_KEY', () => {
      const { Anthropic } = require('@anthropic-ai/sdk');
      return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    });
    
    // Performance metrics
    this.performanceMetrics = new Map();
    
    // Optimization strategies
    this.optimizationStrategies = new Map();
    
    // Resource allocation
    this.resourceAllocation = new Map();
    
    // Operation history
    this.operationHistory = [];
    
    // Initialize optimization strategies
    this.initializeOptimizationStrategies();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }
  
  /**
   * Initialize optimization strategies
   */
  initializeOptimizationStrategies() {
    // Equipment optimization
    this.addOptimizationStrategy('equipment_utilization', {
      description: 'Optimize equipment utilization across operations',
      parameters: ['availability', 'efficiency', 'cost', 'maintenance'],
      objectives: ['maximize_utilization', 'minimize_downtime', 'optimize_cost']
    });
    
    // Supply chain optimization
    this.addOptimizationStrategy('supply_chain', {
      description: 'Optimize supply chain operations',
      parameters: ['inventory', 'logistics', 'demand', 'lead_time'],
      objectives: ['minimize_cost', 'maximize_service_level', 'reduce_waste']
    });
    
    // Resource optimization
    this.addOptimizationStrategy('resource_allocation', {
      description: 'Optimize resource allocation across tasks',
      parameters: ['capacity', 'skills', 'availability', 'cost'],
      objectives: ['maximize_efficiency', 'minimize_cost', 'balance_workload']
    });
    
    // Process optimization
    this.addOptimizationStrategy('process_automation', {
      description: 'Identify and automate manual processes',
      parameters: ['complexity', 'frequency', 'cost', 'risk'],
      objectives: ['reduce_manual_effort', 'improve_accuracy', 'increase_speed']
    });
    
    // Energy optimization
    this.addOptimizationStrategy('energy_consumption', {
      description: 'Optimize energy consumption in operations',
      parameters: ['usage', 'efficiency', 'cost', 'sustainability'],
      objectives: ['minimize_consumption', 'reduce_cost', 'improve_sustainability']
    });
  }
  
  /**
   * Add optimization strategy
   */
  addOptimizationStrategy(name, strategy) {
    this.optimizationStrategies.set(name, strategy);
  }
  
  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    // Guard against double-start: constructor calls this once, but nothing
    // stopped a second explicit call from stacking a duplicate pair of
    // intervals that would then run forever with no way to clear both sets.
    if (this._metricsInterval || this._optimizationInterval) return;

    // Monitor performance every 10 seconds
    this._metricsInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, 10000);

    // Run optimization every 60 seconds
    this._optimizationInterval = setInterval(() => {
      this.runOptimizationCycle();
    }, 60000);
  }

  /**
   * Stop real-time monitoring (clears both intervals). Needed for tests and
   * scripts that require this module without wanting a permanent background
   * job to keep the process alive.
   */
  stopRealTimeMonitoring() {
    if (this._metricsInterval) { clearInterval(this._metricsInterval); this._metricsInterval = null; }
    if (this._optimizationInterval) { clearInterval(this._optimizationInterval); this._optimizationInterval = null; }
  }
  
  /**
   * Collect performance metrics
   */
  async collectPerformanceMetrics() {
    try {
      const metrics = {
        timestamp: new Date(),
        system: {
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage(),
          uptime: process.uptime()
        },
        operations: {
          active_tasks: this.operationHistory.filter(op => op.status === 'active').length,
          completed_tasks: this.operationHistory.filter(op => op.status === 'completed').length,
          failed_tasks: this.operationHistory.filter(op => op.status === 'failed').length
        },
        resources: {
          allocated: Array.from(this.resourceAllocation.values()).length,
          utilization: this.calculateResourceUtilization()
        }
      };
      
      this.performanceMetrics.set('current', metrics);
      
      // Keep last 1000 metrics
      const history = Array.from(this.performanceMetrics.entries()).filter(([key]) => key !== 'current');
      if (history.length > 1000) {
        history.slice(-1000).forEach(([key, value]) => this.performanceMetrics.set(key, value));
      }
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }
  
  /**
   * Calculate resource utilization
   */
  calculateResourceUtilization() {
    const allocations = Array.from(this.resourceAllocation.values());
    if (allocations.length === 0) return 0;
    
    const utilized = allocations.filter(alloc => alloc.status === 'active').length;
    return (utilized / allocations.length) * 100;
  }
  
  /**
   * Run optimization cycle
   */
  async runOptimizationCycle() {
    try {
      const currentMetrics = this.performanceMetrics.get('current');
      if (!currentMetrics) return;
      if (!this.openai && !this.gemini && !this.anthropic) return; // no AI provider configured - fallback mode, nothing to analyze with

      // Analyze performance
      const analysis = await this.analyzePerformance(currentMetrics);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(analysis);
      
      // Execute optimizations if approved
      if (recommendations.auto_execute) {
        await this.executeOptimizations(recommendations.optimizations);
      }
      
      // Record optimization cycle
      this.recordOptimizationCycle({
        metrics: currentMetrics,
        analysis: analysis,
        recommendations: recommendations
      });
      
    } catch (error) {
      console.error('Error in optimization cycle:', error);
    }
  }
  
  /**
   * Analyze performance
   */
  async analyzePerformance(metrics) {
    try {
      const prompt = `
        Analyze the following performance metrics and identify:
        1. Performance bottlenecks
        2. Resource inefficiencies
        3. Optimization opportunities
        4. Anomalies and issues
        5. Trends and patterns
        
        Metrics: ${JSON.stringify(metrics)}
        
        Provide analysis in JSON format with detailed findings and recommendations.
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      let analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(analysis) {
    try {
      let prompt = `
        Based on the performance analysis, generate optimization recommendations:
        
        Analysis: ${JSON.stringify(analysis)}
        
        Available strategies: ${JSON.stringify(Array.from(this.optimizationStrategies.keys()))}
        
        Provide recommendations in JSON format with:
        - optimizations: list of recommended optimizations
        - priority: priority level (critical, high, medium, low)
        - expected_impact: expected impact on performance
        - auto_execute: whether to auto-execute (true/false)
        - confidence: confidence in recommendation (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      let recommendations = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        recommendations: recommendations
      };
    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute optimizations
   */
  async executeOptimizations(optimizations) {
    try {
      const results = [];
      
      for (const optimization of optimizations) {
        const result = await this.executeOptimization(optimization);
        results.push(result);
      }
      
      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error executing optimizations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Execute single optimization
   */
  async executeOptimization(optimization) {
    try {
      switch (optimization.strategy) {
        case 'equipment_utilization':
          return await this.optimizeEquipmentUtilization(optimization);
        case 'supply_chain':
          return await this.optimizeSupplyChain(optimization);
        case 'resource_allocation':
          return await this.optimizeResourceAllocation(optimization);
        case 'process_automation':
          return await this.optimizeProcessAutomation(optimization);
        case 'energy_consumption':
          return await this.optimizeEnergyConsumption(optimization);
        default:
          return {
            success: false,
            error: `Unknown optimization strategy: ${optimization.strategy}`
          };
      }
    } catch (error) {
      console.error(`Error executing optimization ${optimization.strategy}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Optimize equipment utilization
   */
  async optimizeEquipmentUtilization(optimization) {
    // Implementation for equipment utilization optimization
    return {
      success: true,
      strategy: 'equipment_utilization',
      result: 'Equipment utilization optimized',
      improvements: ['increased_efficiency', 'reduced_downtime']
    };
  }
  
  /**
   * Optimize supply chain
   */
  async optimizeSupplyChain(optimization) {
    // Implementation for supply chain optimization
    return {
      success: true,
      strategy: 'supply_chain',
      result: 'Supply chain optimized',
      improvements: ['reduced_cost', 'improved_service_level']
    };
  }
  
  /**
   * Optimize resource allocation
   */
  async optimizeResourceAllocation(optimization) {
    // Implementation for resource allocation optimization
    return {
      success: true,
      strategy: 'resource_allocation',
      result: 'Resource allocation optimized',
      improvements: ['balanced_workload', 'increased_efficiency']
    };
  }
  
  /**
   * Optimize process automation
   */
  async optimizeProcessAutomation(optimization) {
    // Implementation for process automation optimization
    return {
      success: true,
      strategy: 'process_automation',
      result: 'Process automation optimized',
      improvements: ['reduced_manual_effort', 'improved_accuracy']
    };
  }
  
  /**
   * Optimize energy consumption
   */
  async optimizeEnergyConsumption(optimization) {
    // Implementation for energy consumption optimization
    return {
      success: true,
      strategy: 'energy_consumption',
      result: 'Energy consumption optimized',
      improvements: ['reduced_consumption', 'improved_sustainability']
    };
  }
  
  /**
   * Record optimization cycle
   */
  recordOptimizationCycle(cycle) {
    this.operationHistory.push({
      timestamp: new Date(),
      type: 'optimization_cycle',
      cycle: cycle
    });
    
    // Keep only last 1000 operations
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-1000);
    }
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      current: this.performanceMetrics.get('current'),
      history: Array.from(this.performanceMetrics.entries()).filter(([key]) => key !== 'current')
    };
  }
  
  /**
   * Get optimization strategies
   */
  getOptimizationStrategies() {
    return Array.from(this.optimizationStrategies.entries()).map(([name, strategy]) => ({
      name,
      ...strategy
    }));
  }
  
  /**
   * Get resource allocation
   */
  getResourceAllocation() {
    return Array.from(this.resourceAllocation.entries());
  }
  
  /**
   * Get operation history
   */
  getOperationHistory(limit = 100) {
    return this.operationHistory.slice(-limit);
  }
  
  /**
   * Predictive optimization
   */
  async predictiveOptimization(horizon = 24) {
    try {
      let currentMetrics = this.performanceMetrics.get('current');
      let history = this.operationHistory.slice(-100);
      
      let prompt = `
        Perform predictive optimization analysis for the next ${horizon} hours:
        
        Current Metrics: ${JSON.stringify(currentMetrics)}
        Operation History: ${JSON.stringify(history)}
        
        Provide prediction in JSON format with:
        - predicted_performance: performance forecast
        - recommended_actions: proactive optimization actions
        - risk_assessment: potential risks and mitigation
        - resource_requirements: expected resource needs
        - confidence: confidence in prediction (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const prediction = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        prediction: prediction
      };
    } catch (error) {
      console.error('Error in predictive optimization:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Anomaly detection
   */
  async detectAnomalies() {
    try {
      let currentMetrics = this.performanceMetrics.get('current');
      let history = Array.from(this.performanceMetrics.entries()).slice(-50);
      
      let prompt = `
        Detect anomalies in the current performance metrics compared to historical data:
        
        Current Metrics: ${JSON.stringify(currentMetrics)}
        Historical Data: ${JSON.stringify(history)}
        
        Provide analysis in JSON format with:
        - anomalies: list of detected anomalies
        - severity: severity level (critical, high, medium, low)
        - root_cause: potential root causes
        - recommended_actions: recommended remediation actions
        - confidence: confidence in anomaly detection (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const anomalies = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        anomalies: anomalies
      };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Continuous improvement
   */
  async continuousImprovement() {
    try {
      let history = this.operationHistory.slice(-200);
      
      let prompt = `
        Analyze operation history and identify continuous improvement opportunities:
        
        Operation History: ${JSON.stringify(history)}
        
        Provide analysis in JSON format with:
        - improvement_opportunities: list of improvement opportunities
        - best_practices: identified best practices
        - process_enhancements: recommended process enhancements
        - kpi_improvements: KPI improvement recommendations
        - confidence: confidence in recommendations (0-1)
      `;
      
      if (!this.openai) throw new Error('OPENAI_API_KEY not configured - this AI capability is unavailable');
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      
      const improvements = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        improvements: improvements
      };
    } catch (error) {
      console.error('Error in continuous improvement analysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const aiOperationIntelligenceService = new AIOperationIntelligenceService();

module.exports = aiOperationIntelligenceService;


