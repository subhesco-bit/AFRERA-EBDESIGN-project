/**
 * COMPLETE IDE, COPILOT & DEVIN INTEGRATION
 * ==========================================
 * VS Code, Visual Studio Copilot, and Devin AI files integration
 */

'use strict';

/**
 * ============================================================================
 * VS CODE SETTINGS & CONFIGURATION
 * ============================================================================
 */

const vscodeSettings = {
  // .vscode/settings.json
  settings: {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "editor.wordWrap": "on",
    "editor.minimap.enabled": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
      "source.organizeImports": true
    },
    
    // File associations
    "files.associations": {
      "*.env": "dotenv",
      "*.test.js": "javascript",
      "*.spec.js": "javascript",
      ".babelrc": "json",
      ".eslintrc": "json"
    },
    
    // Exclude patterns
    "files.exclude": {
      "**/.git": true,
      "**/.svn": true,
      "**/.hg": true,
      "**/CVS": true,
      "**/.DS_Store": true,
      "**/node_modules": true,
      "**/*.bak": true,
      "**/*.log": true
    },
    
    // Search exclude
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true,
      "**/coverage": true,
      "**/.git": true
    },
    
    // Git
    "git.ignoreLimitWarning": true,
    "git.autofetch": true,
    
    // Eslint
    "eslint.validate": ["javascript", "javascriptreact"],
    "eslint.format.enable": true,
    
    // Prettier
    "prettier.semi": true,
    "prettier.singleQuote": true,
    "prettier.trailingComma": "es5",
    
    // Extensions
    "npm.packageManager": "npm",
    "npm.autoDetect": "on",
    
    // Terminal
    "terminal.integrated.defaultProfile.windows": "PowerShell",
    "terminal.integrated.fontSize": 13,
    
    // Debug
    "debug.console.fontSize": 13,
    "debug.openDebug": "neverOpen"
  },

  // .vscode/extensions.json
  extensions: {
    recommendations: [
      "esbenp.prettier-vscode",
      "dbaeumer.vscode-eslint",
      "github.copilot",
      "github.copilot-chat",
      "ms-dotnettools.vscode-dotnet-runtime",
      "ms-vscode-remote.remote-wsl",
      "ms-vscode.remote-explorer",
      "eamodio.gitlens",
      "ms-vscode.makefile-tools",
      "ms-vscode-docker.remote-containers",
      "redhat.vscode-yaml",
      "ms-azuretools.vscode-docker",
      "postman.postman-for-vscode",
      "humao.rest-client",
      "ms-playwright.playwright",
      "formulahendry.code-runner",
      "wayou.vscode-todo-highlight",
      "gruntfuggly.todo-tree",
      "ms-vscode.vscode-typescript-next",
      "christian-kohler.path-intellisense",
      "alefragnani.bookmarks",
      "eamodio.gitlens"
    ]
  },

  // .vscode/launch.json (debugging)
  launch: {
    version: "0.2.0",
    configurations: [
      {
        type: "node",
        request: "launch",
        name: "Launch Backend",
        program: "${workspaceFolder}/backend/src/index.js",
        restart: true,
        console: "integratedTerminal"
      },
      {
        type: "node",
        request: "launch",
        name: "Launch Tests",
        program: "${workspaceFolder}/node_modules/.bin/jest",
        args: ["--runInBand"],
        console: "integratedTerminal"
      }
    ]
  },

  // .vscode/tasks.json
  tasks: {
    version: "2.0.0",
    tasks: [
      {
        label: "npm: install",
        type: "shell",
        command: "npm",
        args: ["install"],
        problemMatcher: []
      },
      {
        label: "npm: test",
        type: "shell",
        command: "npm",
        args: ["test"],
        problemMatcher: ["$jshint"]
      },
      {
        label: "npm: build",
        type: "shell",
        command: "npm",
        args: ["run", "build"],
        problemMatcher: []
      },
      {
        label: "Docker: build",
        type: "shell",
        command: "docker-compose",
        args: ["build"],
        problemMatcher: []
      },
      {
        label: "Docker: up",
        type: "shell",
        command: "docker-compose",
        args: ["up", "-d"],
        problemMatcher: []
      }
    ]
  }
};

/**
 * ============================================================================
 * GITHUB COPILOT CONFIGURATION
 * ============================================================================
 */

