# MODULE INTERFACE SPECIFICATION - "TWO WIRES TO POWER"

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Version:** 1.0  
**Created:** 24 August 2026  
**Status:** PRODUCTION STANDARD

## Overview

This specification defines the standardized "two wires to power" interface that all EBDESIGN modules must implement to enable seamless Claude AI integration. Each module connects to the Claude AI "power center" through two standardized interfaces:

**Wire 1: Discovery Interface** - How Claude AI finds and understands the module  
**Wire 2: Execution Interface** - How Claude AI invokes and interacts with the module

## Wire 1: Discovery Interface

### Purpose
Enables Claude AI to discover, understand, and select modules based on natural language queries, capabilities, and context requirements.

### Required Fields

#### module.json (Root Metadata File)

```json
{
  "moduleId": "M001_PLATFORM_CORE",           // REQUIRED: Unique module identifier
  "version": "1.0.0",                         // REQUIRED: Semantic versioning
  "name": "Platform Core",                    // REQUIRED: Human-readable name
  "description": "Core platform foundation services", // REQUIRED: Functional description
  "category": "platform",                     // REQUIRED: Module category
  "status": "production",                     // REQUIRED: development|staging|production|deprecated
  "dependencies": {                           // REQUIRED: Dependency specification
    "modules": [],                            // Module dependencies
    "services": ["postgresql", "redis"],      // Service dependencies
    "libraries": {                            // Library dependencies
      "backend": ["express", "winston"],
      "frontend": ["react", "zustand"]
    }
  },
  "discovery": {                              // REQUIRED: Discovery metadata
    "keywords": ["platform", "core", "health"], // REQUIRED: Search keywords
    "capabilities": ["health-check", "metrics"], // REQUIRED: Module capabilities
    "aiContext": "Provides platform health monitoring", // REQUIRED: AI context
    "useCases": ["Monitor platform health"]   // OPTIONAL: Use case descriptions
  }
}
```

### Discovery API Contract

#### Natural Language Discovery

```javascript
// Claude AI discovers modules via natural language
const discoveryResult = await ModuleRegistry.discover({
  query: "I need to monitor platform health and collect metrics",
  context: {
    agentType: "platform-admin",
    userId: "user123",
    sessionId: "session456"
  }
});

// Standardized response format
{
  "success": true,
  "modules": [
    {
      "moduleId": "M001_PLATFORM_CORE",
      "name": "Platform Core",
      "matchScore": 0.95,
      "capabilities": ["health-check", "metrics-collection"],
      "aiContext": "Provides platform health monitoring and metrics collection",
      "dependencies": ["postgresql", "redis"],
      "status": "production"
    }
  ],
  "metadata": {
    "totalMatches": 1,
    "searchTime": "45ms",
    "queryProcessed": true
  }
}
```

#### Capability-Based Discovery

```javascript
// Claude AI discovers modules by capability requirements
const capabilityResult = await ModuleRegistry.discoverByCapabilities({
  requiredCapabilities: ["health-check", "metrics-collection"],
  optionalCapabilities: ["configuration-management"],
  context: {
    environment: "production",
    resourceConstraints: {
      "maxMemory": "512MB",
      "maxCpu": "2 cores"
    }
  }
});
```

### Discovery Interface Validation

All modules must pass discovery validation:

```javascript
const validation = await ModuleValidator.validateDiscovery(modulePath);
// Returns:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "metadata": {
    "moduleId": "M001_PLATFORM_CORE",
    "complianceLevel": "full",
    "discoveryReady": true
  }
}
```

## Wire 2: Execution Interface

### Purpose
Enables Claude AI to execute module operations through standardized, predictable interfaces with consistent error handling and response formats.

### Required Implementation Patterns

#### Backend Service Interface

```javascript
class PlatformCoreService {
  /**
   * REQUIRED: Module initialization
   */
  async initialize(config) {
    // Initialize module with configuration
    this.config = config;
    await this.connectToDependencies();
    return { success: true, message: "Module initialized" };
  }

  /**
   * REQUIRED: Health check
   */
  async healthCheck() {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      dependencies: {
        postgresql: "connected",
        redis: "connected"
      }
    };
  }

  /**
   * REQUIRED: Standard execute method for Claude AI
   */
  async execute(operation, parameters, context) {
    try {
      switch(operation) {
        case 'getHealth':
          return await this.getHealth(parameters, context);
        case 'getMetrics':
          return await this.getMetrics(parameters, context);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return this.formatError(error, operation);
    }
  }

  /**
   * REQUIRED: Standard error formatting
   */
  formatError(error, operation) {
    return {
      success: false,
      error: {
        code: error.code || "MODULE_EXECUTION_ERROR",
        message: error.message,
        operation: operation,
        timestamp: new Date().toISOString(),
        moduleId: this.moduleId
      }
    };
  }
}
```

