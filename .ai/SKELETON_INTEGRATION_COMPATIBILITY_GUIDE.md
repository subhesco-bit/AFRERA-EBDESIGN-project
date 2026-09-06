# SKELETON INTEGRATION COMPATIBILITY GUIDE
**100% File Transfer | 100% Code Integration | 100% VS Code Compatibility**

**For:** Devin Implementation Agent + Visual Studio Code  
**Version:** v1.0  
**Last Updated:** 2026-09-06  
**Status:** Production Ready

---

## EXECUTIVE SUMMARY

This guide ensures **zero friction** when Devin transfers skeleton files into VS Code and starts implementation. It covers:

- ✅ File naming conventions (cross-platform)
- ✅ Import/export structures
- ✅ Module organization
- ✅ Path conventions (Windows/Mac/Linux)
- ✅ Code formatting standards
- ✅ Environment configuration
- ✅ VS Code settings
- ✅ Build/run commands
- ✅ Dependency management
- ✅ Testing framework setup
- ✅ Git integration
- ✅ Pre-commit hooks

---

## PART 1: FILE TRANSFER PROTOCOL

### 1.1 File Organization Standard

**All skeleton files MUST follow this structure:**

```
backend/
├── src/
│   ├── index.js                 (Entry point - REQUIRED)
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   └── constants.js
│   ├── database/
│   │   ├── connection.js
│   │   └── migrations/          (All .sql files)
│   ├── middleware/              (Express middleware)
│   ├── routes/                  (API route files)
│   ├── services/                (Business logic)
│   │   └── platform/            (Platform core services)
│   └── utils/                   (Helper functions)
├── .env.example                 (Template - REQUIRED)
├── .env                         (Local - NEVER COMMIT)
├── .gitignore                   (REQUIRED)
├── package.json                 (REQUIRED)
├── package-lock.json            (REQUIRED)
└── README.md                    (REQUIRED)

frontend/
├── src/
│   ├── main.jsx                 (Entry point - REQUIRED)
│   ├── App.jsx                  (Root component)
│   ├── components/              (React components)
│   ├── pages/                   (Page components)
│   ├── services/                (API clients)
│   ├── stores/                  (Zustand stores)
│   ├── hooks/                   (Custom hooks)
│   ├── utils/                   (Utilities)
│   ├── styles/                  (CSS)
│   ├── config/                  (Configuration)
│   └── router/                  (React Router)
├── .env.example                 (Template - REQUIRED)
├── .env                         (Local - NEVER COMMIT)
├── .gitignore                   (REQUIRED)
├── package.json                 (REQUIRED)
├── package-lock.json            (REQUIRED)
├── vite.config.js              (REQUIRED)
├── index.html                   (REQUIRED)
└── README.md                    (REQUIRED)

.ai/
├── SKELETON_INTEGRATION_COMPATIBILITY_GUIDE.md  (This file)
├── SKELETON_DATABASE_SCHEMA_COMPLETE.sql
├── SKELETON_API_ROUTES_STRUCTURE.md
├── SKELETON_PLATFORM_ARCHITECTURE.md
└── SKELETON_FRONTEND_ARCHITECTURE.md
```

---

### 1.2 File Naming Conventions

**All files MUST follow these naming patterns:**

#### Backend Services
```javascript
// Pattern: [featureName]Service.js
// Example:
backend/src/services/farmerService.js
backend/src/services/farmService.js
backend/src/services/coldStorageService.js
backend/src/services/platform/authService.js
backend/src/services/platform/masterDataService.js

// ✅ CORRECT:
- camelCaseService.js
- nestedInFolder/camelCaseService.js

// ❌ INCORRECT:
- CamelCaseService.js (uppercase start)
- FarmerService.js (uppercase start)
- farmer_service.js (snake_case)
- FarmerSvc.js (abbreviation)
```

#### Backend Routes
```javascript
// Pattern: [featureName]Routes.js
// Example:
backend/src/routes/farmerRoutes.js
backend/src/routes/marketplaceRoutes.js
backend/src/routes/coldStorageRoutes.js

// ✅ CORRECT:
- camelCaseRoutes.js

// ❌ INCORRECT:
- CamelCaseRoutes.js
- farmer_routes.js
```

