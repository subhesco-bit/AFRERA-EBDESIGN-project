const fs = require('fs');
const path = require('path');
const { buildAgentTemplateRegistry } = require('../core/ai/agentTemplateCatalog');
const { buildAgentToolRegistry } = require('../core/ai/agentToolRegistry');
const { AgentRuntimeService } = require('../core/ai/agentRuntimeService');

describe('AFRERA reusable agent template system', () => {
  it('registers a broad cross-domain agent template estate', () => {
    const { agentRegistry, promptRegistry } = buildAgentTemplateRegistry();
    const templates = agentRegistry.list({ enabled: true });
    expect(templates.length).toBeGreaterThanOrEqual(25);
    expect(promptRegistry.listPublic().length).toBeGreaterThanOrEqual(20);
    expect(new Set(templates.map((t) => t.stream))).toEqual(expect.objectContaining ? expect.any(Set) : new Set());
    expect(templates.some((t) => t.stream === 'finance')).toBe(true);
    expect(templates.some((t) => t.stream === 'cold-chain')).toBe(true);
    expect(templates.some((t) => t.stream === 'medical')).toBe(true);
    expect(templates.some((t) => t.stream === 'software')).toBe(true);
  });

  it('never exposes system instructions through public template metadata', () => {
    const { agentRegistry } = buildAgentTemplateRegistry();
    const row = agentRegistry.publicMetadata('DEEP_RESEARCH');
    expect(row.prompt.instructions).toBeUndefined();
    expect(row.prompt.instructionsSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(row.prompt.variables).toEqual([]);
  });

  it('has no dangling tool references', () => {
    const { agentRegistry } = buildAgentTemplateRegistry();
    const tools = buildAgentToolRegistry();
    const missing = [];
    for (const template of agentRegistry.list()) {
      for (const toolId of template.tools) if (!tools.get(toolId)) missing.push({ template: template.id, toolId });
    }
    expect(missing).toEqual([]);
  });

  it('marks every medical template as high-risk, draft-only and human-reviewed', () => {
    const { agentRegistry } = buildAgentTemplateRegistry();
    const medical = agentRegistry.list({ stream: 'medical' });
    expect(medical.length).toBeGreaterThanOrEqual(8);
    for (const template of medical) {
      expect(template.riskClass).toBe('high');
      expect(template.approvalPolicy.humanReviewRequired).toBe(true);
      expect(template.approvalPolicy.finalizationRequiresHuman).toBe(true);
      expect(template.outputUsePolicy.draftOnly).toBe(true);
      expect(template.outputUsePolicy.prohibitedUses).toEqual(expect.arrayContaining(['autonomous diagnosis','autonomous prescription']));
    }
  });

  it('truthfully refuses live execution when gateway/model configuration is absent', async () => {
    const runtime = new AgentRuntimeService({ env: {}, governance: { audit: async () => ({ persisted: false }) } });
    const plan = runtime.publicPlan('DEEP_RESEARCH', { question: 'test' });
    expect(plan.runtime.executable).toBe(false);
    expect(plan.selectedModel).toBeNull();
    await expect(runtime.execute('DEEP_RESEARCH', { question: 'test' })).rejects.toMatchObject({ code: 'AI_AGENT_RUNTIME_NOT_CONFIGURED' });
  });

  it('compiles and executes a bounded ToolLoopAgent when a gateway runtime is configured', async () => {
    let lastConfig = null;
    class FakeToolLoopAgent {
      constructor(config) { lastConfig = config; }
      async generate({ prompt }) {
        return { text: 'mock result: ' + prompt.slice(0, 12), finishReason: 'stop', totalUsage: { inputTokens: 10, outputTokens: 4 }, steps: [{ text: 'done' }], warnings: [] };
      }
    }
    const fakeSdk = {
      ToolLoopAgent: FakeToolLoopAgent,
      tool: (definition) => definition,
      stepCountIs: (n) => ({ type: 'step-count', n }),
    };
    const runtime = new AgentRuntimeService({
      env: { AI_GATEWAY_API_KEY: 'configured', AI_AGENT_DEFAULT_MODEL: 'provider/model' },
      sdkLoader: async () => fakeSdk,
      governance: { audit: async (entry) => ({ persisted: false, action: entry.action, id: 'audit-1' }) },
    });
    const result = await runtime.execute('DEEP_RESEARCH', { question: 'research the project' }, { userId: 'u1' });
    expect(result.success).toBe(true);
    expect(result.model).toBe('provider/model');
    expect(result.steps).toBe(1);
    expect(lastConfig.model).toBe('provider/model');
    expect(lastConfig.stopWhen).toEqual({ type: 'step-count', n: 12 });
    expect(lastConfig.tools.knowledge_search).toBeDefined();
  });

  it('keeps medical runtime output assistive even when execution succeeds', async () => {
    class FakeToolLoopAgent { async generate() { return { text: 'draft coding review', finishReason: 'stop', steps: [], totalUsage: {} }; } }
    const runtime = new AgentRuntimeService({
      env: { AI_GATEWAY_API_KEY: 'configured', AI_AGENT_DEFAULT_MODEL: 'provider/model' },
      sdkLoader: async () => ({ ToolLoopAgent: FakeToolLoopAgent, tool: (d) => d, stepCountIs: (n) => n }),
      governance: { audit: async () => ({ persisted: false }) },
    });
    const result = await runtime.execute('MEDICAL_CODING_ASSISTANT', { documentation: 'example only' }, { userId: 'u1' });
    expect(result.reviewRequired).toBe(true);
    expect(result.outputUsePolicy.draftOnly).toBe(true);
    expect(result.outputUsePolicy.decisionAuthority).toBe('qualified_clinician_or_medical_coder');
  });

  it('replaces the old aiAgentRoutes stub and fail-open auth pattern', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../routes/aiAgentRoutes.js'), 'utf8');
    expect(source).not.toMatch(/Route operational/);
    expect(source).not.toMatch(/Auth optional/);
    expect(source).toContain('router.use(authMiddleware)');
    expect(source).toContain("router.post('/execute'");
  });

  it('uses the installed AI SDK major version expected by the runtime adapter', () => {
    const pkg = require('ai/package.json');
    expect(Number(pkg.version.split('.')[0])).toBe(7);
  });
});
