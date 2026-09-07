jest.mock('../services/legacy/aiBackboneService', () => ({
  callAI: jest.fn(),
}));

jest.mock('../services/libraryKnowledgeService', () => ({
  buildAIContext: jest.fn(),
}));

const aiBackbone = require('../services/legacy/aiBackboneService');
const libraryKnowledge = require('../services/libraryKnowledgeService');
const aiGateway = require('../services/aiGatewayService');

describe('governed AI gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    libraryKnowledge.buildAIContext.mockResolvedValue({
      matches: [{ key: 'M030', path: 'modules/M030/README.md', type: 'library-file', relevance: 1, data: { name: 'Farmer Advisory' } }],
      guardrails: { sourceAuthority: 'library', noFileMutation: true },
    });
  });

  test('grounds provider prompts and returns provenance without fabricated confidence', async () => {
    aiBackbone.callAI.mockResolvedValue({ content: 'Use the verified advisory workflow.', provider: 'ollama', model: 'local' });

    const result = await aiGateway.run({
      moduleId: 'M030',
      capability: 'farmer-advisory',
      prompt: 'How should I plan my crop?',
    });

    expect(aiBackbone.callAI).toHaveBeenCalledWith(expect.stringContaining('LIBRARY_CONTEXT_JSON'), expect.any(Object));
    expect(result.success).toBe(true);
    expect(result.confidence.score).toBeNull();
    expect(result.provenance.libraryMatches[0].key).toBe('M030');
    expect(result.safety.externalActionsTaken).toBe(false);
  });

  test('returns an honest unavailable envelope without leaking provider errors', async () => {
    aiBackbone.callAI.mockRejectedValue(new Error('ANTHROPIC_API_KEY=super-secret not configured'));

    const result = await aiGateway.run({
      moduleId: 'natural-therapy',
      capability: 'wellness-chat',
      prompt: 'What is safe for me?',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('not_configured');
    expect(result.error).not.toContain('super-secret');
    expect(result.safety.humanReviewRequired).toBe(true);
  });
});
