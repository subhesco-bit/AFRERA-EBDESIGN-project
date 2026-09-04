# CODEBASE MAP

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Last Updated:** 24 August 2026

## Repository Structure

```
EBDESIGN/
├── backend/                    # Express.js backend microservices
│   ├── src/
│   │   ├── core/              # Core orchestration and AI
│   │   │   └── claudeAICoordinator.js (NEW)
│   │   ├── database/          # Database connection and migrations
│   │   │   ├── connection.js  # PostgreSQL connection pool
│   │   │   ├── migrate.js     # Migration runner
│   │   │   └── migrations/    # 96+ SQL migration files
│   │   ├── middleware/        # Express middleware
│   │   │   └── mfaMiddleware.js (NEW)
│   │   ├── routes/            # API route definitions (107 files)
│   │   │   ├── aiCollaborationRoutes.js (NEW)
│   │   │   ├── gdprRoutes.js (NEW)
│   │   │   ├── libraryRoutes.js (NEW)
│   │   │   ├── mfaRoutes.js (NEW)
│   │   │   ├── platformCoreRoutes.js (MODIFIED)
│   │   │   └── unifiedAIRoutes.js (NEW)
│   │   ├── services/          # Business logic services (140+ files)
│   │   │   ├── aiCollaborationService.js (NEW)
│   │   │   ├── agricultureService.js (NEW)
│   │   │   ├── cropService.js (NEW)
│   │   │   ├── gdprService.js (NEW)
│   │   │   ├── libraryKnowledgeService.js (NEW)
│   │   │   ├── livestockService.js (NEW)
│   │   │   ├── mfaService.js (NEW)
│   │   │   ├── organizationService.js (NEW)
│   │   │   ├── permissionService.js (NEW)
│   │   │   ├── platformCoreService.js (MODIFIED)
│   │   │   ├── roleService.js (NEW)
│   │   │   ├── unifiedConfigService.js (NEW)
│   │   │   ├── userService.js (NEW)
│   │   │   └── villageService.js (NEW)
│   │   ├── utils/             # Utility functions
│   │   └── index.js          # Main entry point (MODIFIED)
│   ├── jest.config.js         # Jest testing configuration (NEW)
│   ├── jest.setup.js          # Jest setup file (NEW)
│   ├── package.json           # Dependencies and scripts (MODIFIED)
│   └── .env                   # Environment variables (NEW)
├── frontend/                   # React 18 frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── AI/           # AI-related components (NEW)
│   │   │   │   ├── AIChat.jsx
│   │   │   │   └── AICollaborationDashboard.jsx
│   │   │   ├── GDPR/         # GDPR components (NEW)
│   │   │   │   └── GDPRConsent.jsx
│   │   │   ├── Library/      # Library components (NEW)
│   │   │   │   └── LibraryBrowser.jsx
│   │   │   ├── MFA/          # MFA components (NEW)
│   │   │   │   └── MFASetup.jsx
│   │   │   └── Platform/     # Platform components (NEW)
│   │   │       └── PlatformDashboard.jsx
│   │   ├── pages/             # Page components (123/150 complete)
│   │   ├── services/          # API client
│   │   ├── store/             # Zustand state management
│   │   └── main.jsx           # Entry point
│   ├── jest.config.js         # Jest testing configuration (NEW)
│   ├── jest.setup.js          # Jest setup file (NEW)
│   ├── package.json           # Dependencies and scripts (MODIFIED)
│   └── vite.config.js         # Vite build configuration
├── _EBDESIGN_LIBRARY/          # Module documentation library
│   ├── 00_CATALOG/            # Library catalog and manifests
│   │   ├── LIBRARY_MANIFEST.json
│   │   ├── CARD_STATUS_INDEX.csv
│   │   └── CARD_TYPE_INDEX.csv
│   ├── 01_MODULES/            # Module cards (524 cards)
│   ├── 99_AUDIT/              # Audit reports
│   └── LARGE_FILE_OPTIMISATION/ # Large file optimization
├── .ai/                       # Shared Claude-Devin intelligence (NEW)
│   ├── PROJECT_CONTEXT.md     # High-level project context
│   ├── AGENT_PROTOCOL.md      # Collaboration protocol
│   ├── architecture/          # Architecture documentation
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── AI_COLLABORATION_ARCHITECTURE.md
│   │   ├── DATABASE_CURRENT_STATE.md
│   │   ├── CODEBASE_MAP.md
│   │   ├── CURRENT_IMPLEMENTATION.md
│   │   ├── DATABASE_ARCHITECTURE.md
│   │   ├── API_AND_INTEGRATIONS.md
│   │   ├── FRONTEND_ARCHITECTURE.md
│   │   ├── BACKEND_ARCHITECTURE.md
│   │   └── ENVIRONMENT_AND_DEPENDENCIES.md
│   ├── requirements/          # Requirements documentation
│   │   └── MASTER_REQUIREMENTS.md
│   ├── decisions/             # Architecture decision records
│   ├── tasks/                 # Active task tracking
│   │   └── ACTIVE.md
│   ├── reviews/               # Code review records
│   ├── handoffs/              # Handoff records
│   │   ├── CLAUDE_INITIAL_HANDOFF.md
│   │   ├── CLAUDE_TO_DEVIN.md
│   │   ├── DEVIN_TO_CLAUDE.md
│   │   └── DATABASE_MIGRATION_BLOCKER.md
│   └── history/               # Implementation history
│       ├── DEVIN_IMPLEMENTATION_BASELINE.md
│       ├── DEVIN_FILE_CHANGE_MAP.md
│       └── IMPLEMENTATION_HISTORY.md
├── .claude/                    # Claude AI configuration
│   ├── CLAUDE.md
│   └── agents/                 # Claude agent definitions
├── .cursor/                    # Cursor IDE configuration
├── .vibecheck/                # VibeCheck quality system
├── config/                    # Configuration files (NEW)
├── DOCUMENTATION/             # 15 documentation volumes
├── database/                  # Database setup scripts (NEW)
├── docker-compose.yml         # Docker Compose configuration (NEW)
├── docker-compose.database.yml # Database Docker Compose (NEW)
├── Dockerfile                 # Docker image (NEW)
├── .env.production            # Production environment template
├── .env.database.example      # Database environment template (NEW)
├── DATABASE_SETUP_GUIDE.md     # Database setup guide (NEW)
├── ENVIRONMENT_SETUP_GUIDE.md # Environment setup guide (NEW)
├── README.md                  # Project README
└── CLAUDE.md                  # Claude entry point (TO BE CREATED)
```

