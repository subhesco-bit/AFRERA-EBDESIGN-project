# 🤖 Auto Image Generation Setup Guide

## Complete Automation for Product Images

This guide shows how to enable automatic image generation when products are added or when pages are viewed.

---

## What It Does

### Trigger 1: On Product Creation
```
Product Added → Auto-Queue for Generation → Background Processing → Images Ready
```

### Trigger 2: On Page View
```
Product Page Viewed → Check for Images → If Missing → Auto-Queue → Background Generation
```

### Trigger 3: On Inventory Update
```
Stock Goes Critical (≤5 units) → Auto-Queue for Refresh → Re-generate Showcase Images
```

---

## Installation

### 1. Add Environment Variables

Add to `.env`:

```bash
# Auto-generation master switch
AUTO_IMAGE_GENERATION=true

# Triggers
AUTO_GENERATE_ON_PRODUCT_ADD=true
AUTO_GENERATE_ON_PAGE_VIEW=true
AUTO_GENERATE_ON_INVENTORY_UPDATE=true

# Defaults
DEFAULT_REGION=global-export
DEFAULT_LANGUAGES=en,hi

# Queue Settings
AUTO_GEN_BATCH_SIZE=10          # Process 10 products per batch
AUTO_GEN_MAX_CONCURRENT=3       # Up to 3 concurrent generations
AUTO_GEN_CHECK_INTERVAL=5000    # Check queue every 5 seconds (5000ms)

# Performance
IMAGE_GENERATION_TIMEOUT=30000  # 30 second timeout per image
```

### 2. Mount Routes in Backend

Edit `backend/src/index.js`:

```javascript
// ... existing imports ...
const productImageAutoGenerationRoutes = require('./routes/productImageAutoGenerationRoutes');
const {
  autoGenerateOnPageViewMiddleware,
  triggerAutoGenAfterCreateMiddleware,
} = require('./middleware/productImageAutoGenerationHooks');

// ... existing middleware ...

// Add auto-generation routes
app.use('/api/auto-generation', productImageAutoGenerationRoutes);

// Add auto-generation middleware
// This enables auto-generation on page views
app.use(autoGenerateOnPageViewMiddleware);

// This triggers auto-generation after product creation
app.use(triggerAutoGenAfterCreateMiddleware);

// ... rest of app setup ...
```

### 3. Update Product Routes

Edit existing product routes (`backend/src/routes/productRoutes.js`):

```javascript
const express = require('express');
const router = express.Router();
const productImageAutoGenerationService = require('../services/productImageAutoGenerationService');

// POST /api/products (create product)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Your existing create logic
    const product = await Product.create(req.body);

    // Auto-queue for image generation
    if (process.env.AUTO_GENERATE_ON_PRODUCT_ADD === 'true') {
      await productImageAutoGenerationService.onProductCreated({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        color_profile: product.color_profile,
        size_range: product.size_range,
        certified: product.certified,
        gi_tag: product.gi_tag,
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. Frontend: Trigger on Page View

Edit `frontend/src/components/ProductDetail.jsx`:

```javascript
import { useEffect } from 'react';

