/**
 * Direct test of module discovery without auth middleware
 */
const ModuleRegistry = require('./src/core/moduleRegistry');

async function testModuleDiscovery() {
  try {
    console.log('Starting module discovery test...');
    
    const registry = new ModuleRegistry();
    await registry.initialize();
    
    console.log('Testing module discovery...');
    const result = await registry.discover('test');
    
    console.log('Discovery result:', JSON.stringify(result, null, 2));
    
    const stats = registry.getStatistics();
    console.log('Registry statistics:', JSON.stringify(stats, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testModuleDiscovery();