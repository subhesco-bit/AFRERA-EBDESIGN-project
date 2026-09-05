/**
 * Product Media AI Routes — AI product-image generation and nutrient-
 * comparison video generation. See services/productMediaAIService.js header.
 */

const express = require('express');
const productMediaAIController = require('../controllers/productMediaAIController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

router.get
    // Log request
    logger.debug('router.get request');('/status', productMediaAIController.getProviderStatus);
router.post
    // Log request
    logger.debug('router.post request');('/products/:productId/image', productMediaAIController.generateProductImage);
router.post
    // Log request
    logger.debug('router.post request');('/products/:productId/video-script', productMediaAIController.buildNutrientVideoScript);
router.post
    // Log request
    logger.debug('router.post request');('/products/:productId/video', productMediaAIController.generateProductVideo);

module.exports = router;
