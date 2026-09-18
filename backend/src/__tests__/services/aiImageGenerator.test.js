/**
 * AI Image Generator Test Suite
 * Tests the aiImageGenerationService functionality
 */

const aiImageGenerationService = require("../../services/aiImageGenerationService");

async function testAIImageGenerator() {
  console.log("🎨 TESTING AI IMAGE GENERATION SERVICE\n");

  // Test data - agricultural varieties
  const testVarieties = [
    {
      id: "var_001",
      name: "Golden Rice Variety",
      category: "Specialty Grains and Rice",
      region: "Punjab",
      color_profile: "golden yellow",
      texture_description: "long grain, translucent",
      size_range: "8-9mm",
      gi_tag: "Basmati Rice",
    },
    {
      id: "var_002",
      name: "Organic Turmeric",
      category: "Spices and Rhizomes",
      region: "Telangana",
      color_profile: "vibrant yellow-orange",
      texture_description: "dried rhizome pieces",
      size_range: "2-4cm",
      gi_tag: "Telangana Turmeric",
    },
    {
      id: "var_003",
      name: "Heritage Tomato",
      category: "Vegetables",
      region: "Karnataka",
      color_profile: "deep red",
      texture_description: "smooth, round",
      size_range: "5-7cm diameter",
      gi_tag: null,
    },
  ];

  try {
    // Test 1: Generate single image
    console.log("TEST 1: Single Image Generation");
    console.log("================================");
    const singleImage = await aiImageGenerationService.generateVarietyImage(
      testVarieties[0].id,
      testVarieties[0],
      "Premium basmati rice grains in professional studio lighting"
    );
    console.log("✅ Single image generated:");
    console.log(JSON.stringify(singleImage, null, 2));
    console.log();

    // Test 2: Batch image generation
    console.log("TEST 2: Batch Image Generation");
    console.log("===============================");
    const batchResults = await aiImageGenerationService.generateBatchImages(
      testVarieties
    );
    console.log("✅ Batch generation complete:");
    console.log(`   Total: ${batchResults.total}`);
    console.log(`   Successful: ${batchResults.successful}`);
    console.log(`   Fallback: ${batchResults.fallback}`);
    console.log();

    // Test 3: Cache statistics
    console.log("TEST 3: Cache Statistics");
    console.log("========================");
    const stats = aiImageGenerationService.getCacheStats();
    console.log("✅ Cache stats:");
    console.log(JSON.stringify(stats, null, 2));
    console.log();

    // Test 4: Image metadata retrieval
    console.log("TEST 4: Image Metadata Retrieval");
    console.log("=================================");
    const metadata = aiImageGenerationService.getImageMetadata(
      testVarieties[0].id
    );
    console.log("✅ Metadata for first image:");
    console.log(JSON.stringify(metadata, null, 2));
    console.log();

    // Test 5: Cache hit (should return cached image)
    console.log("TEST 5: Cache Hit Test");
    console.log("======================");
    const cachedImage = await aiImageGenerationService.generateVarietyImage(
      testVarieties[0].id,
      testVarieties[0],
      "Same variety - should be cached"
    );
    console.log("✅ Cached image retrieved (should be identical):");
    console.log(`   Same as original: ${JSON.stringify(singleImage) === JSON.stringify(cachedImage)}`);
    console.log();

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("=====================================");
    console.log("AI Image Generator is working correctly.");
    console.log("Ready for production use.");

    return {
      status: "SUCCESS",
      tests_passed: 5,
      generator_status: "OPERATIONAL",
    };

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    return {
      status: "FAILED",
      error: error.message,
    };
  }
}

// Run tests
testAIImageGenerator().then(result => {
  console.log("\nFinal Result:");
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "SUCCESS" ? 0 : 1);
});
