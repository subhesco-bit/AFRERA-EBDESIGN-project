// M052 - Product Catalog
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/products', controller.createProduct);
router.get('/products', controller.listProducts);
router.get('/products/search', controller.searchProducts);
router.get('/products/:id', controller.getProduct);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);
router.patch('/products/:id/inventory', controller.updateInventory);
router.get('/products/:id/recommendations', controller.getProductRecommendations);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
