/**
 * Module Registry and Loading System for Claude AI Plug-and-Play Integration
 * Production-ready system for module discovery, loading, and execution
 */

const path = require('path');
const fs = require('fs');
const { singleton: libraryKnowledgeService } = require('../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');

class ModuleRegistry {
  constructor() {
    this.libraryService = libraryKnowledgeService;
    this.loadedModules = new Map();
    this.moduleCache = new Map();
    this.executionQueue = new Map();
    // Tracks modules currently mid-load (not yet in loadedModules). Without this,
    // two modules that declare each other as a dependency (confirmed real case:
    // M002_USER_MANAGEMENT <-> M003_ORGANIZATION) recurse into each other forever -
    // loadedModules.has() is only true once a load fully completes, so the check
    // that's supposed to stop re-loading a dependency never fires while both are
    // still mid-load. This crashed the process with an out-of-memory error when
    // actually exercised.
    this.loadingInProgress = new Set();
  }

  /**
   * Initialize module registry
   */
  async initialize() {
    console.log('Initializing Module Registry...');
    
    await this.libraryService.initialize();
    
    console.log('Module Registry initialized successfully');
  }

  /**
   * Discover modules based on natural language query
   */
  async discover(query, context = {}) {
    try {
      const result = await this.libraryService.discoverModules(query, context);
      
      console.log(`Discovered ${result.modules.length} modules for query: "${query}"`);
      
      return result;
    } catch (error) {
      console.error('Module discovery failed:', error);
      return {
        success: false,
        error: error.message,
        modules: []
      };
    }
  }