const copilotConfig = {
  // .copilot/config.json
  config: {
    enabled: true,
    language: "javascript",
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.95,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    
    // Copilot chat
    chat: {
      enabled: true,
      model: "gpt-4",
      context: ["editor", "selection", "workspace"],
      autoSuggest: true,
      debounceTime: 300
    },
    
    // Code completion
    completion: {
      enabled: true,
      multiline: true,
      autoTrigger: true,
      debounceTime: 300,
      minChars: 2
    }
  },

  // Instructions for Copilot
  instructions: {
    codeStyle: {
      quote: "single",
      semi: true,
      indent: 2,
      maxLineLength: 100,
      trailingComma: true
    },
    
    codePatterns: {
      errorHandling: "Always wrap async functions with try-catch",
      validation: "Always validate input at function start",
      logging: "Use logger service for all logs",
      testing: "Write tests for every function",
      comments: "Add JSDoc comments to all functions"
    },
    
    naming: {
      variables: "camelCase",
      constants: "UPPER_SNAKE_CASE",
      classes: "PascalCase",
      files: "kebab-case",
      folders: "kebab-case"
    },
    
    architecture: {
      layers: ["routes", "controllers", "services", "repositories", "database"],
      imports: "Use absolute imports from src root",
      dependencies: "Inject dependencies in constructor",
      separation: "No business logic in controllers"
    }
  }
};

/**
 * ============================================================================
 * DEVIN AI INTEGRATION
 * ============================================================================
 */

const devinConfig = {
  // .devin/config.json
  config: {
    name: "EBDESIGN Platform Devin",
    version: "1.0.0",
    description: "AI-powered development assistant for EBDESIGN",
    
    // Devin capabilities
    capabilities: {
      codeGeneration: true,
      debugging: true,
      testing: true,
      documentation: true,
      refactoring: true,
      deployment: true
    },
    
    // Devin workspace
    workspace: {
      root: "./",
      sources: ["backend/src", "frontend/src"],
      tests: ["backend/__tests__", "frontend/__tests__"],
      docs: ["docs", "README.md"]
    },
    
    // Devin rules
    rules: {
      codeReview: true,
      testing: true,
      documentation: true,
      security: true,
      performance: true
    }
  },

  // .devin/prompts.json
  prompts: {
    systemPrompt: `You are Devin, an AI coding assistant for EBDESIGN Platform.
    
    EBDESIGN is an enterprise agricultural marketplace with AI/ERP integration.
    
    When helping with code:
    1. Follow project structure: api/v1, modules, libs, database, middleware
    2. Use dependency injection for all services
    3. Implement comprehensive error handling
    4. Add logging using logger service
    5. Write tests for all functions
    6. Use TypeScript types where applicable
    7. Follow REST API conventions
    8. Implement proper authentication/authorization
    9. Add JSDoc comments
    10. Consider performance and scalability
    
    Technologies:
    - Backend: Node.js, Express, PostgreSQL, Redis
    - Frontend: React, Axios, Redux/Zustand
    - DevOps: Docker, Docker Compose
    - Testing: Jest, React Testing Library`,
    
    tasks: {
      bugFix: "Identify the bug, explain the cause, provide fix, add test",
      featureImplementation: "Understand requirements, design solution, implement, test, document",
      refactoring: "Analyze code quality, suggest improvements, implement, verify",
      testing: "Create comprehensive test cases with >80% coverage",
      documentation: "Generate clear, complete documentation with examples"
    }
  },

  // .devin/knowledge.json
  knowledge: {
    projectStructure: {
      backend: {
        src: {
          api: "REST API endpoints",
          modules: "Business logic modules",
          libs: "Shared libraries",
          database: "Database connections",
          middleware: "Express middleware",
          services: "Core services",
          routes: "Route definitions",
          controllers: "Request handlers"
        }
      },
      frontend: {
        src: {
          pages: "Page components",
          components: "Reusable components",
          hooks: "Custom hooks",
          context: "Context providers",
          services: "API clients",
          stores: "State management",
          styles: "CSS/styling"
        }
      }
    },
    
    coreModules: [
      "agriculture", "marketplace", "financial-services", 
      "supply-chain", "erp", "ai-backbone"
    ],
    
    dependencies: {
      production: ["express", "pg", "redis", "axios", "react"],
      development: ["jest", "eslint", "prettier", "nodemon"],
      devOps: ["docker", "docker-compose"]
    }
  }
};

/**
 * ============================================================================
 * UNIFIED IDE WORKSPACE CONFIGURATION
 * ============================================================================
 */