#### Standard Response Format

```javascript
// SUCCESS RESPONSE
{
  "success": true,
  "data": {
    // Operation-specific data
  },
  "metadata": {
    "operation": "getHealth",
    "moduleId": "M001_PLATFORM_CORE",
    "timestamp": "2026-08-24T19:45:00Z",
    "executionTime": "125ms"
  }
}

// ERROR RESPONSE
{
  "success": false,
  "error": {
    "code": "DEPENDENCY_UNAVAILABLE",
    "message": "PostgreSQL connection failed",
    "operation": "getHealth",
    "moduleId": "M001_PLATFORM_CORE",
    "timestamp": "2026-08-24T19:45:00Z",
    "retryable": true,
    "retryAfter": "30s"
  }
}
```

### Execution API Contract

#### Claude AI Module Execution

```javascript
// Claude AI executes module operations
const executionResult = await ModuleRegistry.execute({
  moduleId: "M001_PLATFORM_CORE",
  operation: "getHealth",
  parameters: {
    detailed: true,
    includeDependencies: true
  },
  context: {
    userId: "user123",
    sessionId: "session456",
    agentType: "platform-admin",
    requestId: "req_789"
  }
});

// Standardized execution response
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "45d 12h 30m",
    "dependencies": {
      "postgresql": { "status": "connected", "latency": "5ms" },
      "redis": { "status": "connected", "latency": "2ms" }
    }
  },
  "metadata": {
    "operation": "getHealth",
    "moduleId": "M001_PLATFORM_CORE",
    "timestamp": "2026-08-24T19:45:00Z",
    "executionTime": "125ms"
  }
}
```

### Execution Interface Validation

All modules must pass execution validation:

```javascript
const validation = await ModuleValidator.validateExecution(modulePath);
// Returns:
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "metadata": {
    "moduleId": "M001_PLATFORM_CORE",
    "complianceLevel": "full",
    "executionReady": true,
    "operations": ["getHealth", "getMetrics", "getConfiguration"]
  }
}
```

## Module Lifecycle Management

### Standard Lifecycle States

1. **DISCOVERED** - Module found by discovery interface
2. **LOADED** - Module loaded into memory
3. **INITIALIZED** - Module initialized with configuration
4. **READY** - Module ready for execution
5. **EXECUTING** - Module currently executing operation
6. **ERROR** - Module in error state
7. **SHUTDOWN** - Module gracefully shut down

### Lifecycle API

```javascript
// Load module
await ModuleRegistry.load("M001_PLATFORM_CORE");

// Initialize module
await ModuleRegistry.initialize("M001_PLATFORM_CORE", config);

// Execute module
await ModuleRegistry.execute("M001_PLATFORM_CORE", "getHealth", params, context);

// Shutdown module
await ModuleRegistry.shutdown("M001_PLATFORM_CORE");

// Unload module
await ModuleRegistry.unload("M001_PLATFORM_CORE");
```

## Module Dependencies

### Dependency Declaration

```json
{
  "dependencies": {
    "modules": ["M002_USER_MANAGEMENT", "M003_ORGANIZATION"],
    "services": {
      "postgresql": {
        "version": ">= 15.0",
        "required": true
      },
      "redis": {
        "version": ">= 7.0",
        "required": true
      }
    },
    "libraries": {
      "backend": ["express@^4.18.0", "winston@^3.8.0"],
      "frontend": ["react@^18.2.0", "zustand@^4.3.0"]
    }
  }
}
```

### Dependency Resolution

```javascript
// Automatic dependency resolution
const resolution = await DependencyResolver.resolve("M001_PLATFORM_CORE");
// Returns:
{
  "resolved": true,
  "modules": ["M002_USER_MANAGEMENT", "M003_ORGANIZATION"],
  "services": {
    "postgresql": { "available": true, "version": "15.2" },
    "redis": { "available": true, "version": "7.0" }
  },
  "libraries": {
    "backend": { "express": "4.18.2", "winston": "3.8.2" },
    "frontend": { "react": "18.2.0", "zustand": "4.3.6" }
  }
}
```

## Module Testing Requirements

### Required Test Coverage

```javascript
{
  "testing": {
    "unit": {
      "coverage": ">= 80%",
      "required": ["service.js", "models/*.js"]
    },
    "integration": {
      "coverage": ">= 70%",
      "required": ["api integration", "database integration"]
    },
    "e2e": {
      "coverage": ">= 60%",
      "required": ["critical user flows"]
    }
  }
}
```

