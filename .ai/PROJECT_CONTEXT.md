# PROJECT CONTEXT

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Primary Implementation Agent:** Devin  
**Architectural Agent:** Claude Code/Claude AI  
**Created:** 24 August 2026  
**Last Updated:** 24 August 2026

## Project Overview

Subhesco/EBDESIGN is a comprehensive agricultural digital operating system designed to empower farmers across Northeast India through technology, fair trade practices, and intelligent decision-making. The platform connects farmers directly with consumers, provides financial services, logistics support, insurance coverage, and integrates with enterprise ERP systems.

## Current Implementation Status

### Completed by Devin (Historical Baseline)

**Backend Infrastructure:**
- ✅ Express.js microservices architecture
- ✅ PostgreSQL database with 523 tables
- ✅ MongoDB for document storage
- ✅ Redis caching layer
- ✅ RabbitMQ message queue
- ✅ Elasticsearch search integration
- ✅ JWT authentication system
- ✅ Role-based access control (RBAC)
- ✅ Socket.IO real-time communication
- ✅ 140 backend services implemented
- ✅ 107 route files mounted
- ✅ 200 migration files

**Frontend Infrastructure:**
- ✅ React 18 with Vite build system
- ✅ Zustand state management
- ✅ React Router v6 routing
- ✅ Radix UI component library
- ✅ TailwindCSS styling
- ✅ Axios API client
- ✅ 123/150 frontend pages completed
- ✅ Production build successful

**Recent Devin Work (Today):**
- ✅ npm dependencies installed (backend + frontend)
- ✅ Environment configuration files created
- ✅ Claude AI coordinator integration
- ✅ Library knowledge service implementation
- ✅ AI collaboration service created
- ✅ MFA, GDPR, Platform Core services added
- ✅ Tier 1 skeleton modules started (M002-M025)
- ✅ Library catalog contamination fixed
- ✅ Frontend components created (MFA, GDPR, AI Chat, Platform Dashboard, Library Browser, AI Collaboration Dashboard)

### Integration Work Completed

**Claude AI Integration:**
- ✅ Unified Claude AI coordinator service
- ✅ Library knowledge integration with AI
- ✅ AI collaboration routes and services
- ✅ Frontend AI chat interface
- ✅ AI collaboration dashboard
- ✅ Mutual work tracking between Devin and Claude

**Database Schemas Created:**
- ✅ MFA schema (mfa_schema.sql)
- ✅ GDPR schema (gdpr_schema.sql)
- ✅ Platform Core schema (m001_platform_core_schema.sql)
- ✅ Unified AI schema (unified_ai_schema.sql)

**Library System:**
- ✅ Enhanced library knowledge service with content hashing
- ✅ Library routes and API endpoints
- ✅ Library browser frontend component
- ✅ Catalog contamination fixed
- ✅ Content hashing system implemented

## Current Git State

**Branch:** `audit/ui-api-fix`  
**Status:** Multiple untracked files, several modified files  
**Recent Commits:** 20 commits showing active development on modules, routes, AI integration, and bug fixes

## Project Structure

```
EBDESIGN/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── core/              # Claude AI coordinator
│   │   ├── database/          # Migrations, connections
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes (107 files)
│   │   ├── services/          # Business logic (140 services)
│   │   └── index.js          # Main entry point
│   ├── jest.config.js         # Testing configuration
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   └── main.jsx
│   ├── jest.config.js
│   └── package.json
├── _EBDESIGN_LIBRARY/          # Module documentation library
│   ├── 00_CATALOG/            # Library catalog
│   ├── 01_MODULES/            # Module cards
│   └── 99_AUDIT/              # Audit reports
├── .ai/                       # Shared intelligence (NEW)
│   ├── architecture/
│   ├── requirements/
│   ├── decisions/
│   ├── tasks/
│   ├── reviews/
│   ├── handoffs/
│   └── history/
├── .claude/                    # Claude AI configuration
├── .cursor/                    # Cursor IDE configuration
├── .vibecheck/                # VibeCheck quality system
├── config/                    # Environment configurations
└── DOCUMENTATION/             # 15 documentation volumes
```

## Technology Stack

**Backend:**
- Node.js 20+
- Express.js
- PostgreSQL, MongoDB, Redis, Elasticsearch
- Socket.IO, JWT, OAuth2
- @anthropic-ai/sdk

**Frontend:**
- React 18, Vite
- Zustand, React Router v6
- Radix UI, TailwindCSS
- Axios, Socket.IO client

**DevOps:**
- Docker, Docker Compose
- GitHub Actions CI/CD
- Jest testing framework

## Known Issues and Technical Debt

**Immediate:**
- Database migrations not yet executed
- Some routes may need wiring verification
- Frontend build warning: chunks > 1000 kB
- 27 frontend pages still incomplete
- 94 skeleton modules remaining

**Audit Findings:**
- 95 skeleton modules need full implementation
- 0/150 modules have test evidence
- MFA/security gaps remain
- GDPR compliance needs validation
- Content hashing completion pending
- SIEM/monitoring integration needed

## Shared Goals

**Claude + Devin Collaboration Goals:**
1. Complete all 95 skeleton modules to launch level
2. Execute database migrations
3. Complete remaining 27 frontend pages
4. Achieve full test coverage
5. Validate security and compliance
6. Integrate monitoring and observability
7. Achieve launch readiness with evidence

## Key Architectural Decisions

**Historical (Devin):**
- Microservices architecture chosen for scalability
- PostgreSQL for relational data, MongoDB for documents
- Redis for caching and session management
- Socket.IO for real-time features
- Component-based frontend with Radix UI

**Recent (Claude Integration):**
- Unified Claude AI coordinator for centralized AI orchestration
- Library knowledge service for AI context
- AI collaboration system for Devin-Claude coordination
- Mutual work tracking protocol

## Implementation Priorities

**Highest Priority:**
1. Execute database migrations
2. Complete Tier 1 skeleton modules (M002-M025)
3. Complete remaining frontend pages
4. Implement comprehensive testing
5. Validate security and compliance

**Next Priority:**
1. Complete Tier 2 skeleton modules (M026-M050)
2. Advanced AI features integration
3. Performance optimization
4. Monitoring and observability

## Agent Responsibilities

**Claude (Architecture & Design):**
- System architecture and design decisions
- Requirements interpretation and technical guidance
- Code review and risk analysis
- QA direction and acceptance criteria
- Implementation planning and coordination

**Devin (Implementation):**
- Coding and implementation of approved architecture
- Refactoring and debugging
- Testing and integration
- Build/deployment fixes
- Following Claude's architectural direction

## Handoff Protocol

**Claude → Devin:**
- Architectural decisions and design specs
- Code review feedback and corrections
- Technical guidance and implementation requirements
- Acceptance criteria and testing requirements

**Devin → Claude:**
- Implementation completion reports
- Blockers and technical challenges
- Test results and validation evidence
- Request for architectural guidance

## Continuity Requirements

This project must evolve as ONE continuous Claude + Devin project. No new task should be treated as an isolated project. All future work must:

1. Understand existing code
2. Check project intelligence (.ai/)
3. Check Git history
4. Check Claude decisions
5. Plan with both agents in mind
6. Implement while preserving existing functionality
7. Test thoroughly
8. Document changes
9. Commit with clear messages
10. Hand off for review

---

*This document is the single source of truth for project context and must be updated by both agents as the project evolves.*