const workspaceConfig = {
  // EBDESIGN.code-workspace
  folders: [
    {
      path: ".",
      name: "EBDESIGN Platform"
    },
    {
      path: "backend",
      name: "Backend"
    },
    {
      path: "frontend",
      name: "Frontend"
    },
    {
      path: "docs",
      name: "Documentation"
    }
  ],
  
  settings: {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "[javascript]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[json]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  
  launch: {
    version: "0.2.0",
    configurations: [
      {
        name: "Debug Backend",
        type: "node",
        request: "launch",
        program: "${workspaceFolder:Backend}/src/index.js",
        restart: true,
        console: "integratedTerminal"
      }
    ]
  },
  
  tasks: {
    version: "2.0.0",
    tasks: [
      {
        label: "Start Dev Environment",
        type: "shell",
        command: "docker-compose",
        args: ["up", "-d"],
        isBackground: true
      },
      {
        label: "Run Tests",
        type: "shell",
        command: "npm",
        args: ["test"],
        problemMatcher: ["$jest"]
      }
    ]
  }
};

/**
 * ============================================================================
 * AI AGENT CONFIGURATION
 * ============================================================================
 */

const aiAgentConfig = {
  // .ai/agent-config.json
  config: {
    agents: {
      copilot: {
        enabled: true,
        provider: "github",
        model: "gpt-4",
        capabilities: ["completion", "chat", "refactoring"]
      },
      devin: {
        enabled: true,
        provider: "devin",
        capabilities: ["coding", "debugging", "testing", "deployment"]
      },
      claude: {
        enabled: true,
        provider: "anthropic",
        model: "claude-3-sonnet",
        capabilities: ["analysis", "planning", "architecture"]
      }
    },
    
    // Agent orchestration
    orchestration: {
      primaryAgent: "devin",
      fallbackAgent: "copilot",
      analysisAgent: "claude",
      autoRoute: true
    },
    
    // Shared knowledge
    knowledge: {
      projectName: "EBDESIGN Platform",
      techStack: ["Node.js", "React", "PostgreSQL", "Docker"],
      architecture: "Microservices with Monorepo",
      codeStyle: "ESLint + Prettier"
    }
  },

  // .ai/prompts/system.md
  systemPrompt: `You are an AI agent helping develop EBDESIGN Platform.

CORE PRINCIPLES:
1. Follow established code patterns
2. Maintain security best practices
3. Ensure comprehensive testing
4. Write clear documentation
5. Consider performance implications

PROJECT CONTEXT:
- Multi-module agricultural marketplace
- AI/ERP integration
- Enterprise-scale requirements
- Production-ready code standards

WHEN ASSISTING:
1. Understand the complete context
2. Follow project structure conventions
3. Suggest improvements when appropriate
4. Always include tests
5. Document your changes
6. Consider edge cases`,

  // .ai/prompts/tasks.md
  taskPrompts: {
    bugFix: `Fix the reported bug:
    1. Reproduce the issue
    2. Identify root cause
    3. Implement fix
    4. Add regression test
    5. Document the fix`,
    
    feature: `Implement new feature:
    1. Understand requirements
    2. Design solution
    3. Implement with tests
    4. Add documentation
    5. Code review preparation`,
    
    refactor: `Refactor existing code:
    1. Analyze current code
    2. Identify improvements
    3. Implement changes
    4. Verify tests pass
    5. Document improvements`,
    
    test: `Create comprehensive tests:
    1. Understand code behavior
    2. Write unit tests
    3. Write integration tests
    4. Achieve >80% coverage
    5. Document test strategy`,
    
    deploy: `Prepare for deployment:
    1. Run full test suite
    2. Check security
    3. Verify performance
    4. Create deployment plan
    5. Document deployment`
  }
};

/**
 * ============================================================================
 * EXPORT ALL CONFIGURATIONS
 * ============================================================================
 */

module.exports = {
  vscodeSettings,
  copilotConfig,
  devinConfig,
  workspaceConfig,
  aiAgentConfig,
  
  // Summary
  summary: {
    vscode: "Complete VS Code setup with extensions and settings",
    copilot: "GitHub Copilot configuration and instructions",
    devin: "Devin AI integration with prompts and knowledge",
    workspace: "Unified workspace configuration",
    aiAgent: "Multi-agent AI orchestration",
    status: "All IDE configurations ready for implementation"
  }
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  IDE, COPILOT & DEVIN INTEGRATION CONFIGURATION               ║
║  ✅ VS Code settings ready                                     ║
║  ✅ GitHub Copilot configured                                 ║
║  ✅ Devin AI integrated                                        ║
║  ✅ Workspace unified                                          ║
║  ✅ AI agents orchestrated                                     ║
╚════════════════════════════════════════════════════════════════╝
`);