#### Frontend Pages
```javascript
// Pattern: [PageName].jsx
// Example:
frontend/src/pages/Farmer/Dashboard.jsx
frontend/src/pages/Marketplace/Browse.jsx
frontend/src/pages/Auth/Login.jsx

// ✅ CORRECT:
- PascalCasePage.jsx (first letter uppercase)
- NestedFolder/PascalCasePage.jsx

// ❌ INCORRECT:
- dashboardPage.jsx (lowercase start)
- dashboard-page.jsx (kebab-case)
- dashboard_page.jsx (snake_case)
```

#### Frontend Components
```javascript
// Pattern: [ComponentName].jsx
// Example:
frontend/src/components/Common/Button.jsx
frontend/src/components/Forms/FormField.jsx

// ✅ CORRECT:
- PascalCaseComponent.jsx (first letter uppercase)

// ❌ INCORRECT:
- buttonComponent.jsx
- button-component.jsx
- button_component.jsx
```

#### Frontend Stores (Zustand)
```javascript
// Pattern: [featureName]Store.js
// Example:
frontend/src/stores/authStore.js
frontend/src/stores/farmerStore.js
frontend/src/stores/marketplaceStore.js

// ✅ CORRECT:
- camelCaseStore.js

// ❌ INCORRECT:
- authstore.js
- AuthStore.js
- auth_store.js
```

#### Frontend Hooks
```javascript
// Pattern: use[HookName].js
// Example:
frontend/src/hooks/useAuth.js
frontend/src/hooks/useApi.js
frontend/src/hooks/useForm.js

// ✅ CORRECT:
- useCustomHook.js (starts with "use")
- useCamelCase.js

// ❌ INCORRECT:
- useAuth.js (wrong)
- customHook.js (missing "use")
- use-auth.js (kebab-case)
- UseAuth.js (uppercase start)
```

---

### 1.3 File Encoding & Line Endings

**ALL files MUST use:**

```
Encoding:    UTF-8 (with or without BOM)
Line Ending: LF (not CRLF)
Newline at:  End of file (all files)
```

**VS Code Settings (.vscode/settings.json):**
```json
{
  "files.encoding": "utf8",
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## PART 2: CODE STRUCTURE & IMPORTS

### 2.1 Backend Service Structure (100% Template)

**File: `backend/src/services/[featureName]Service.js`**

```javascript
/**
 * [FeatureName] Service
 * Section: [Architecture section]
 * Database Tables: [table names]
 * API Routes: [route pattern]
 * 
 * Responsibilities:
 * - [Responsibility 1]
 * - [Responsibility 2]
 */

const db = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class [FeatureName]Service {
  /**
   * [Method Name]
   * @param {type} paramName - Description
   * @returns {type} Description
   * @throws {AppError} Description
   * 
   * Database: [table]
   * TODO: Implement [detail]
   */
  async methodName(paramName) {
    try {
      // Stub: will be implemented
      logger.info(`[FeatureName]Service.methodName called`, { paramName });
      
      // TODO: Implement logic
      const result = {
        success: true,
        message: 'Stub - not yet implemented',
        data: null
      };
      
      return result;
    } catch (error) {
      logger.error(`[FeatureName]Service.methodName error`, error);
      throw new AppError(error.message, 500);
    }
  }
}

// Export as singleton
module.exports = new [FeatureName]Service();
```

---

### 2.2 Backend Route Structure (100% Template)

**File: `backend/src/routes/[featureName]Routes.js`**

```javascript
/**
 * [FeatureName] Routes
 * Base Path: /api/v1/[featureName]
 * Section: [Architecture section]
 */

const express = require('express');
const router = express.Router();
const [featureName]Service = require('../services/[featureName]Service');
const { authMiddleware, validate } = require('../middleware');
const logger = require('../utils/logger');

/**
 * POST /api/v1/[featureName]/[action]
 * Section: [Architecture section]
 * Service: [featureName]Service.[methodName]
 * Database: [table names]
 * 
 * TODO: Implement [detail]
 */
