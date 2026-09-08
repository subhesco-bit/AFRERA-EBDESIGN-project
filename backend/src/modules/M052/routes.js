// Express routes for Product Catalog (M052)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware } = require('../../middleware/auth');

router.post('/products', authMiddleware, controller.createProduct);
router.get('/products', controller.listProducts);
router.get('/products/search', controller.searchProducts);
router.get('/products/:id', controller.getProduct);
router.put('/products/:id', authMiddleware, controller.updateProduct);
router.delete('/products/:id', authMiddleware, controller.deleteProduct);
router.patch('/products/:id/inventory', authMiddleware, controller.updateInventory);
router.get('/products/:id/recommendations', controller.getProductRecommendations);

module.exports = router;
