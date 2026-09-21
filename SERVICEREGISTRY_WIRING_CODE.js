// ============================================================================
// SERVICE REGISTRY WIRING CODE
// Copy this into backend/src/index.js startup function
// Location: Add BEFORE app.listen() call
// ============================================================================

// At the top of backend/src/index.js, add this import:
const serviceRegistry = require('./core/serviceRegistry');

// ============================================================================
// Then in your startup function (typically startServer() or similar),
// add this code BEFORE app.listen():
// ============================================================================

async function startServer() {
  try {
    console.log('🚀 Starting EBDESIGN backend...');
    console.log('');

    // ====================================================================
    // INITIALIZE ALL SERVICES (add this block)
    // ====================================================================

    console.log('📋 Initializing 140+ services...');
    const status = await serviceRegistry.initializeAll();

    if (status.initialized === 0) {
      console.error('❌ No services initialized');
      process.exit(1);
    }

    console.log(`✓ Services initialized: ${status.initialized}/${status.total}`);
    if (status.failed > 0) {
      console.warn(`⚠ ${status.failed} services failed to initialize`);
    }
    console.log('');

    // ====================================================================
    // ADD HEALTH CHECK ENDPOINT (add this)
    // ====================================================================

    app.get('/health', (req, res) => {
      const status = serviceRegistry.getStatus();
      res.json({
        status: status.failed === 0 ? 'healthy' : 'degraded',
        services: {
          total: status.total,
          initialized: status.initialized,
          failed: status.failed,
          uptime: status.uptime
        },
        timestamp: new Date().toISOString()
      });
    });

    app.get('/health/detailed', (req, res) => {
      const details = serviceRegistry.getDetailedStatus();
      res.json({
        status: 'ok',
        services: details,
        timestamp: new Date().toISOString()
      });
    });

    // ====================================================================
    // START EXPRESS SERVER (existing code - don't change)
    // ====================================================================

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Services: ${status.initialized}/${status.total} healthy`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
      console.log('');
    });

    // ====================================================================
    // GRACEFUL SHUTDOWN (add this)
    // ====================================================================

    process.on('SIGTERM', async () => {
      console.log('📍 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await serviceRegistry.shutdown();
        console.log('✓ Shutdown complete');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📍 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await serviceRegistry.shutdown();
        console.log('✓ Shutdown complete');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// COMPLETE EXAMPLE (if your index.js doesn't have a startServer function)
// ============================================================================

/*
EXAMPLE: Complete server startup structure:

const express = require('express');
const serviceRegistry = require('./core/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(express.json());
app.use(express.static('public'));

// Route mounting (all your existing routes)
// app.use('/api/v1/users', require('./routes/users'));
// ... etc

// ======== START HERE: SERVICE REGISTRY INITIALIZATION ========

async function startServer() {
  try {
    console.log('🚀 Starting EBDESIGN backend...');

    // Initialize services
    console.log('📋 Initializing 140+ services...');
    const status = await serviceRegistry.initializeAll();

    console.log(`✓ Services: ${status.initialized}/${status.total}`);

    // Health endpoints
    app.get('/health', (req, res) => {
      const status = serviceRegistry.getStatus();
      res.json({
        status: status.failed === 0 ? 'healthy' : 'degraded',
        services: status,
        timestamp: new Date().toISOString()
      });
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server ready on http://localhost:${PORT}`);
      console.log(`❤️  Health: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Shutting down...');
      server.close(async () => {
        await serviceRegistry.shutdown();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

startServer();
*/

// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

/*
After adding this code, verify:

1. File edits:
   ✓ Imported serviceRegistry at top
   ✓ Added initializeAll() call
   ✓ Added /health endpoint
   ✓ Added /health/detailed endpoint
   ✓ Added graceful shutdown handlers

2. Test it works:
   $ npm run dev

   Expected output:
   🚀 Starting EBDESIGN backend...
   📋 Initializing 140+ services...
   ✓ Services initialized: 140/140
   ✅ Server running on port 3001
   📊 Services: 140/140 healthy

3. Verify endpoints:
   $ curl http://localhost:3001/health

   Expected response:
   {
     "status": "healthy",
     "services": {
       "total": 140,
       "initialized": 140,
       "failed": 0,
       "uptime": 12345
     }
   }

4. If errors appear:
   - Check serviceRegistry.js exists
   - Verify all service imports
   - Check error logs for missing dependencies
   - See backend/src/core/serviceRegistry.js for options
*/

// ============================================================================
// SERVICE REGISTRY API REFERENCE
// ============================================================================

/*
Available methods on serviceRegistry:

1. register(name, service, dependencies)
   - Register a new service
   - Example: serviceRegistry.register('userService', userService, ['authService'])

2. initializeAll()
   - Initialize all registered services in dependency order
   - Returns: { total, initialized, failed, duration, details }
   - Used in startup

3. getStatus()
   - Get current status summary
   - Returns: { total, initialized, failed, uptime, healthy }
   - Used in /health endpoint

4. getDetailedStatus()
   - Get detailed status for each service
   - Returns: Array of { name, initialized, dependencies, health }
   - Used in /health/detailed endpoint

5. shutdown()
   - Gracefully shut down all services
   - Calls service.shutdown() if available
   - Used in SIGTERM/SIGINT handlers

6. waitForHealthy(timeout)
   - Wait for all services to be healthy
   - Returns: true if healthy within timeout
   - Throws error if timeout

For more details, see backend/src/core/serviceRegistry.js
*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Problem: "Cannot find module './core/serviceRegistry'"
Solution: Verify file exists at backend/src/core/serviceRegistry.js

Problem: Services not initializing
Solution: Check service implementations have initialize() method

Problem: Health endpoint returns 404
Solution: Ensure endpoint is added before app.listen()

Problem: Services initialize but startup fails
Solution: Check individual service error messages in logs

Problem: SIGTERM/SIGINT not working
Solution: Verify signal handlers are added after server.listen()

See: .ai/COMPREHENSIVE_BLOCKER_RESOLUTION_2026-09-18.md for more
*/

// ============================================================================
// END OF SERVICE REGISTRY WIRING CODE
// ============================================================================