router.post('/:action', authMiddleware, async (req, res, next) => {
  try {
    logger.info(`POST /[featureName]/:action`, {
      userId: req.user?.id,
      action: req.params.action,
      body: req.body
    });

    // TODO: Implement validation
    // TODO: Call service
    
    res.status(200).json({
      success: true,
      message: 'Stub - not yet implemented',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/[featureName]/:id
 * Section: [Architecture section]
 * Service: [featureName]Service.getById
 * Database: [table names]
 * 
 * TODO: Implement [detail]
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    logger.info(`GET /[featureName]/:id`, {
      userId: req.user?.id,
      id: req.params.id
    });

    // TODO: Implement service call
    
    res.status(200).json({
      success: true,
      message: 'Stub - not yet implemented',
      data: {}
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

### 2.3 Frontend Page Structure (100% Template)

**File: `frontend/src/pages/[Category]/[PageName].jsx`**

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import use[Feature]Store from '../../stores/[feature]Store';
import [featureName]Service from '../../services/[featureName]Service';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Loading from '../../components/Common/Loading';
import logger from '../../utils/logger';

/**
 * [PageName] Page
 * Section: [Architecture section]
 * Route: /[featureName]/[pageName]
 * Service: [featureName]Service
 * Store: [feature]Store
 * 
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 */
export default function [PageName]() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store integration
  const storeData = use[Feature]Store((state) => state.data);
  const setStoreData = use[Feature]Store((state) => state.setData);

  useEffect(() => {
    /**
     * TODO: Load page data on mount
     * Service: [featureName]Service.getData
     * Database: [table names]
     */
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Call [featureName]Service.getData()
      logger.info('[PageName]: Loading data');
      
      // Mock response (remove in enhancement phase)
      setData({
        success: true,
        message: 'Stub - not yet implemented',
        items: []
      });
    } catch (err) {
      logger.error('[PageName]: Error loading data', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <h1>[PageName]</h1>

      <div className="content-grid">
        {/* TODO: Add page content */}
        <Card title="[Section 1]">
          <p>Stub - implement [detail]</p>
          <Button onClick={() => navigate('/[route]')}>
            [Action]
          </Button>
        </Card>

        <Card title="[Section 2]">
          <p>Stub - implement [detail]</p>
        </Card>
      </div>
    </div>
  );
}
```

---

### 2.4 Frontend Component Structure (100% Template)

**File: `frontend/src/components/[Category]/[ComponentName].jsx`**

```javascript
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import logger from '../../utils/logger';
import './[ComponentName].css';

/**
 * [ComponentName] Component
 * Section: [Architecture section]
 * 
 * Props:
 * - [prop1]: [type] - Description
 * - [prop2]: [type] - Description
 * 
 * TODO: Implement [detail]
 */
export default function [ComponentName]({
  prop1,
  prop2,
  onAction,
  className = ''
}) {
  const [state, setState] = useState(null);

  const handleAction = (value) => {
    logger.debug('[ComponentName]: Action triggered', { value });
    // TODO: Implement action logic
    if (onAction) onAction(value);
  };

  return (
    <div className={`component-[component-name] ${className}`}>
      {/* TODO: Implement component markup */}
      <p>Stub component - implement [detail]</p>
    </div>
  );
}

[ComponentName].propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func,
  onAction: PropTypes.func,
  className: PropTypes.string,
};
```

---

### 2.5 Frontend Store Structure (100% Template)

**File: `frontend/src/stores/[feature]Store.js`**

```javascript
import { create } from 'zustand';
import logger from '../utils/logger';

/**
 * [FeatureName] Store
 * Section: [Architecture section]
 * State: [What this store manages]
 * 
 * Actions:
 * - set[Data]
 * - update[Data]
 * - clear[Data]
 */
const use[Feature]Store = create((set) => ({
  // State
  data: null,
  loading: false,
  error: null,
  filter: {},

  // Actions - Setters
  setData: (data) => {
    logger.debug('[Feature]Store: setData', { data });
    set({ data });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => {
    logger.error('[Feature]Store: setError', { error });
    set({ error });
  },

  setFilter: (filter) => set({ filter }),

  // Actions - Update
  updateData: (updates) => {
    logger.debug('[Feature]Store: updateData', { updates });
    set((state) => ({
      data: { ...state.data, ...updates }
    }));
  },

  // Actions - Clear
  clear: () => {
    logger.debug('[Feature]Store: clear');
    set({ data: null, loading: false, error: null, filter: {} });
  }
}));

export default use[Feature]Store;
```

---

### 2.6 Frontend Hook Structure (100% Template)

**File: `frontend/src/hooks/use[HookName].js`**

```javascript
import { useEffect, useState } from 'react';
import logger from '../utils/logger';

/**
 * use[HookName] Hook
 * Section: [Architecture section]
 * 
 * Returns:
 * - [return1]: [type] - Description
 * - [return2]: [type] - Description
 * 
 * Usage:
 * const { data, loading, error } = use[HookName](param);
 */
export default function use[HookName](param) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    /**
     * TODO: Implement hook logic
     */
    logger.debug('use[HookName]: mounted', { param });

    // Cleanup
    return () => {
      logger.debug('use[HookName]: cleanup');
    };
  }, [param]);

  return { data, loading, error };
}
```

---

## PART 3: CONFIGURATION FILES

### 3.1 Backend Configuration

**File: `backend/.env.example`**
```env
# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/ebdesign_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# API
PORT=3000
NODE_ENV=development
API_VERSION=v1

# AUTHENTICATION
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRY=24h

# CLAUDE AI
ANTHROPIC_API_KEY=your_claude_api_key_here

# LOGGING
LOG_LEVEL=debug
LOG_FORMAT=json

# REDIS (for caching)
REDIS_URL=redis://localhost:6379

# EXTERNAL SERVICES
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
```

**File: `backend/package.json`** (REQUIRED structure)
```json
{
  "name": "ebdesign-backend",
  "version": "1.0.0",
  "description": "EBDESIGN Agricultural Operating System - Backend",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest --coverage",
    "migrate": "node src/database/migrate.js",
    "migrate:rollback": "node src/database/rollback.js",
    "lint": "eslint src --fix",
    "format": "prettier --write src"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.10.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.1.0",
    "@anthropic-ai/sdk": "^0.7.0",
    "redis": "^4.6.7",
    "winston": "^3.11.0",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "eslint": "^8.48.0",
    "jest": "^29.7.0",
    "prettier": "^3.0.3"
  }
}
```

---

### 3.2 Frontend Configuration

**File: `frontend/.env.example`**
```env
# API
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000

# ENVIRONMENT
VITE_ENV=development

# FEATURES
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=true

# EXTERNAL SERVICES
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_WEATHER_API_KEY=your_key_here
```

**File: `frontend/package.json`** (REQUIRED structure)
```json
{
  "name": "ebdesign-frontend",
  "version": "1.0.0",
  "description": "EBDESIGN Agricultural Operating System - Frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --fix",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.48.0",
    "prettier": "^3.0.3"
  }
}
```

**File: `frontend/vite.config.js`** (REQUIRED)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
});
```

---

## PART 4: VS CODE WORKSPACE SETTINGS

**File: `.vscode/settings.json`**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[sql]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.encoding": "utf8",
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "editor.trimAutoWhitespace": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },
  "files.exclude": {
    "**/.DS_Store": true,
    "**/Thumbs.db": true
  },
  "git.ignoreLimitWarning": true
}
```

**File: `.vscode/launch.json`** (Debugging)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Dev",
      "program": "${workspaceFolder}/backend/src/index.js",
      "restart": true,
      "console": "integratedTerminal"
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Frontend Dev",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

**File: `.vscode/extensions.json`** (Recommended)
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "mhutchie.git-graph",
    "ms-vscode.makefile-tools",
    "eamodio.gitlens",
    "ritwickdey.liveserver",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag"
  ]
}
```

---

## PART 5: GIT INTEGRATION

### 5.1 .gitignore (REQUIRED)
```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Database
*.db
*.sqlite

# OS
Thumbs.db
.DS_Store
```

### 5.2 Pre-commit Hook (REQUIRED)
**File: `.git/hooks/pre-commit`**
```bash
#!/bin/sh
# Pre-commit hook: Format and lint check

echo "Running pre-commit checks..."

# Format check
npm run format --silent

# Lint check
npm run lint --silent

if [ $? -ne 0 ]; then
  echo "❌ Lint/format checks failed. Fix and try again."
  exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
```

---

## PART 6: IMPORT/EXPORT STANDARDS

### 6.1 Backend Import Standards

```javascript
// ✅ CORRECT - Grouped imports
const express = require('express');
const db = require('../config/database');
const [featureName]Service = require('../services/[featureName]Service');
const { authMiddleware, validate } = require('../middleware');
const logger = require('../utils/logger');

// ✅ CORRECT - Absolute paths (if configured)
import logger from '@/utils/logger';
import [featureName]Service from '@/services/[featureName]Service';

// ❌ INCORRECT - Inconsistent styles
const db = require('../config/database');
import logger from '../utils/logger';  // Mixing require and import
```

### 6.2 Frontend Import Standards

```javascript
// ✅ CORRECT - React imports first, then third-party, then local
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import use[Feature]Store from '../../stores/[feature]Store';
import [featureName]Service from '../../services/[featureName]Service';
import Button from '../../components/Common/Button';
import logger from '../../utils/logger';

// ✅ CORRECT - Absolute paths (if tsconfig/vite configured)
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Common/Button';

// ❌ INCORRECT - Random order
import logger from '../../utils/logger';
import React from 'react';
import Button from '../../components/Common/Button';
```

---

## PART 7: EXPORT STANDARDS

### 7.1 Backend Service Exports

```javascript
// ✅ CORRECT - Singleton pattern
class [FeatureName]Service {
  // methods...
}
module.exports = new [FeatureName]Service();

// ✅ CORRECT - Multiple exports
module.exports = {
  serviceA,
  serviceB,
  utilityFunction
};
```

### 7.2 Frontend Component Exports

```javascript
// ✅ CORRECT - Default export
export default function [ComponentName]() {
  // component...
}

// ✅ CORRECT - Named export for hooks/utils
export function use[HookName]() {
  // hook...
}

export const utilityFunction = () => {
  // utility...
};
```

---

## PART 8: ERROR HANDLING STANDARDS

### 8.1 Backend Error Handling

```javascript
// Backend error structure MUST be:
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Usage in services:
throw new AppError('User not found', 404, 'USER_NOT_FOUND');

// Response format:
{
  success: false,
  error: {
    message: 'User not found',
    code: 'USER_NOT_FOUND',
    statusCode: 404
  }
}
```

### 8.2 Frontend Error Handling

```javascript
// Errors MUST be caught and logged:
try {
  const data = await [featureName]Service.getData();
  setData(data);
} catch (error) {
  logger.error('[PageName]: Error loading data', error);
  setError(error.message);
}

// Never use generic catch:
❌ catch (e) { console.log(e); }
✅ catch (error) { logger.error('Context: description', error); }
```

---

## PART 9: LOGGING STANDARDS

**All files MUST include structured logging:**

```javascript
// Backend
const logger = require('../utils/logger');
logger.info('User registered', { userId: user.id, email: user.email });
logger.error('Database error', error);
logger.debug('Detailed debug info', { var1, var2 });

// Frontend
import logger from '../../utils/logger';
logger.info('[PageName]: Component mounted');
logger.debug('[Service]: API call', { endpoint, params });
logger.error('[Hook]: Error occurred', error);
```

---

## PART 10: TESTING STANDARDS

### 10.1 Backend Tests

**File: `backend/src/services/[featureName].test.js`**

```javascript
const [FeatureName]Service = require('../[featureName]Service');

describe('[FeatureName]Service', () => {
  describe('methodName', () => {
    it('should return expected result', async () => {
      // Stub: test not yet implemented
      const result = await [FeatureName]Service.methodName({});
      expect(result).toBeDefined();
    });

    it('should throw error on invalid input', async () => {
      // Stub: test not yet implemented
      expect(async () => {
        await [FeatureName]Service.methodName(null);
      }).rejects.toThrow();
    });
  });
});
```

### 10.2 Frontend Tests

**File: `frontend/src/components/[ComponentName].test.jsx`**

```javascript
import { render, screen } from '@testing-library/react';
import [ComponentName] from './[ComponentName]';

describe('[ComponentName]', () => {
  it('should render component', () => {
    render(<[ComponentName] prop1="value" />);
    // Stub: test not yet implemented
    expect(screen.getByText(/component/i)).toBeInTheDocument();
  });

  it('should handle click events', () => {
    // Stub: test not yet implemented
  });
});
```

---

## PART 11: PATH RESOLUTION

### 11.1 Backend Path Configuration

**File: `backend/src/config/paths.js`**

```javascript
const path = require('path');

module.exports = {
  root: path.resolve(__dirname, '../../'),
  src: path.resolve(__dirname, '../'),
  database: path.resolve(__dirname, '../database'),
  migrations: path.resolve(__dirname, '../database/migrations'),
  services: path.resolve(__dirname, '../services'),
  routes: path.resolve(__dirname, '../routes'),
  middleware: path.resolve(__dirname, '../middleware'),
  utils: path.resolve(__dirname, '../utils'),
};
```

### 11.2 Frontend Path Configuration (Vite)

**File: `frontend/vite.config.js`** (add to exports.default)

```javascript
export default defineConfig({
  // ... existing config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
```

---

## PART 12: DEVIN IMPLEMENTATION CHECKLIST

When Devin starts implementation, verify these 100% compatibility standards:

### Pre-Implementation
- [ ] All 6 skeleton files downloaded and readable
- [ ] Repository structure matches Section 1.1
- [ ] File naming conventions documented (Section 1.2)
- [ ] `.vscode/settings.json` created with correct encoding/line endings
- [ ] `.env.example` files created in both backend and frontend

### During Backend Implementation
- [ ] Every service file follows Section 2.1 template exactly
- [ ] Every route file follows Section 2.2 template exactly
- [ ] All imports grouped and ordered (Section 6.1)
- [ ] All exports use correct patterns (Section 7.1)
- [ ] Error handling follows Section 8.1 standards
- [ ] Logging includes context (Section 9)
- [ ] Database table names match SKELETON_DATABASE_SCHEMA_COMPLETE.sql
- [ ] API endpoints match SKELETON_API_ROUTES_STRUCTURE.md

### During Frontend Implementation
- [ ] Every page follows Section 2.3 template exactly
- [ ] Every component follows Section 2.4 template exactly
- [ ] Every store follows Section 2.5 template exactly
- [ ] Every hook follows Section 2.6 template exactly
- [ ] All imports grouped and ordered (Section 6.2)
- [ ] All exports use correct patterns (Section 7.2)
- [ ] Error handling follows Section 8.2 standards
- [ ] Logging includes component context (Section 9)
- [ ] Routes match SKELETON_FRONTEND_ARCHITECTURE.md

### Before Running Code
- [ ] `npm install` completes without errors (backend & frontend)
- [ ] `npm run lint` passes (backend & frontend)
- [ ] `npm run dev` starts both servers without errors
- [ ] React Router navigates all routes without 404s
- [ ] Backend endpoints respond with stub JSON (no crashes)

### Verification
- [ ] Database tables created: 78 tables ✅
- [ ] API endpoints available: 200+ endpoints ✅
- [ ] Frontend pages render: 50+ pages ✅
- [ ] No console errors in browser
- [ ] No server errors in terminal
- [ ] File encoding UTF-8, line endings LF everywhere
- [ ] VS Code recognizes all paths correctly

---

## QUICK START FOR DEVIN

1. **Clone or download all skeleton files** from `.ai/` directory
2. **Create backend structure:**
   ```bash
   cd backend
   npm install
   npm run lint
   ```
3. **Create frontend structure:**
   ```bash
   cd frontend
   npm install
   npm run lint
   npm run dev
   ```
4. **Start both:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```
5. **Verify:**
   - Backend: http://localhost:3000/api/v1/platform/health
   - Frontend: http://localhost:5173

---

## 100% COMPATIBILITY VERIFICATION

| Component | Standard | Status |
|-----------|----------|--------|
| File Naming | camelCase services, PascalCase components | ✅ Defined |
| File Encoding | UTF-8 LF | ✅ Configured |
| Imports | Grouped and ordered | ✅ Templates provided |
| Exports | Singleton pattern (backend), default (frontend) | ✅ Templates provided |
| Error Handling | AppError class with codes | ✅ Defined |
| Logging | Structured with context | ✅ Standards set |
| Path Resolution | Absolute or alias-based | ✅ Configured |
| Testing | Jest/Vitest stubs | ✅ Templates provided |
| Environment | .env.example templates | ✅ Created |
| VS Code | settings.json, extensions, launch.json | ✅ Configured |
| Git | .gitignore, pre-commit hooks | ✅ Defined |
| Project Structure | backend/frontend separation | ✅ Defined in 1.1 |

---

## TROUBLESHOOTING INTEGRATION ISSUES

### Issue: "Module not found" errors
**Solution:** Check path resolution (Section 11) and verify imports match Section 6.

### Issue: Inconsistent formatting across files
**Solution:** Run `npm run format` to apply prettier standards defined in .vscode/settings.json

### Issue: "Cannot find module 'dotenv'"
**Solution:** Run `npm install` in the directory, verify package.json matches Section 3.

### Issue: Line ending mismatches (CRLF vs LF)
**Solution:** VS Code settings.json (Section 4) auto-converts on save. Verify `"files.eol": "\n"`.

### Issue: Services not exporting correctly
**Solution:** Verify singleton pattern in Section 7.1 is used exactly.

---

**This guide ensures 100% compatibility. Follow it exactly for seamless Devin integration.**