  /**
   * Discover modules by capabilities
   */
  async discoverByCapabilities(requirements, context = {}) {
    try {
      const query = requirements.requiredCapabilities.join(' ') + ' ' + 
                   requirements.optionalCapabilities.join(' ');
      
      const result = await this.discover(query, context);
      
      // Filter by capability requirements
      const filteredModules = result.modules.filter(module => {
        const hasAllRequired = requirements.requiredCapabilities.every(cap => 
          module.capabilities.includes(cap)
        );
        
        return hasAllRequired;
      });

      return {
        success: true,
        modules: filteredModules,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Capability-based discovery failed:', error);
      return {
        success: false,
        error: error.message,
        modules: []
      };
    }
  }

  /**
   * Load module into memory
   */
  async load(moduleId) {
    try {
      console.log(`Loading module: ${moduleId}`);

      // Check if already loaded
      if (this.loadedModules.has(moduleId)) {
        console.log(`Module ${moduleId} already loaded`);
        return {
          success: true,
          message: 'Module already loaded',
          module: this.loadedModules.get(moduleId)
        };
      }

      // Circular dependency guard - see constructor comment. A module currently
      // mid-load is treated as satisfied for dependency-loading purposes (it will
      // finish loading itself; recursing into it again would never terminate).
      if (this.loadingInProgress.has(moduleId)) {
        return {
          success: false,
          error: `Circular dependency detected: ${moduleId} is already being loaded`
        };
      }
      this.loadingInProgress.add(moduleId);

      // Get module information
      const moduleInfo = await this.libraryService.getModule(moduleId);
      if (!moduleInfo.success) {
        this.loadingInProgress.delete(moduleId);
        return {
          success: false,
          error: `Module ${moduleId} not found`
        };
      }

      // Resolve dependencies
      const dependencies = await this.libraryService.resolveDependencies(moduleId);
      if (!dependencies.success) {
        this.loadingInProgress.delete(moduleId);
        return {
          success: false,
          error: `Failed to resolve dependencies for ${moduleId}`
        };
      }

      // Load dependencies first
      for (const depId of dependencies.resolutionOrder) {
        if (depId !== moduleId && !this.loadedModules.has(depId) && !this.loadingInProgress.has(depId)) {
          const depLoadResult = await this.load(depId);
          if (!depLoadResult.success) {
            this.loadingInProgress.delete(moduleId);
            return {
              success: false,
              error: `Failed to load dependency ${depId}`
            };
          }
        }
      }

      // Load the module. Two conventions coexist in this codebase:
      //  - manifest-driven modules (modules/M0XX_NAME/backend/service.js): class export
      //  - backend/src/modules/M0XX family (flat service.js): plain object of functions
      const modulePath = moduleInfo.module.path;
      const manifestServicePath = path.join(modulePath, 'backend', 'service.js');
      const flatServicePath = path.join(modulePath, 'service.js');
      const backendServicePath = fs.existsSync(manifestServicePath)
        ? manifestServicePath
        : (fs.existsSync(flatServicePath) ? flatServicePath : null);

      if (!backendServicePath) {
        return {
          success: false,
          error: `Backend service not found under ${modulePath}`
        };
      }

      // Dynamic require of module service
      const required = require(backendServicePath);
      let moduleInstance;

      if (typeof required === 'function') {
        // Class export - the Claude-compatible execute() contract declared in module.json
        moduleInstance = new required();
        if (typeof moduleInstance.execute !== 'function') {
          return {
            success: false,
            error: `Module ${moduleId} class export has no execute() method`
          };
        }
        if (typeof moduleInstance.initialize !== 'function') {
          moduleInstance.initialize = async () => {};
        }
      } else if (required && typeof required === 'object') {
        // Object export - either a plain object of functions (backend/src/modules/M0XX
        // family) or a singleton class instance (`module.exports = new Foo()`, common in
        // services/legacy/). Own enumerable keys only find the former; singleton instances
        // have their real methods on the prototype, so the prototype chain is walked too -
        // otherwise every operation on a singleton-exported service would falsely report
        // "unknown operation" despite the method genuinely existing.
        const ownFns = Object.keys(required).filter(k => typeof required[k] === 'function');
        const protoFns = [];
        let proto = Object.getPrototypeOf(required);
        while (proto && proto !== Object.prototype) {
          for (const k of Object.getOwnPropertyNames(proto)) {
            if (k !== 'constructor' && typeof required[k] === 'function' && !protoFns.includes(k)) {
              protoFns.push(k);
            }
          }
          proto = Object.getPrototypeOf(proto);
        }
        const availableOps = [...new Set([...ownFns, ...protoFns])];
        moduleInstance = {
          initialize: async () => {},
          execute: async (operation, parameters = {}, context = {}) => {
            if (typeof required[operation] !== 'function') {
              return {
                success: false,
                error: `Unknown operation "${operation}" on ${moduleId}. Available: ${availableOps.join(', ')}`
              };
            }
            const data = await required[operation](parameters, context);
            return { success: true, data };
          }
        };
      } else {
        return {
          success: false,
          error: `Module ${moduleId} export shape not recognized (expected a class or an object of functions)`
        };
      }

      // Initialize module
      await moduleInstance.initialize({
        moduleId: moduleId,
        libraryService: this.libraryService
      });

      // Cache loaded module
      this.loadedModules.set(moduleId, {
        instance: moduleInstance,
        info: moduleInfo.module,
        loadedAt: new Date().toISOString()
      });

      // Update registry status
      await this.libraryService.updateModuleStatus(moduleId, {
        loaded: true,
        initialized: true,
        healthy: true
      });

      console.log(`Module ${moduleId} loaded successfully`);
      
      return {
        success: true,
        message: 'Module loaded successfully',
        module: this.loadedModules.get(moduleId)
      };
    } catch (error) {
      console.error(`Failed to load module ${moduleId}:`, error);

      // Update registry status
      await this.libraryService.updateModuleStatus(moduleId, {
        loaded: false,
        initialized: false,
        healthy: false
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      // Guaranteed cleanup on every exit path (success, early return, or thrown
      // error) so the circular-dependency guard never leaves a moduleId stuck
      // marked "in progress" after this call is actually done with it.
      this.loadingInProgress.delete(moduleId);
    }
  }

  /**
   * Execute module operation
   */
  async execute(moduleId, operation, parameters = {}, context = {}) {
    try {
      console.log(`Executing operation ${operation} on module ${moduleId}`);
      
      // Ensure module is loaded
      if (!this.loadedModules.has(moduleId)) {
        const loadResult = await this.load(moduleId);
        if (!loadResult.success) {
          return {
            success: false,
            error: `Failed to load module ${moduleId}`
          };
        }
      }

      const moduleData = this.loadedModules.get(moduleId);
      const moduleInstance = moduleData.instance;

      // Execute operation
      const startTime = Date.now();
      const result = await moduleInstance.execute(operation, parameters, context);
      const executionTime = Date.now() - startTime;

      // Add execution metadata
      if (result.success) {
        result.metadata = {
          ...result.metadata,
          operation: operation,
          moduleId: moduleId,
          executionTime: `${executionTime}ms`,
          timestamp: new Date().toISOString()
        };
      }

      console.log(`Operation ${operation} completed in ${executionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`Failed to execute operation ${operation} on module ${moduleId}:`, error);
      
      return {
        success: false,
        error: {
          code: 'MODULE_EXECUTION_ERROR',
          message: error.message,
          operation: operation,
          moduleId: moduleId,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Unload module from memory
   */
  async unload(moduleId) {
    try {
      console.log(`Unloading module: ${moduleId}`);
      
      if (!this.loadedModules.has(moduleId)) {
        return {
          success: true,
          message: 'Module not loaded'
        };
      }

      const moduleData = this.loadedModules.get(moduleId);
      const moduleInstance = moduleData.instance;

      // Shutdown module if method exists
      if (typeof moduleInstance.shutdown === 'function') {
        await moduleInstance.shutdown();
      }

      // Remove from loaded modules
      this.loadedModules.delete(moduleId);

      // Update registry status
      await this.libraryService.updateModuleStatus(moduleId, {
        loaded: false,
        initialized: false,
        healthy: false
      });

      console.log(`Module ${moduleId} unloaded successfully`);
      
      return {
        success: true,
        message: 'Module unloaded successfully'
      };
    } catch (error) {
      console.error(`Failed to unload module ${moduleId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get module health status
   */
  async getHealth(moduleId) {
    try {
      if (!this.loadedModules.has(moduleId)) {
        return {
          success: false,
          error: 'Module not loaded'
        };
      }

      const moduleData = this.loadedModules.get(moduleId);
      const moduleInstance = moduleData.instance;

      if (typeof moduleInstance.healthCheck === 'function') {
        const health = await moduleInstance.healthCheck();
        return {
          success: true,
          health: health
        };
      }

      return {
        success: true,
        health: {
          status: 'unknown',
          message: 'Health check not implemented'
        }
      };
    } catch (error) {
      console.error(`Failed to get health for module ${moduleId}:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    return {
      library: this.libraryService.getStatistics(),
      loadedModules: this.loadedModules.size,
      cachedModules: this.moduleCache.size,
      executionQueueSize: this.executionQueue.size
    };
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules() {
    return Array.from(this.loadedModules.entries()).map(([id, data]) => ({
      moduleId: id,
      info: data.info,
      loadedAt: data.loadedAt
    }));
  }

  /**
   * Check if module is loaded
   */
  isLoaded(moduleId) {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Execute multi-module workflow
   */
  async executeWorkflow(workflowSteps, context = {}) {
    const results = [];
    
    for (const step of workflowSteps) {
      const { moduleId, operation, parameters } = step;
      
      const result = await this.execute(moduleId, operation, parameters, context);
      results.push({
        step: step,
        result: result
      });

      if (!result.success) {
        console.error(`Workflow failed at step: ${operation} on ${moduleId}`);
        break;
      }
    }

    return {
      success: results.every(r => r.result.success),
      results: results
    };
  }
}

module.exports = ModuleRegistry;