## Backend Directory Map

### `backend/src/core/`
**Purpose:** Core orchestration and AI coordination  
**Files:**
- `claudeAICoordinator.js` - Unified Claude AI orchestration (NEW)

**Dependencies:**
- @anthropic-ai/sdk
- libraryKnowledgeService
- unifiedConfigService
- aiCollaborationService

**Consumers:**
- unifiedAIRoutes.js
- AI chat frontend component

### `backend/src/database/`
**Purpose:** Database connections and migrations  
**Files:**
- `connection.js` - PostgreSQL connection pool
- `migrate.js` - Migration runner with repair heuristics
- `migrations/` - 96+ SQL migration files

**Key Migrations:**
- `000_base_schema.sql` - Base schema
- `mfa_schema.sql` - MFA tables (NEW)
- `gdpr_schema.sql` - GDPR tables (NEW)
- `m001_platform_core_schema.sql` - Platform core (NEW)
- `unified_ai_schema.sql` - Unified AI (NEW)

**Consumers:** All services, backend/src/index.js

### `backend/src/middleware/`
**Purpose:** Express middleware  
**Files:**
- `mfaMiddleware.js` - MFA verification middleware (NEW)

**Consumers:** MFA routes, protected routes

### `backend/src/routes/`
**Purpose:** API route definitions  
**Files:** 107 route files

**New Routes (Today):**
- `aiCollaborationRoutes.js` - AI collaboration endpoints
- `gdprRoutes.js` - GDPR compliance endpoints
- `libraryRoutes.js` - Library knowledge endpoints
- `mfaRoutes.js` - MFA authentication endpoints
- `unifiedAIRoutes.js` - Unified AI endpoints

**Modified Routes:**
- `platformCoreRoutes.js` - Platform core endpoints

**Consumers:** backend/src/index.js

### `backend/src/services/`
**Purpose:** Business logic services  
**Files:** 140+ service files

**New Services (Today):**
- `aiCollaborationService.js` - Devin-Claude collaboration
- `agricultureService.js` - Agriculture management (M022)
- `cropService.js` - Crop management (M023)
- `gdprService.js` - GDPR compliance
- `libraryKnowledgeService.js` - Library integration
- `livestockService.js` - Livestock management (M024)
- `mfaService.js` - Multi-factor authentication
- `organizationService.js` - Organization management (M003)
- `permissionService.js` - Permission management (M005)
- `roleService.js` - Role management (M004)
- `unifiedConfigService.js` - Configuration management
- `userService.js` - User management (M002)
- `villageService.js` - Village management (M021)

**Modified Services:**
- `platformCoreService.js` - Platform core (M001)

**Consumers:** Routes, controllers

## Frontend Directory Map

