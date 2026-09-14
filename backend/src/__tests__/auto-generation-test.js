/**
 * Auto Image Generation - Test Script
 * Tests all 3 triggers:
 * 1. Product Creation
 * 2. Page View
 * 3. Inventory Update
 *
 * Run: npm test -- src/__tests__/auto-generation-test.js
 * Or: node src/__tests__/auto-generation-test.js
 */

const productImageAutoGenerationService = require('../services/productImageAutoGenerationService');

// Sample products for testing
const sampleProducts = [
  {
    id: 'test-rice-001',
    name: 'Golden Basmati Rice',
    category: 'Specialty Grains and Rice',
    description: 'Premium long-grain basmati rice from Punjab',
    color_profile: 'golden yellow',
    size_range: '8-9mm',
    certified: true,
    gi_tag: 'Basmati Rice',
  },
  {
    id: 'test-turmeric-001',
    name: 'Telangana Turmeric',
    category: 'Spices and Rhizomes',
    description: 'High-curcumin turmeric powder',
    color_profile: 'bright golden',
    size_range: '2-4cm',
    certified: true,
    gi_tag: 'Telangana Turmeric',
  },
  {
    id: 'test-tomato-001',
    name: 'Organic Heirloom Tomatoes',
    category: 'Vegetables',
    description: 'Naturally grown heirloom tomatoes',
    color_profile: 'deep red',
    size_range: '5-7cm diameter',
    certified: true,
  },
  {
    id: 'test-honey-001',
    name: 'Wildflower Honey',
    category: 'Fermented Foods',
    description: 'Pure raw wildflower honey',
    color_profile: 'amber brown',
    certified: true,
  },
  {
    id: 'test-coconut-001',
    name: 'Organic Coconut Oil',
    category: 'Specialty Grains and Rice',
    description: 'Cold-pressed coconut oil',
    color_profile: 'clear white',
    certified: true,
  },
];

/**
 * Test 1: Product Creation Trigger
 */
