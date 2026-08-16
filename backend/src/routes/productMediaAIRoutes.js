/**
 * Product Media AI Routes — AI product-image generation and nutrient-
 * comparison video generation. See services/productMediaAIService.js header.
 */

const express = require('express');
const productMediaAIController = require('../controllers/productMediaAIController');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

router.get('/status', productMediaAIController.getProviderStatus);
router.post('/products/:productId/image', productMediaAIController.generateProductImage);
router.post('/products/:productId/video-script', productMediaAIController.buildNutrientVideoScript);
router.post('/products/:productId/video', productMediaAIController.generateProductVideo);

module.exports = router;
