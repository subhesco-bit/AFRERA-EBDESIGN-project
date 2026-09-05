const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

/**
 * Product Routes
 * GET /products - List all products
 * GET /products/:id - Get product details
 * POST /products - Create product (admin)
 * PUT /products/:id - Update product (admin)
 * DELETE /products/:id - Delete product (admin)
 */

// Middleware: Verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.userId = token;
  next();
}

// Mock product database
const products = [
  {
    id: 'prod_001',
    name: 'Organic Rice',
    price: 450,
    category: 'grains',
    description: 'Premium organic rice from North India',
    stock: 100,
    rating: 4.5,
    reviews: 42,
  },
  {
    id: 'prod_002',
    name: 'Coffee Beans',
    price: 320,
    category: 'beverages',
    description: 'Fresh roasted coffee beans',
    stock: 50,
    rating: 4.8,
    reviews: 28,
  },
  {
    id: 'prod_003',
    name: 'Honey',
    price: 280,
    category: 'food',
    description: 'Pure raw honey from apiaries',
    stock: 75,
    rating: 4.6,
    reviews: 35,
  },
];

// GET /products
router.get
    // Log request
    logger.debug('router.get request');('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filtered = products;

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        products: filtered,
        count: filtered.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /products/:id
router.get
    // Log request
    logger.debug('router.get request');('/:id', async (req, res) => {
  try {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /products (admin only)
router.post
    // Log request
    logger.debug('router.post request');('/', verifyToken, async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const newProduct = {
      id: `prod_${Date.now()}`,
      name,
      price,
      category,
      description,
      stock: stock || 0,
      rating: 0,
      reviews: 0,
    };

    products.push(newProduct);

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /products/:id (admin only)
router.put
    // Log request
    logger.debug('router.put request');('/:id', verifyToken, async (req, res) => {
  try {
    let product = products.find((p) => p.id === req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    Object.assign(product, req.body);

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /products/:id (admin only)
router.delete
    // Log request
    logger.debug('router.delete request');('/:id', verifyToken, async (req, res) => {
  try {
    const index = products.findIndex((p) => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const deleted = products.splice(index, 1)[0];

    res.json({
      success: true,
      data: deleted,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