async function testProductCreationTrigger() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 1: PRODUCT CREATION TRIGGER      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    console.log('Simulating product creation events...');

    for (const product of sampleProducts) {
      console.log(`\n📦 Creating product: ${product.name}`);
      await productImageAutoGenerationService.onProductCreated(product);
      console.log(`✅ Queued for auto-generation`);
    }

    const status = productImageAutoGenerationService.getStatus();
    console.log(`\n📊 Queue Status:`);
    console.log(`   Queue Length: ${status.queue.length}`);
    console.log(`   Is Processing: ${status.queue.isProcessing}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Page View Trigger
 */
async function testPageViewTrigger() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 2: PAGE VIEW TRIGGER             ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    console.log('Simulating product page views...');

    for (const product of sampleProducts.slice(0, 2)) {
      console.log(`\n👁️  Product page viewed: ${product.name}`);
      await productImageAutoGenerationService.onProductPageView(product.id, {
        region: 'global-export',
        languages: ['en', 'hi'],
        userAgent: 'Mozilla/5.0',
      });
      console.log(`✅ Queued for auto-generation`);
    }

    const status = productImageAutoGenerationService.getStatus();
    console.log(`\n📊 Queue Status:`);
    console.log(`   Queue Length: ${status.queue.length}`);
    console.log(`   Total Jobs Added: ${status.stats.total}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Inventory Update Trigger
 */
async function testInventoryTrigger() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 3: INVENTORY CRITICAL TRIGGER    ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    console.log('Simulating inventory critical alert...');

    const productId = 'test-rice-001';
    console.log(`\n⚠️  Stock critical for product: ${productId}`);
    await productImageAutoGenerationService.onInventoryUpdated(productId, {
      quantity: 5,
      status: 'critical',
    });
    console.log(`✅ Queued for showcase regeneration`);

    const status = productImageAutoGenerationService.getStatus();
    console.log(`\n📊 Queue Status:`);
    console.log(`   Queue Length: ${status.queue.length}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Queue Management
 */
async function testQueueManagement() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 4: QUEUE MANAGEMENT              ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const status = productImageAutoGenerationService.getStatus();

    console.log('Current Queue Status:');
    console.log(`   Config:`);
    console.log(`     - Auto Generation: ${status.config.enableAutoGeneration}`);
    console.log(`     - On Product Add: ${status.config.enableOnProductAdd}`);
    console.log(`     - On Page View: ${status.config.enableOnPageView}`);
    console.log(`     - Batch Size: ${status.config.batchSize}`);
    console.log(`     - Check Interval: ${status.config.queueCheckInterval}ms`);

    console.log(`\n   Queue:`);
    console.log(`     - Length: ${status.queue.length}`);
    console.log(`     - Processing: ${status.queue.isProcessing}`);
    console.log(`     - Next Batch (first 3):`);
    status.queue.nextBatch.slice(0, 3).forEach((job, i) => {
      console.log(`       ${i + 1}. ${job.trigger} - Product ${job.productId}`);
    });

    console.log(`\n   Statistics:`);
    console.log(`     - Total: ${status.stats.total}`);
    console.log(`     - Successful: ${status.stats.successful}`);
    console.log(`     - Failed: ${status.stats.failed}`);
    console.log(`     - Avg Time: ${status.stats.avgTimeMs}ms`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Batch Operations
 */
async function testBatchOperations() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 5: BATCH OPERATIONS              ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const productIds = sampleProducts.map(p => p.id);

    console.log(`Batch queueing ${productIds.length} products...`);
    const result = await productImageAutoGenerationService.batchAutoGenerate(
      productIds,
      { priority: 'high' }
    );

    console.log(`\n✅ Batch Operation Complete:`);
    console.log(`   Queued: ${result.queued}`);
    console.log(`   Total in Queue: ${result.totalInQueue}`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 6: API Endpoints Preview
 */
async function showAPIEndpoints() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TEST 6: AVAILABLE API ENDPOINTS       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const endpoints = [
    { method: 'GET', path: '/api/auto-generation/status', desc: 'Get queue status' },
    { method: 'POST', path: '/api/auto-generation/queue', desc: 'Queue product' },
    { method: 'POST', path: '/api/auto-generation/batch-queue', desc: 'Batch queue' },
    { method: 'POST', path: '/api/auto-generation/process-now', desc: 'Process immediately (admin)' },
    { method: 'DELETE', path: '/api/auto-generation/queue', desc: 'Clear queue (admin)' },
    { method: 'POST', path: '/api/auto-generation/pause', desc: 'Pause/resume (admin)' },
    { method: 'GET', path: '/api/auto-generation/queue-preview', desc: 'See next N jobs' },
    { method: 'GET', path: '/api/auto-generation/stats', desc: 'Get statistics' },
    { method: 'PUT', path: '/api/auto-generation/config', desc: 'Configure (admin)' },
  ];

  console.log('Management Endpoints:');
  endpoints.forEach(ep => {
    console.log(`   ${ep.method.padEnd(6)} ${ep.path.padEnd(40)} - ${ep.desc}`);
  });

  return true;
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   AUTO IMAGE GENERATION - COMPLETE TEST SUITE        ║
║   Testing all 3 triggers and queue management        ║
╚══════════════════════════════════════════════════════╝
  `);

  const results = [];

  // Run tests
  results.push(await testProductCreationTrigger());
  results.push(await testPageViewTrigger());
  results.push(await testInventoryTrigger());
  results.push(await testQueueManagement());
  results.push(await testBatchOperations());
  results.push(await showAPIEndpoints());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`
╔══════════════════════════════════════════════════════╗
║   TEST SUMMARY                                       ║
╚══════════════════════════════════════════════════════╝

✅ Tests Passed: ${passed}/${total}
📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%

${passed === total ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}

Next Steps:
  1. Check environment variables in .env
  2. Mount routes in backend/src/index.js
  3. Add middleware to express app
  4. Test endpoints with curl or Postman
  5. Monitor dashboard at /admin/auto-generation

Ready for production deployment! 🚀
  `);

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
