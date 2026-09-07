/**
 * Product Media AI Routes
 * Routes for AI-powered product image and video generation
 */

const express = require('express');
const router = express.Router();
const productMediaAIController = require('../controllers/productMediaAIController');
const { authMiddleware } = require('../middleware/auth');

// Provider status
router.get('/status', productMediaAIController.getProviderStatus);

// Image generation
router.post('/products/:productId/image', authMiddleware, productMediaAIController.generateProductImage);
router.post('/products/:productId/cartoon', authMiddleware, productMediaAIController.generateProductCartoon);

// Video generation
router.post('/products/:productId/video/script', authMiddleware, productMediaAIController.buildNutrientVideoScript);
router.post('/products/:productId/video', authMiddleware, productMediaAIController.generateProductVideo);

module.exports = router;
