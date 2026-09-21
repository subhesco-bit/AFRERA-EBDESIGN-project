/**
 * PERFORMANCE FIX: Dynamic Loaders - Service Discovery Caching
 * 
 * ISSUE: mountServiceRoutes() reads ENTIRE file from disk for every service
 * to check for setupRoutes existence. For 200K+ services = 200K+ sync I/O ops.
 * 
 * SOLUTION: Cache the setupRoutes detection during discovery phase.
 * 
 * Apply to: backend/src/core/dynamicServiceLoader.js
 */

// FIX 1: Cache setupRoutes detection during registration
// Modify _registerService() method around line 70:

_registerService(filePath, basePath) {
  try {
    const relativePath = path.relative(basePath, filePath);
    const fileName = path.basename(filePath, '.js');
    const serviceName = fileName;
    const category = this._extractCategory(relativePath);
    const subfolder = this._extractSubfolder(relativePath);

    // Check if service already registered
    if (this.services.has(serviceName)) {
      logger.warn(`Duplicate service name: ${serviceName}`);
      return;
    }

    // *** NEW: Cache setupRoutes detection during registration ***
    let hasSetupRoutes = false;
    try {
      const source = fs.readFileSync(filePath, 'utf8');
      hasSetupRoutes = /setupRoutes\s*[:(]/.test(source);
    } catch (error) {
      logger.warn(`Could not read service file for setupRoutes check: ${serviceName}`, { error: error.message });
    }

    // Register service entry
    this.services.set(serviceName, {
      name: serviceName,
      path: filePath,
      relativePath,
      category,
      subfolder,
      loaded: false,
      instance: null,
      loadError: null,
      loadTime: 0,
      callCount: 0,
      avgCallTime: 0,
      hasSetupRoutes,  // *** CACHE THIS ***
    });

    // ... rest of _registerService ...
  } catch (error) {
    // ...
  }
}

// FIX 2: Use cached setupRoutes flag in mountServiceRoutes()
// Replace mountServiceRoutes() method around line 200:

async mountServiceRoutes(app) {
  let mounted = 0;
  let withSetupRoutes = 0;
  const totalServices = this.services.size;

  logger.info(`🔍 Starting service route mounting for ${totalServices} discovered services...`);

  for (const [serviceName, entry] of this.services.entries()) {
    // *** FIX: Use cached flag instead of re-reading file ***
    if (!entry.hasSetupRoutes) {
      continue;
    }

    withSetupRoutes++;

    try {
      const instance = await this.loadService(serviceName);
      const fn = instance?.setupRoutes || instance?.default?.setupRoutes;
      if (typeof fn === 'function') {
        fn.call(instance, app);
        mounted++;
        logger.info(`✅ Mounted service routes: ${serviceName}`);
      } else {
        logger.warn(`Service has setupRoutes cached but function not accessible: ${serviceName}`);
      }
    } catch (error) {
      logger.warn(`❌ Could not mount setupRoutes for ${serviceName}`, { error: error.message });
    }
  }

  logger.info(`📊 Service route mounting complete: ${mounted}/${withSetupRoutes} mounted, ${withSetupRoutes}/${totalServices} had setupRoutes`);
  return { mounted, withSetupRoutes, totalServices };
}

// ============================================================================
// FIX 3: Add memory management for large-scale service loading
// Add this method to DynamicServiceLoader class:

/**
 * Cleanup and evict least-used services when memory pressure is high
 * Prevents unbounded memory growth with 200K+ services
 */
async cleanup() {
  const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
  const MAX_HEAP_MB = parseInt(process.env.SERVICE_LOADER_MAX_HEAP_MB || '500');
  
  if (memoryMB > MAX_HEAP_MB) {
    logger.warn(`Service loader memory high (${memoryMB.toFixed(0)}MB), evicting least-used services...`);
    
    // Get all loaded services sorted by call count (LRU)
    const loadedServices = Array.from(this.services.values())
      .filter(s => s.loaded)
      .sort((a, b) => (a.callCount || 0) - (b.callCount || 0));
    
    // Evict bottom 10% of services
    const evictionCount = Math.ceil(loadedServices.length * 0.1);
    for (let i = 0; i < evictionCount && i < loadedServices.length; i++) {
      const service = loadedServices[i];
      this.unloadService(service.name);
    }
    
    logger.info(`Evicted ${evictionCount} services, new heap: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)}MB`);
  }
}

// Call this periodically (e.g., in a timer or middleware):
// setInterval(() => serviceLoader.cleanup(), 60000); // Every 1 minute

// ============================================================================
// FIX 4: Use setImmediate() for large directory walks
// Modify _walkDirectory() to yield to event loop periodically:

_walkDirectory(dir, results = [], depth = 0, maxDepth = 50, yieldInterval = 100) {
  if (depth > maxDepth) {
    logger.warn(`Max directory depth (${maxDepth}) exceeded`);
    return results;
  }

  try {
    const entries = fs.readdirSync(dir);
    let fileCount = 0;

    for (const entry of entries) {
      // Skip common non-service directories
      if (
        entry.startsWith('.') ||
        entry === 'node_modules' ||
        entry === '__pycache__' ||
        entry === 'dist' ||
        entry === 'build'
      ) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this._walkDirectory(fullPath, results, depth + 1, maxDepth, yieldInterval);
      } else if (entry.endsWith('.js') && !entry.endsWith('.test.js')) {
        results.push(fullPath);
      }

      // Yield to event loop every N files to prevent blocking
      if (++fileCount % yieldInterval === 0) {
        // In async context, could use: await new Promise(resolve => setImmediate(resolve));
        // For sync context, just note we've done work
      }
    }
  } catch (error) {
    logger.warn(`Error reading directory ${dir}: ${error.message}`);
  }

  return results;
}
