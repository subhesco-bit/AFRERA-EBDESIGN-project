/**
 * M400 AI Backbone Service Tests
 */

const aiBackbone = require('./service');

describe('M400 AI Backbone Service', () => {
  let service;

  beforeAll(async () => {
    service = aiBackbone.getInstance();
    // Mock database if needed for tests
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await aiBackbone.initialize({
        environment: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.moduleId).toBe('M400_AI_BACKBONE');
      expect(result.components).toHaveProperty('decisionEngine');
      expect(result.components).toHaveProperty('strategyEngine');
      expect(result.components).toHaveProperty('learningEngine');
      expect(result.components).toHaveProperty('predictionEngine');
      expect(result.components).toHaveProperty('coordinationEngine');
    });
  });

  describe('Decision Engine', () => {
    test('should make a decision', async () => {
      const decision = await aiBackbone.makeDecision(
        {
          confidence: 0.85,
          businessContext: 'crop_selection',
        },
        {
          moduleId: 'M100_CROP_MANAGEMENT',
          capability: 'crop_recommendation',
          data: {
            soil: 'loamy',
            climate: 'tropical',
            season: 'monsoon',
          },
          provider: 'claude',
        }
      );

      expect(decision.success).toBe(true);
      expect(decision).toHaveProperty('decisionId');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('confidence');
      expect(decision.moduleId).toBe('M100_CROP_MANAGEMENT');
    });

    test('should validate required parameters', async () => {
      expect(() => {
        aiBackbone.makeDecision({}, {});
      }).toThrow();
    });

    test('should cache decisions', async () => {
      const decision1 = await aiBackbone.makeDecision({}, {
        moduleId: 'M100',
        capability: 'test',
        data: { test: true },
      });

      const decision2 = await aiBackbone.makeDecision({}, {
        moduleId: 'M100',
        capability: 'test',
        data: { test: true },
      });

      expect(decision1.decisionId).toBe(decision2.decisionId);
    });
  });

  describe('Strategy Engine', () => {
    test('should generate a strategy', async () => {
      const strategy = await aiBackbone.generateStrategy(
        [
          'Maximize crop yield',
          'Minimize water usage',
          'Reduce pest incidence',
        ],
        {
          currentWeather: 'dry',
          soilMoisture: 0.4,
          pestLevel: 'moderate',
          resources: 'limited',
        },
        {
          moduleId: 'M100_CROP_MANAGEMENT',
          provider: 'claude',
        }
      );

      expect(strategy.success).toBe(true);
      expect(strategy).toHaveProperty('strategyId');
      expect(strategy).toHaveProperty('objectives');
      expect(strategy).toHaveProperty('strategy');
    });

    test('should create execution plan from strategy', async () => {
      const strategy = {
        id: 'STR_test',
        phases: ['assessment', 'planning', 'execution'],
        timeline: ['week1', 'week2', 'week3'],
        resources: ['water', 'fertilizer', 'labor'],
        checkpoints: ['phase_end', 'mid_review', 'final_review'],
      };

      const plan = aiBackbone.strategyEngine().createExecutionPlan(strategy);

      expect(plan.strategyId).toBe('STR_test');
      expect(plan.phases.length).toBe(3);
      expect(plan.status).toBeUndefined(); // Should be set during tracking
    });
  });

  describe('Prediction Engine', () => {
    test('should make a prediction', async () => {
      const prediction = await aiBackbone.makePrediction(
        {
          historicalYield: 500,
          avgTemperature: 28,
          rainfall: 800,
          soilQuality: 'good',
        },
        'crop_yield_model',
        {
          moduleId: 'M100_CROP_MANAGEMENT',
          provider: 'claude',
        }
      );

      expect(prediction.success).toBe(true);
      expect(prediction).toHaveProperty('predictionId');
      expect(prediction).toHaveProperty('prediction');
      expect(prediction).toHaveProperty('confidence');
    });

    test('should register and retrieve prediction model', () => {
      const engine = aiBackbone.predictionEngine();
      const model = {
        name: 'crop_yield_v1',
        algorithm: 'neural_network',
        version: '1.0.0',
      };

      engine.registerModel('crop_yield_model', model);
      const retrieved = engine.models.get('crop_yield_model');

      expect(retrieved).toEqual(model);
    });
  });

  describe('Learning Engine', () => {
    test('should record feedback on decisions', async () => {
      const result = await aiBackbone.learnFromData({
        decisionId: 'DEC_test123',
        outcome: {
          selected_crop: 'rice',
          yield: 520,
          water_saved: 15,
        },
        feedback: 'Decision was effective',
        accuracy: 0.92,
      });

      expect(result.success).toBe(true);
      expect(result.decisionId).toBe('DEC_test123');
    });

    test('should maintain feedback history', () => {
      const engine = aiBackbone.learningEngine();
      const feedback1 = {
        score: 0.9,
        comment: 'Excellent recommendation',
      };

      engine.recordFeedback('DEC_test1', feedback1);
      const recorded = engine.feedback.get('DEC_test1');

      expect(recorded).toHaveProperty('score');
      expect(recorded).toHaveProperty('timestamp');
    });
  });

  describe('Coordination Engine', () => {
    test('should coordinate multi-agent request', async () => {
      const execution = await aiBackbone.coordinateRequest({
        moduleId: 'M100_CROP_MANAGEMENT',
        capability: 'pest_management',
        input: {
          pestType: 'aphids',
          severity: 'high',
          cropType: 'rice',
        },
        timeout: 30000,
      });

      expect(execution.success).toBe(true);
      expect(execution).toHaveProperty('executionId');
      expect(execution).toHaveProperty('agentId');
      expect(execution).toHaveProperty('result');
      expect(execution).toHaveProperty('duration');
    });

    test('should register and retrieve agents', () => {
      const engine = aiBackbone.coordinationEngine();

      engine.registerAgent('agent_pest_1', ['pest_identification', 'treatment_recommendation']);
      engine.registerAgent('agent_crop_1', ['crop_analysis', 'yield_prediction']);

      const pestAgents = engine.getAvailableAgents('pest_identification');
      expect(pestAgents.length).toBeGreaterThan(0);
    });
  });

  describe('Metrics and Health', () => {
    test('should return metrics', () => {
      const metrics = aiBackbone.getMetrics();

      expect(metrics).toHaveProperty('decisionsCount');
      expect(metrics).toHaveProperty('strategiesCount');
      expect(metrics).toHaveProperty('predictionsCount');
      expect(metrics).toHaveProperty('coordinationEvents');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics).toHaveProperty('timestamp');
    });

    test('should perform health check', async () => {
      const health = await aiBackbone.healthCheck();

      expect(health).toHaveProperty('moduleId');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(['healthy', 'degraded', 'failed']).toContain(health.status);
    });

    test('should return engine status', () => {
      const service = aiBackbone.getInstance();
      expect(service.decisionEngine).toBeTruthy();
      expect(service.strategyEngine).toBeTruthy();
      expect(service.learningEngine).toBeTruthy();
      expect(service.predictionEngine).toBeTruthy();
      expect(service.coordinationEngine).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', async () => {
      try {
        await aiBackbone.makeDecision(
          {},
          { moduleId: 'M100' } // Missing capability and data
        );
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle AI provider failures gracefully', async () => {
      // Test fallback mechanism
      const decision = await aiBackbone.makeDecision(
        { confidence: 0.75 },
        {
          moduleId: 'M100',
          capability: 'test',
          data: { test: true },
          provider: 'fallback_provider',
        }
      );

      // Should still succeed with different provider
      expect(decision).toHaveProperty('decisionId');
    });
  });

  describe('Module Integration', () => {
    test('should register module in registry', async () => {
      const service = aiBackbone.getInstance();
      const moduleData = {
        moduleId: 'M100_CROP_MANAGEMENT',
        capabilities: ['crop_recommendation', 'yield_prediction', 'pest_management'],
        status: 'active',
      };

      service.moduleRegistry.set(moduleData.moduleId, moduleData);
      const registered = service.moduleRegistry.get(moduleData.moduleId);

      expect(registered.moduleId).toBe('M100_CROP_MANAGEMENT');
      expect(registered.capabilities.length).toBe(3);
    });

    test('should establish cable connections', async () => {
      const service = aiBackbone.getInstance();
      const cable = {
        sourceModule: 'M100_CROP_MANAGEMENT',
        targetModule: 'M400_AI_BACKBONE',
        connectionType: 'ai_decision_request',
        metadata: {
          priority: 'high',
          failover: true,
        },
      };

      service.cableConnections.set('M100:M400', cable);
      const retrieved = service.cableConnections.get('M100:M400');

      expect(retrieved.targetModule).toBe('M400_AI_BACKBONE');
    });
  });

  afterAll(async () => {
    // Cleanup
    if (service) {
      await aiBackbone.shutdown();
    }
  });
});