### Standard Test Patterns

```javascript
// Unit test example
describe('PlatformCoreService', () => {
  it('should initialize successfully', async () => {
    const service = new PlatformCoreService();
    const result = await service.initialize(testConfig);
    expect(result.success).toBe(true);
  });

  it('should execute getHealth operation', async () => {
    const service = new PlatformCoreService();
    await service.initialize(testConfig);
    const result = await service.execute('getHealth', {}, testContext);
    expect(result.success).toBe(true);
    expect(result.data.status).toBeDefined();
  });
});
```

## Module Documentation Requirements

### Required Documentation Files

```
docs/
├── README.md              # Module overview and quick start
├── ARCHITECTURE.md        # Module architecture and design
├── API.md                 # API documentation
├── CLAUDE_INTEGRATION.md  # Claude AI integration guide
└── TROUBLESHOOTING.md     # Common issues and solutions
```

### Documentation Standards

#### README.md Structure

```markdown
# Module Name

## Quick Start
- Installation instructions
- Basic usage examples
- Configuration options

## Capabilities
- List of module capabilities
- Use case descriptions
- Integration examples

## Claude AI Integration
- Discovery examples
- Execution examples
- Context requirements

## Dependencies
- Required modules
- Required services
- Required libraries
```

## Module Security Requirements

### Security Standards

```javascript
{
  "security": {
    "authentication": {
      "required": true,
      "methods": ["jwt", "oauth2"]
    },
    "authorization": {
      "required": true,
      "roles": ["platform-admin", "devops"]
    },
    "dataProtection": {
      "encryptionAtRest": true,
      "encryptionInTransit": true,
      "sensitiveDataHandling": "strict"
    },
    "auditLogging": {
      "enabled": true,
      "events": ["authentication", "authorization", "data-access"]
    }
  }
}
```

## Module Performance Requirements

### Performance Standards

```javascript
{
  "performance": {
    "responseTime": {
      "p50": "< 100ms",
      "p95": "< 500ms",
      "p99": "< 1000ms"
    },
    "throughput": {
      "requestsPerSecond": "> 1000"
    },
    "resourceLimits": {
      "maxMemory": "512MB",
      "maxCpu": "2 cores"
    }
  }
}
```

## Module Monitoring Requirements

### Monitoring Standards

```javascript
{
  "monitoring": {
    "healthChecks": {
      "enabled": true,
      "interval": "30s"
    },
    "metrics": {
      "enabled": true,
      "types": ["counter", "gauge", "histogram"]
    },
    "logging": {
      "level": "info",
      "format": "json"
    },
    "alerting": {
      "enabled": true,
      "channels": ["email", "slack"]
    }
  }
}
```

## Compliance and Validation

### Module Compliance Checklist

- [ ] Discovery interface implemented (module.json)
- [ ] Execution interface implemented (standard execute method)
- [ ] Standard response format used
- [ ] Error handling implemented
- [ ] Lifecycle management implemented
- [ ] Dependencies declared and resolvable
- [ ] Test coverage meets requirements
- [ ] Documentation complete
- [ ] Security requirements met
- [ ] Performance requirements met
- [ ] Monitoring requirements met

### Validation Tool

```javascript
// Run full module validation
const validation = await ModuleValidator.validateFull(modulePath);
// Returns:
{
  "valid": true,
  "complianceLevel": "full",
  "errors": [],
  "warnings": [],
  "score": 100,
  "details": {
    "discovery": { "valid": true, "score": 100 },
    "execution": { "valid": true, "score": 100 },
    "testing": { "valid": true, "score": 85 },
    "documentation": { "valid": true, "score": 100 },
    "security": { "valid": true, "score": 100 },
    "performance": { "valid": true, "score": 95 },
    "monitoring": { "valid": true, "score": 100 }
  }
}
```

## Summary

The "two wires to power" interface specification ensures that all EBDESIGN modules:

1. **Discoverable** - Claude AI can find and understand them easily
2. **Executable** - Claude AI can invoke them through standardized patterns
3. **Reliable** - Consistent error handling and response formats
4. **Maintainable** - Clear structure and documentation requirements
5. **Scalable** - Standard lifecycle and dependency management
6. **Secure** - Built-in security and monitoring requirements

This specification transforms EBDESIGN into a true plug-and-play system where Claude AI can seamlessly discover, load, and execute modules like appliances connecting to a power outlet.

---

*This specification is the foundation for all EBDESIGN module development and must be strictly followed for Claude AI integration.*
