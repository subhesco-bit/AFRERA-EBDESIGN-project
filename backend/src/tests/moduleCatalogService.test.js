const { buildPlatformOverview, buildAssistantResponse } = require('../services/moduleCatalogService');

describe('moduleCatalogService', () => {
  it('builds a platform overview with module coverage', () => {
    const overview = buildPlatformOverview();

    expect(overview.totalModules).toBeGreaterThan(10);
    expect(overview.readyModules).toBeGreaterThan(0);
    expect(overview.categories).toContain('Intelligence');
  });

  it('produces assistant suggestions for workflow prompts', () => {
    const assistant = buildAssistantResponse('help me design forms and workflow automation');

    expect(assistant.suggestedModules.length).toBeGreaterThan(0);
    expect(assistant.reply.toLowerCase()).toContain('forms');
  });
});
