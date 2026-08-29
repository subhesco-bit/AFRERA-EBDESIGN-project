/**
 * Simple test of module loading without dependency resolution
 */
const ModuleRegistry = require('./src/core/moduleRegistry');

async function testModuleLoading() {
  try {
    console.log('Starting simple module loading test...');
    
    const registry = new ModuleRegistry();
    await registry.initialize();
    
    console.log('\n=== Testing direct module loading (no dependencies) ===');
    
    // Test a few different module types
    const testModules = [
      'M400_AI_BACKBONE',  // Production ready
      'M100_CROP_MANAGEMENT',  // WIRED/skeleton
      'M722100_FARMER',  // WIRED/skeleton
      'BE_M026',  // Backend module
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const moduleId of testModules) {
      console.log(`\n--- Testing module: ${moduleId} ---`);
      try {
        // Get module info first
        const moduleInfo = await registry.libraryService.getModule(moduleId);
        if (!moduleInfo.success) {
          console.log(`✗ Module not found: ${moduleId}`);
          failCount++;
          continue;
        }
        
        console.log(`Module found: ${moduleInfo.module.name}`);
        console.log(`Status: ${moduleInfo.module.status}`);
        console.log(`Path: ${moduleInfo.module.path}`);
        
        // Try to load without dependency resolution
        const modulePath = moduleInfo.module.path;
        const fs = require('fs');
        const path = require('path');
        
        // Check for service file
        const manifestServicePath = path.join(modulePath, 'backend', 'service.js');
        const flatServicePath = path.join(modulePath, 'service.js');
        const backendServicePath = fs.existsSync(manifestServicePath)
          ? manifestServicePath
          : (fs.existsSync(flatServicePath) ? flatServicePath : null);
        
        if (!backendServicePath) {
          console.log(`✗ No service file found for ${moduleId}`);
          failCount++;
          continue;
        }
        
        console.log(`Service file: ${backendServicePath}`);
        
        // Try to require the module
        try {
          const required = require(backendServicePath);
          console.log(`✓ Successfully required module: ${moduleId}`);
          console.log(`  Export type: ${typeof required}`);
          
          if (typeof required === 'function') {
            console.log(`  Class export detected`);
          } else if (required && typeof required === 'object') {
            const keys = Object.keys(required);
            console.log(`  Object export with ${keys.length} keys`);
            if (keys.length <= 10) {
              console.log(`  Keys: ${keys.join(', ')}`);
            }
          }
          
          successCount++;
        } catch (requireError) {
          console.log(`✗ Failed to require ${moduleId}: ${requireError.message}`);
          failCount++;
        }
        
      } catch (error) {
        console.log(`✗ Exception testing ${moduleId}: ${error.message}`);
        failCount++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total tested: ${testModules.length}`);
    console.log(`Successfully loaded: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    
    // Get overall statistics
    const stats = registry.getStatistics();
    console.log('\n=== Registry Statistics ===');
    console.log(`Total registered modules: ${stats.library.registeredModules}`);
    console.log(`Production ready: ${stats.library.productionReady}`);
    
    console.log('\nTest completed');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testModuleLoading();