jest.mock('../services/aiGatewayService', () => ({ run: jest.fn() }));

const aiGateway = require('../services/aiGatewayService');
const adapters = require('../services/aiDomainAdapterService');

describe('governed domain AI adapters', () => {
  beforeEach(() => jest.clearAllMocks());

  test('routes ERP, logistics, storage, and assistant domains through one contract', async () => {
    aiGateway.run.mockResolvedValue({ success: true, status: 'generated', safety: { externalActionsTaken: false } });
    await adapters.explain('gst', 'invoice-review', { totalGST: 125 });
    await adapters.explain('coldStorage', 'booking-review', { remaining: 50 });
    await adapters.explain('chef', 'recipe-review', { ingredients: ['rice'] });
    await adapters.explain('multilingual', 'farmer-message', { language: 'as' });
    expect(aiGateway.run).toHaveBeenCalledTimes(4);
    expect(aiGateway.run.mock.calls[0][0]).toMatchObject({ moduleId: 'gst', capability: 'gst-compliance-review' });
    expect(aiGateway.run.mock.calls[1][0].context.adapter).toBe('coldStorage');
    expect(aiGateway.run.mock.calls[2][0].capability).toBe('master-chef-recipe-review');
  });

  test('rejects unknown adapters', async () => {
    await expect(adapters.explain('unknown', 'review', {})).rejects.toMatchObject({ code: 'UNKNOWN_AI_ADAPTER' });
  });
});
