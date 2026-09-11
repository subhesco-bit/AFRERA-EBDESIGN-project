/**
 * Product Media AI Routes — AI product-image generation, farmer-friendly
 * product media, cartoon education assets and nutrient-comparison video scripts.
 */

const express = require('express');
const productMediaAIController = require('../controllers/productMediaAIController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

router.get('/status', productMediaAIController.getProviderStatus);
router.post('/products/:productId/image', productMediaAIController.generateProductImage);
router.post('/products/:productId/cartoon', productMediaAIController.generateProductCartoon);
router.post('/products/:productId/video-script', productMediaAIController.buildNutrientVideoScript);
router.post('/products/:productId/video', productMediaAIController.generateProductVideo);

module.exports = router;