const ProductDetail = ({ productId }) => {
  useEffect(() => {
    // Trigger auto-generation when product page loads
    const triggerAutoGen = async () => {
      try {
        await fetch(`/api/auto-generation/on-page-view/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            region: localStorage.getItem('preferredRegion') || 'global-export',
            languages: (localStorage.getItem('preferredLanguages') || 'en,hi').split(','),
          }),
        });
      } catch (error) {
        console.error('Failed to trigger auto-generation:', error);
      }
    };

    triggerAutoGen();
  }, [productId]);

  // ... rest of component ...
};

export default ProductDetail;
```

---

## Configuration Scenarios

### Scenario 1: Eager Generation (Immediate)

**For:** Fast marketplace, high traffic
**Config:**
```bash
AUTO_GEN_BATCH_SIZE=20
AUTO_GEN_CHECK_INTERVAL=2000      # Check every 2 seconds
AUTO_GEN_MAX_CONCURRENT=5
```

### Scenario 2: Balanced Generation (Recommended)

**For:** Medium traffic, balanced resource usage
**Config:**
```bash
AUTO_GEN_BATCH_SIZE=10
AUTO_GEN_CHECK_INTERVAL=5000      # Check every 5 seconds
AUTO_GEN_MAX_CONCURRENT=3
```

### Scenario 3: Conservative Generation (Low Resource)

**For:** Limited resources, batch processing at night
**Config:**
```bash
AUTO_GEN_BATCH_SIZE=5
AUTO_GEN_CHECK_INTERVAL=10000     # Check every 10 seconds
AUTO_GEN_MAX_CONCURRENT=1
```

---

## API Endpoints

### Management Endpoints

```bash
# Get current status
GET /api/auto-generation/status
  Response: {
    config: {...},
    queue: { length, isProcessing, nextBatch },
    stats: { total, successful, failed, avgTimeMs }
  }

# Queue single product
POST /api/auto-generation/queue
  Body: {
    productId: "123",
    productData: {...},
    trigger: "manual",
    priority: "high"
  }

# Queue multiple products
POST /api/auto-generation/batch-queue
  Body: {
    productIds: ["1", "2", "3"],
    priority: "normal"
  }

# Process queue immediately
POST /api/auto-generation/process-now
  (Admin only)

# Clear queue
DELETE /api/auto-generation/queue
  (Admin only)

# Pause/Resume
POST /api/auto-generation/pause
  (Admin only)
  Body: { paused: true }

# Get queue preview
GET /api/auto-generation/queue-preview?limit=10
  Response: { total, preview: [...] }

# Get statistics
GET /api/auto-generation/stats
  Response: { stats: { total, successful, failed, successRate } }

# Configure
PUT /api/auto-generation/config
  (Admin only)
  Body: {
    enableAutoGeneration: true,
    enableOnPageView: true,
    defaultRegion: "global-export",
    batchSize: 10
  }
```

---

## Data Flow Examples

### Example 1: Farmer Adds Product

```
1. Farmer creates product via farmer portal
   POST /api/farmer/portfolio/products
   
2. Product is saved to database
   
3. triggerAutoGenAfterCreateMiddleware fires
   → Calls productImageAutoGenerationService.onProductCreated()
   
4. Product added to auto-generation queue
   → Priority: HIGH
   → Trigger: "product-created"
   
5. Queue processor picks up product
   → Fetches product details
   → Generates images in DEFAULT_LANGUAGES
   → Optimizes for DEFAULT_REGION
   → Creates marketplace listing
   
6. Images ready
   → Stored in ai_generated_images table
   → Farmer dashboard shows "Images ready"
   → Marketplace shows product with images
```

### Example 2: Customer Views Product Page

```
1. Customer visits product page
   GET /product/123
   
2. autoGenerateOnPageViewMiddleware intercepts request
   → Extracts productId and pageContext
   
3. Checks if product has images
   → If YES: continue normally
   → If NO: proceed to step 4
   
4. Queue product for generation
   → Priority: NORMAL
   → Trigger: "page-view"
   → PageContext includes: region, languages, user-agent
   
5. Page loads normally (doesn't wait for images)
   
6. Images generated in background
   → Queue processor handles when available
   → Page can refresh to see images
   
7. Customer sees images on next visit or refresh
```

### Example 3: Stock Critical Alert

```
1. Inventory update
   PUT /api/inventory/update
   
2. onInventoryUpdatedHook fires
   → Checks if quantity ≤ 5
   
3. If critical stock:
   → Queue product for regeneration
   → Priority: LOW
   → Creates fresh showcase images
   
4. Product re-listed with urgency messaging
   → "Limited stock" images
   → Highlights availability
```

---

## Monitoring & Dashboard

### Create Admin Dashboard Component

```javascript
// frontend/src/components/Admin/AutoGenDashboard.jsx

import { useEffect, useState } from 'react';

export default function AutoGenDashboard() {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch('/api/auto-generation/status', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/auto-generation/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      setStatus(await statusRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  if (!status) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">🤖 Auto-Generation Dashboard</h1>

      {/* Queue Status */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Queue Length</p>
          <p className="text-2xl font-bold text-blue-600">
            {status.status?.queue?.length || 0}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${
          status.status?.queue?.isProcessing
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-2xl font-bold">
            {status.status?.queue?.isProcessing ? '🟢 Processing' : '⏸️ Idle'}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Total Processed</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.stats?.total || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.stats?.successRate || '0%'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => fetch('/api/auto-generation/process-now', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Process Now
        </button>
        <button
          onClick={() => fetch('/api/auto-generation/pause', {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ paused: true }),
          })}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Pause
        </button>
      </div>

      {/* Queue Preview */}
      <h2 className="text-xl font-bold mb-3">Next in Queue</h2>
      <div className="space-y-2">
        {status.status?.queue?.nextBatch?.slice(0, 5).map((job, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded border flex justify-between">
            <span>Product {job.productId}</span>
            <span className="text-sm text-gray-600">{job.trigger}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Performance Considerations

### Queue Processing Times

| Batch Size | Interval | Throughput |
|-----------|----------|-----------|
| 5 | 10s | 30 images/min |
| 10 | 5s | 120 images/min |
| 20 | 2s | 600 images/min |

### Resource Usage (Per Image)

- CPU: ~100-200ms
- Memory: ~150KB cache
- Network: ~2-5 seconds API call
- Storage: ~5KB metadata

### Recommended For Scale

| Traffic | Config | Throughput |
|---------|--------|-----------|
| Small (<1K/day) | Batch: 5, Interval: 10s | ~30 img/min |
| Medium (1-10K/day) | Batch: 10, Interval: 5s | ~120 img/min |
| Large (10K+/day) | Batch: 20, Interval: 2s | ~600 img/min |

---

## Troubleshooting

### Queue Not Processing

**Symptom:** Items stay in queue, not being processed

**Solutions:**
1. Check if auto-generation is enabled:
   ```bash
   GET /api/auto-generation/status
   ```
2. Check for errors in logs
3. Manually trigger processing:
   ```bash
   POST /api/auto-generation/process-now
   ```

### Images Not Generating

**Symptom:** Status shows success but no images appear

**Solutions:**
1. Verify Claude API key is set
2. Check database connection
3. Verify product data is complete (name, category, etc.)
4. Check cloud logs for API errors

### Queue Growing Too Fast

**Symptom:** Queue length increases faster than processing

**Solutions:**
1. Increase batch size:
   ```bash
   PUT /api/auto-generation/config
   Body: { batchSize: 20 }
   ```
2. Decrease check interval:
   ```bash
   PUT /api/auto-generation/config
   Body: { queueCheckInterval: 3000 }
   ```
3. Increase max concurrent:
   ```bash
   PUT /api/auto-generation/config
   Body: { maxConcurrent: 5 }
   ```

---

## Testing

### Test Auto-Generation on Product Add

```bash
# Create product (should auto-queue)
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Rice",
    "category": "Grains",
    "description": "Test product"
  }'

# Check queue
curl http://localhost:3000/api/auto-generation/queue-preview

# Process immediately
curl -X POST http://localhost:3000/api/auto-generation/process-now \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check status
curl http://localhost:3000/api/auto-generation/status
```

### Test Auto-Generation on Page View

```bash
# Simulate page view
curl -X POST http://localhost:3000/api/auto-generation/on-page-view/123 \
  -H "Content-Type: application/json" \
  -d '{
    "region": "global-export",
    "languages": ["en", "hi"]
  }'

# Check if queued
curl http://localhost:3000/api/auto-generation/queue-preview
```

---

## Next Steps

1. ✅ Install & configure auto-generation service
2. ✅ Mount routes in backend
3. ✅ Update product creation endpoints
4. ✅ Add frontend auto-gen triggers
5. ✅ Test with sample products
6. ✅ Deploy admin dashboard
7. ✅ Monitor in production
8. ✅ Optimize batch size based on real metrics

**Ready for automatic image generation at scale! 🚀**
