/**
 * Test module loading capabilities
 */
const ModuleRegistry = require('./src/core/moduleRegistry');

async function testModuleLoading() {
  try {
    console.log('Starting module loading test...');
    
    const registry = new ModuleRegistry();
    await registry.initialize();
    
    console.log('\n=== Testing module loading for different module types ===');
    
    // Test production ready modules
    const prodModules = ['M001_PLATFORM_CORE', 'M002_USER_MANAGEMENT', 'M400_AI_BACKBONE'];
    
    // Test WIRED modules (skeleton)
    const wiredModules = ['M100_CROP_MANAGEMENT', 'M722100_FARMER', 'M615100_LOGISTICS'];
    
    // Test backend modules
    const backendModules = ['BE_M026', 'BE_M027'];
    
    const allTestModules = [...prodModules, ...wiredModules, ...backendModules];
    
    let successCount = 0;
    let failCount = 0;
    const failures = [];
    
    for (const moduleId of allTestModules) {
      console.log(`\n--- Loading module: ${moduleId} ---`);
      try {
        const result = await registry.load(moduleId);
        if (result.success) {
          console.log(`✓ Successfully loaded: ${moduleId}`);
          successCount++;
          
          // Try to get available operations
          const moduleData = registry.loadedModules.get(moduleId);
          if (moduleData && moduleData.instance) {
            console.log(`  Module instance type: ${typeof moduleData.instance}`);
            if (typeof moduleData.instance.execute === 'function') {
              console.log(`  Has execute() method: Yes`);
            }
          }
        } else {
          console.log(`✗ Failed to load: ${moduleId} - ${result.error}`);
          failCount++;
          failures.push({ moduleId, error: result.error });
        }
      } catch (error) {
        console.log(`✗ Exception loading ${moduleId}: ${error.message}`);
        failCount++;
        failures.push({ moduleId, error: error.message });
      }
    }
    
    console.log('\n=== Loading Summary ===');
    console.log(`Total tested: ${allTestModules.length}`);
    console.log(`Successfully loaded: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    if (failures.length > 0) {
      console.log('\n=== Failures ===');
      failures.forEach(f => console.log(`  - ${f.moduleId}: ${f.error}`));
    }
    
    // Get overall statistics
    const stats = registry.getStatistics();
    console.log('\n=== Registry Statistics ===');
    console.log(`Loaded modules in memory: ${stats.loadedModules}`);
    
    // Try to estimate total loadable modules by sampling
    console.log('\n=== Sampling all registered modules for loadability ===');
    const allModuleIds = Array.from(registry.libraryService.moduleRegistry.keys());
    console.log(`Total registered modules: ${allModuleIds.length}`);
    
    // Sample a subset to estimate loadability
    const sampleSize = Math.min(50, allModuleIds.length);
    const sampleModules = allModuleIds.slice(0, sampleSize);
    
    let sampleSuccess = 0;
    for (const moduleId of sampleModules) {
      try {
        const result = await registry.load(moduleId);
        if (result.success) {
          sampleSuccess++;
        }
      } catch (error) {
        // Failed to load
      }
    }
    
    const estimatedLoadable = Math.round((sampleSuccess / sampleSize) * allModuleIds.length);
    console.log(`Sample results: ${sampleSuccess}/${sampleSize} loadable`);
    console.log(`Estimated total loadable: ~${estimatedLoadable} modules`);
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testModuleLoading();