### `frontend/src/components/`
**Purpose:** Reusable UI components  
**Files:** 50+ component files

**New Components (Today):**
- `AI/AIChat.jsx` - AI chat interface
- `AI/AICollaborationDashboard.jsx` - AI collaboration monitoring
- `GDPR/GDPRConsent.jsx` - GDPR consent management
- `Library/LibraryBrowser.jsx` - Library knowledge browser
- `MFA/MFASetup.jsx` - MFA configuration
- `Platform/PlatformDashboard.jsx` - Platform monitoring

**Consumers:** Pages, main app

### `frontend/src/pages/`
**Purpose:** Page components  
**Files:** 123/150 complete

**Status:** 27 pages remaining

**Consumers:** React Router

## Library Directory Map

### `_EBDESIGN_LIBRARY/`
**Purpose:** Module documentation and knowledge base  
**Structure:**
- `00_CATALOG/` - Catalog and manifests
- `01_MODULES/` - Module cards (524 total)
- `99_AUDIT/` - Audit reports

**Key Files:**
- `LIBRARY_MANIFEST.json` - Library catalog (FIXED TODAY)
- Content hashing system (IMPLEMENTED TODAY)

**Consumers:** libraryKnowledgeService, Claude AI coordinator

## .ai Directory Map

### `.ai/`
**Purpose:** Shared Claude-Devin project intelligence  
**Structure:**
- `PROJECT_CONTEXT.md` - High-level context
- `AGENT_PROTOCOL.md` - Collaboration protocol
- `architecture/` - Architecture documentation
- `requirements/` - Requirements documentation
- `decisions/` - Architecture decision records
- `tasks/` - Active task tracking
- `reviews/` - Code review records
- `handoffs/` - Handoff records
- `history/` - Implementation history

**Status:** FULLY ESTABLISHED TODAY

## Key File Dependencies

### Claude AI Integration Chain
```
claudeAICoordinator.js
  ↓
libraryKnowledgeService.js
  ↓
LIBRARY_MANIFEST.json
  ↓
.ai/PROJECT_CONTEXT.md
```

### AI Collaboration Chain
```
aiCollaborationService.js
  ↓
.ai/handoffs/
  ↓
.ai/tasks/ACTIVE.md
```

### Database Migration Chain
```
migrate.js
  ↓
migrations/*.sql
  ↓
PostgreSQL database
```

### Frontend API Chain
```
Components
  ↓
services/api.js
  ↓
backend/routes/*.js
  ↓
backend/services/*.js
  ↓
database
```

## Critical Entry Points

### Backend Entry Point
**File:** `backend/src/index.js`  
**Purpose:** Express server initialization  
**Mounts:** All routes, Socket.IO, middleware

### Frontend Entry Point
**File:** `frontend/src/main.jsx`  
**Purpose:** React application initialization  
**Mounts:** React Router, state management

### Migration Entry Point
**File:** `backend/src/database/migrate.js`  
**Purpose:** Database migration execution  
**Command:** `npm run migrate`

### Claude Entry Point
**File:** `CLAUDE.md` (TO BE CREATED)  
**Purpose:** Claude AI orientation  
**References:** All .ai documentation

## Safe to Modify

**Generally Safe:**
- `.ai/` directory (documentation only)
- Test files
- New services/routes (M001-M025)
- New frontend components
- Configuration files

**Requires Caution:**
- `backend/src/index.js` (route mounting)
- Core authentication services
- Database migrations (if executed)
- Production environment files

**Do Not Modify Without Review:**
- Historical Devin services (verified working)
- Core database schema migrations
- Authentication/authorization logic
- Existing route definitions (unless broken)

## Known File Issues

**Duplicate Import:**
- `backend/src/core/claudeAICoordinator.js` (line 11) - aiCollaborationService imported twice (FIXED)

**Wrong Directory:**
- `backend/src/services/aiCollaborationService.js` - Uses `.ai_collaboration` instead of `.ai` (FIXED)

## File Creation Pattern

**Backend Services:**
- Location: `backend/src/services/[name]Service.js`
- Pattern: Class with constructor, CRUD methods
- Database: Uses PostgreSQL connection pool
- Export: `module.exports = new ServiceClass()`

**Backend Routes:**
- Location: `backend/src/routes/[name]Routes.js`
- Pattern: Express router with middleware
- Dependencies: Corresponding service
- Export: `module.exports = router`

**Frontend Components:**
- Location: `frontend/src/components/[category]/[name].jsx`
- Pattern: Functional component with hooks
- Dependencies: API client, state management
- Export: `export default ComponentName`

---

*This map provides Claude with a clear understanding of where to look for specific functionality in the codebase.*

