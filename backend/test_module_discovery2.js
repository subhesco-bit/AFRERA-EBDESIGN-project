/**
 * Test module discovery with relevant queries
 */
const ModuleRegistry = require('./src/core/moduleRegistry');

async function testModuleDiscovery() {
  try {
    console.log('Starting module discovery test...');
    
    const registry = new ModuleRegistry();
    await registry.initialize();
    
    console.log('\n=== Testing module discovery with different queries ===');
    
    const queries = ['user', 'farmer', 'crop', 'market', 'finance', 'logistics', 'AI', 'management'];
    
    for (const query of queries) {
      console.log(`\n--- Query: "${query}" ---`);
      const result = await registry.discover(query);
      console.log(`Found ${result.modules.length} modules`);
      if (result.modules.length > 0) {
        result.modules.slice(0, 3).forEach((mod, i) => {
          console.log(`  ${i+1}. ${mod.moduleId} - ${mod.name} (score: ${mod.matchScore.toFixed(2)}, status: ${mod.status})`);
        });
      }
    }
    
    const stats = registry.getStatistics();
    console.log('\n=== Registry statistics ===');
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n=== Production ready modules ===');
    const prodReady = Array.from(registry.libraryService.moduleRegistry.values())
      .filter(m => m.isProductionReady);
    console.log(`Found ${prodReady.length} production ready modules:`);
    prodReady.forEach(m => {
      console.log(`  - ${m.moduleId}: ${m.name} (${m.status})`);
    });
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testModuleDiscovery();