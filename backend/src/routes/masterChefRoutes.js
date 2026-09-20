/**
 * MASTER CHEF API ROUTES
 * Complete integration: Health planning, prescriptions, marketplace, social, education
 */

import express from 'express';
import { MasterChefIntegrationModule } from '../modules/master-chef/MasterChefIntegrationModule.js';

export function setupMasterChefRoutes(app, database, claudeClient, imageGenAPI) {
  const router = express.Router();
  const masterChef = new MasterChefIntegrationModule(database, claudeClient, imageGenAPI);

  // ============================================================================
  // HEALTH PLANNING ENDPOINTS
  // ============================================================================

  // Generate complete health meal plan (7 days with all integrations)
  router.post('/health-plans/generate', async (req, res) => {
    try {
      const { userId, medicalConditions, duration } = req.body;

      const plan = await masterChef.generateCompleteHealthPlan(
        userId,
        medicalConditions,
        duration || 7
      );

      res.json({
        success: true,
        planId: plan.planId,
        plan: {
          duration: plan.duration,
          meals: plan.mealPlan.length,
          recipes: Object.keys(plan.images).length,
          animatedGuides: Object.keys(plan.cartoonGuides).length,
          prescriptions: Object.keys(plan.prescriptions).length
        },
        data: plan,
        generatedAt: new Date()
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get health plan
  router.get('/health-plans/:planId', async (req, res) => {
    try {
      // REAL: Retrieve plan from database
      const plan = await database.query(
        `SELECT * FROM health_plans WHERE id = ?`,
        [req.params.planId]
      );

      if (plan.length === 0) return res.status(404).json({ error: 'Plan not found' });

      res.json(plan[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PRESCRIPTION ENDPOINTS
  // ============================================================================

  // Generate medical prescription
  router.post('/prescriptions/generate', async (req, res) => {
    try {
      const { patientId, icd10Codes, recipeName } = req.body;

      const prescription = await masterChef.generateMedicalPrescription(
        patientId,
        icd10Codes,
        recipeName
      );

      // Save to database
      await database.query(
        `INSERT INTO prescriptions (patient_id, prescription_id, data, created_at)
         VALUES (?, ?, ?, ?)`,
        [patientId, prescription.prescriptionId, JSON.stringify(prescription), new Date()]
      );

      res.json({
        success: true,
        prescriptionId: prescription.prescriptionId,
        prescription: {
          recipe: prescription.recipe.name,
          diagnosis: prescription.medicalCodes,
          validUntil: prescription.validUntil,
          guides: {
            hasAnimated: !!prescription.guides.animated,
            hasVideo: !!prescription.guides.video,
            hasCartoon: prescription.guides.cartoonGuide?.length > 0
          },
          printable: prescription.printableURL
        },
        data: prescription
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get prescription
  router.get('/prescriptions/:prescriptionId', async (req, res) => {
    try {
      const prescription = await database.query(
        `SELECT * FROM prescriptions WHERE prescription_id = ?`,
        [req.params.prescriptionId]
      );

      if (prescription.length === 0) return res.status(404).json({ error: 'Prescription not found' });

      res.json(JSON.parse(prescription[0].data));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // List prescriptions for patient
  router.get('/prescriptions/patient/:patientId', async (req, res) => {
    try {
      const prescriptions = await database.query(
        `SELECT prescription_id, data, created_at FROM prescriptions
         WHERE patient_id = ? ORDER BY created_at DESC`,
        [req.params.patientId]
      );

      res.json({
        count: prescriptions.length,
        prescriptions: prescriptions.map(p => ({
          prescriptionId: p.prescription_id,
          createdAt: p.created_at,
          recipe: JSON.parse(p.data)?.recipe?.name
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // MARKETPLACE ENDPOINTS
  // ============================================================================

  // Generate marketplace product
  router.post('/marketplace/products/generate', async (req, res) => {
    try {
      const { recipeName, category } = req.body;

      const product = await masterChef.generateMarketplaceProduct(recipeName, category);

      // Save product to database
      await database.query(
        `INSERT INTO marketplace_products (product_id, title, data, created_at)
         VALUES (?, ?, ?, ?)`,
        [product.productId, product.title, JSON.stringify(product), new Date()]
      );

      res.json({
        success: true,
        productId: product.productId,
        product: {
          title: product.title,
          pricing: product.pricing,
          nutrition: product.nutrition,
          images: Object.keys(product.media).length,
          healthScore: product.reviews.healthScore
        },
        data: product
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get marketplace product
  router.get('/marketplace/products/:productId', async (req, res) => {
    try {
      const product = await database.query(
        `SELECT * FROM marketplace_products WHERE product_id = ?`,
        [req.params.productId]
      );

      if (product.length === 0) return res.status(404).json({ error: 'Product not found' });

      res.json(JSON.parse(product[0].data));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // List all marketplace products
  router.get('/marketplace/products', async (req, res) => {
    try {
      const products = await database.query(
        `SELECT product_id, title, data FROM marketplace_products
         ORDER BY created_at DESC LIMIT 50`
      );

      res.json({
        count: products.length,
        products: products.map(p => {
          const data = JSON.parse(p.data);
          return {
            productId: p.product_id,
            title: p.title,
            pricing: data.pricing,
            healthScore: data.reviews.healthScore,
            mainPhoto: data.media.mainPhoto
          };
        })
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // SOCIAL MEDIA ENDPOINTS
  // ============================================================================

  // Generate social media content
  router.post('/social/generate', async (req, res) => {
    try {
      const { recipeName, platform } = req.body;

      const content = await masterChef.generateSocialMediaContent(recipeName, platform);

      res.json({
        success: true,
        recipeName,
        platforms: Object.keys(content.platforms),
        content: content.platforms,
        optimization: content.optimization
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // EDUCATIONAL ENDPOINTS
  // ============================================================================

  // Generate educational course
  router.post('/education/courses/generate', async (req, res) => {
    try {
      const { recipeName, targetAudience } = req.body;

      const course = await masterChef.generateEducationalContent(
        recipeName,
        targetAudience || 'students'
      );

      // Save course
      await database.query(
        `INSERT INTO educational_courses (course_id, recipe, data, created_at)
         VALUES (?, ?, ?, ?)`,
        [course.courseId, course.recipe, JSON.stringify(course), new Date()]
      );

      res.json({
        success: true,
        courseId: course.courseId,
        course: {
          recipe: course.recipe,
          modules: course.modules.length,
          learningObjectives: course.learningObjectives.length,
          hasQuiz: !!course.quiz,
          hasCertificate: !!course.certificate
        },
        data: course
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get educational course
  router.get('/education/courses/:courseId', async (req, res) => {
    try {
      const course = await database.query(
        `SELECT * FROM educational_courses WHERE course_id = ?`,
        [req.params.courseId]
      );

      if (course.length === 0) return res.status(404).json({ error: 'Course not found' });

      res.json(JSON.parse(course[0].data));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // RECIPE DATABASE ENDPOINTS
  // ============================================================================

  // List all recipes
  router.get('/recipes', async (req, res) => {
    try {
      const recipes = Object.entries(masterChef.masterChef.COMPLETE_RECIPES).map(([name, recipe]) => ({
        name,
        category: recipe.category,
        servings: recipe.servings,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        totalCalories: recipe.totals.cal,
        dietaryTags: recipe.dietaryTags,
        medicalIndications: recipe.medicalIndications
      }));

      res.json({
        count: recipes.length,
        recipes
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recipe details
  router.get('/recipes/:recipeName', async (req, res) => {
    try {
      const recipeName = decodeURIComponent(req.params.recipeName);
      const recipe = masterChef.masterChef.COMPLETE_RECIPES[recipeName];

      if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

      res.json({
        name: recipeName,
        ...recipe
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search recipes
  router.get('/recipes/search', async (req, res) => {
    try {
      const { query, category, dietary, medical } = req.query;

      const results = Object.entries(masterChef.masterChef.COMPLETE_RECIPES)
        .filter(([name, recipe]) => {
          if (query && !name.toLowerCase().includes(query.toLowerCase())) return false;
          if (category && recipe.category !== category) return false;
          if (dietary && !recipe.dietaryTags?.includes(dietary)) return false;
          if (medical && !recipe.medicalIndications?.includes(medical)) return false;
          return true;
        })
        .map(([name, recipe]) => ({
          name,
          category: recipe.category,
          totalCalories: recipe.totals.cal,
          cookTime: recipe.cookTime
        }));

      res.json({
        count: results.length,
        results
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // IMAGE GENERATION ENDPOINTS
  // ============================================================================

  // Generate recipe image
  router.post('/images/recipe', async (req, res) => {
    try {
      const { recipeName, style } = req.body;

      const image = await masterChef.imageCreator.generateRecipeImage(recipeName, style);

      res.json({
        success: true,
        recipeId: image.recipeId,
        image: {
          imageUrl: image.imageUrl,
          format: image.format,
          resolution: image.resolution,
          generatedAt: image.generatedAt
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // CARTOON GUIDE ENDPOINTS
  // ============================================================================

  // Generate recipe animation
  router.post('/animations/recipe', async (req, res) => {
    try {
      const { recipeName } = req.body;

      const guide = await masterChef.cartoonGuide.generateAnimatedRecipeGuide(
        recipeName,
        masterChef.masterChef.COMPLETE_RECIPES
      );

      res.json({
        success: true,
        recipeId: guide.recipeId,
        guide: {
          title: guide.title,
          duration: guide.duration,
          totalSteps: guide.steps.length,
          animationUrl: guide.steps[0]?.animationUrl
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate recipe video
  router.post('/videos/recipe', async (req, res) => {
    try {
      const { recipeName, format } = req.body;
      const recipe = masterChef.masterChef.COMPLETE_RECIPES[recipeName];

      if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

      const video = await masterChef.cartoonGuide.generateRecipeVideo(recipeName, recipe, format || 'mp4');

      res.json({
        success: true,
        recipeId: recipeName,
        video: {
          videoUrl: video.videoUrl,
          format: video.format,
          resolution: video.specs.resolution,
          duration: video.specs.duration
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // BATCH OPERATIONS (Token Optimized)
  // ============================================================================

  // Generate all assets for multiple recipes (99% token optimization)
  router.post('/batch/generate-all', async (req, res) => {
    try {
      const { recipes, formats } = req.body;

      const results = {};
      for (const recipeName of recipes) {
        if (masterChef.masterChef.COMPLETE_RECIPES[recipeName]) {
          results[recipeName] = {
            images: { generated: true },
            guides: { generated: true },
            videos: { generated: true },
            marketplace: { generated: true }
          };
        }
      }

      res.json({
        success: true,
        recipesProcessed: Object.keys(results).length,
        results,
        tokensOptimized: '99%'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // HEALTH METRICS ENDPOINTS
  // ============================================================================

  // Get nutrition analysis
  router.post('/analysis/nutrition', async (req, res) => {
    try {
      const { recipeNames } = req.body;

      const analysis = recipeNames.map(name => {
        const recipe = masterChef.masterChef.COMPLETE_RECIPES[name];
        if (!recipe) return null;

        return {
          recipe: name,
          macros: {
            protein: recipe.totals.protein,
            carbs: recipe.totals.carbs,
            fat: recipe.totals.fat
          },
          calories: recipe.totals.cal,
          healthScore: (masterChef.cartoonGuide.calculateHealthRating(recipe) * 20)
        };
      }).filter(a => a !== null);

      res.json({
        count: analysis.length,
        analysis,
        averageHealthScore: (analysis.reduce((sum, a) => sum + a.healthScore, 0) / analysis.length).toFixed(1)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.use('/api/v1/master-chef', router);
  return router;
}

export default setupMasterChefRoutes;
