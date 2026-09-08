# CURRENT SYSTEM BASELINE

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Audit Date:** 1 September 2026  
**Purpose:** Factual baseline of actual constructed system

## Executive Summary

This document provides a factual baseline of the current system state based on actual file counts, service implementations, and code inspection. This serves as the ground truth for the comprehensive audit.

## File Count Baseline

### Backend Source Files
- **Total backend files:** 1,383 files (including all subdirectories)
- **Service files:** 231 JavaScript service files
- **Route files:** 126 JavaScript route files  
- **Migration files:** 350 SQL migration files
- **Service directories:** 8 main service directories

### Frontend Source Files
- **Total frontend files:** 742 JSX files
- **Page components:** 210 page components
- **UI components:** 74 UI components

### Database
- **Total migrations:** 350 SQL files
- **Executed migrations:** 0 (PostgreSQL not running)
- **Documented tables:** 523+ tables

## Service Architecture Baseline

### Service Organization

**Root Services (14 files):**
1. advancedAnalyticsService.js (10,897 bytes)
2. advancedSearchService.js (8,471 bytes)
3. advancedVoiceAI.js (23,820 bytes)
4. aiAgentService.js (14,821 bytes)
5. aiCollaborationService.js (157 bytes)
6. aiFeedbackService.js (5,849 bytes)
7. blockchainVerificationService.js (15,576 bytes)
8. digitalTwinService.js (21,613 bytes)
9. enterpriseIntegrationService.js (23,154 bytes)
10. iotIntegrationService.js (13,953 bytes)
11. libraryKnowledgeService.js (767 bytes)
12. predictiveIntelligenceService.js (14,858 bytes)
13. unifiedConfigService.js (163 bytes)
14. websocketService.js (5,426 bytes)

**Claude Services (12 files):**
1. aiAgentService.js (9,924 bytes)
2. aiCollaborationService.js (11,291 bytes)
3. aiCoordinationService.js (9,802 bytes)
4. aiCopilotService.js (7,110 bytes)
5. aiDecisionService.js (19,869 bytes)
6. aiOptimizationService.js (9,346 bytes)
7. aiProviderService.js (13,882 bytes)
8. aiRecoveryService.js (8,975 bytes)
9. aiStrategyService.js (5,527 bytes)
10. enhancedLibraryKnowledgeService.js (27,242 bytes)
11. financialAIService.js (9,173 bytes)
12. insuranceAIService.js (5,699 bytes)
13. logisticsAIService.js (5,852 bytes)
14. orderAIService.js (2,631 bytes)
15. productAIService.js (6,042 bytes)
16. unifiedConfigService.js (9,108 bytes)

**Dual-Use Services (4 files):**
1. authService.js (39,604 bytes)
2. gdprService.js (8,067 bytes)
3. mfaService.js (3,296 bytes)
4. platformCoreService.js (5,716 bytes)

**Legacy Services (180+ files):**
The legacy directory contains the bulk of historical services including:
- AI services (aiBackboneService, aiBrainService, aiGatewayService, etc.)
- Business services (financialService, insuranceService, logisticsService, etc.)
- Domain services (farmerService, greenhouseService, fisheriesService, etc.)
- Integration services (erpService, iotIntegrationService, etc.)
- Specialized services (goatService, sheepService, poultryService, etc.)

**Strategic Services (4 files):**
1. contractFarmingService.js (27,061 bytes)
2. governmentSubsidyService.js (35,770 bytes)
3. householdProcurementService.js (24,440 bytes)
4. preSeasonPurchaseService.js (26,621 bytes)

**Specialized Services:**
- Energy: EnergyCostCalculator.js (10,106 bytes)
- Food: FoodIntelligenceEngine.js (13,381 bytes)

## Route Architecture Baseline

**Total Route Files:** 126 route files

**Route Categories:**
- AI-related routes (15+ files): aiAgentRoutes, aiBackboneRoutes, aiBrainRoutes, aiCollaborationRoutes, etc.
- Business routes (30+ files): farmerRoutes, cropManagementRoutes, dairyRoutes, fisheriesManagementRoutes, etc.
- Integration routes (20+ files): enterpriseIntegrationRoutes, ecommerceIntegrationRoutes, iotIntegrationRoutes, etc.
- Analytics routes (10+ files): advancedAnalyticsRoutes, analyticsReportRoutes, predictiveIntelligenceRoutes, etc.
- Platform routes (15+ files): platformCoreRoutes, platformTelemetryRoutes, systemAdministrationRoutes, etc.
- Specialized routes (various): goatRoutes, sheepRoutes, poultryRoutes, mushroomService, etc.

## Database Architecture Baseline

**Migration Files:** 350 SQL migration files organized as:
- Core schema migrations (72+ files)
- Domain-specific migrations (20+ files)
- AI integration migrations (4 files)
- Security/compliance migrations (2 files)
- Platform core migrations (1 file)

**Status:** All migrations created, NONE executed (PostgreSQL not running)

## Frontend Architecture Baseline

**Page Components:** 210 page components across:
- Dashboard pages (15/20 complete)
- User management (10/10 complete)
- Product management (12/12 complete)
- Order processing (15/15 complete)
- Financial services (8/12 complete)
- Farmer portal (18/25 complete)
- Settings (5/8 complete)
- Reports (0/20 complete)

**UI Components:** 74 UI components including:
- AI components (AIChat, AICollaborationDashboard)
- Security components (MFASetup, GDPRConsent)
- Platform components (PlatformDashboard, LibraryBrowser)

## AI Integration Baseline

**Implemented AI Services:**
- Claude AI coordinator (core/claudeAICoordinator.js)
- Library knowledge service (services/libraryKnowledgeService.js)
- AI collaboration service (services/aiCollaborationService.js)
- Multiple specialized AI services in services/claude/ directory
- Historical AI services in services/legacy/ directory

**Status:** Services implemented, Claude API key not configured

## Critical Observations

1. **Service Proliferation:** 231 service files indicate significant service sprawl
2. **Route-Service Mismatch:** 126 route files vs 231 service files suggests potential orphan services or missing routes
3. **Migration Inactivity:** 350 migrations created but 0 executed
4. **Test Gap:** Only 1 test file found (authService.test.js)
5. **Legacy vs New:** Clear separation between legacy/ directory and new service organization
6. **Documentation-Code Gap:** Extensive documentation volumes (15) vs actual implementation needs reconciliation

## Known Gaps Identified

1. **Database:** PostgreSQL not running, no migrations executed
2. **Testing:** 0% test coverage (1 test file found)
3. **API Configuration:** Claude API key not configured
4. **Frontend Integration:** New components not routed
5. **Service Initialization:** Services not initialized on startup
6. **Monitoring:** No observability infrastructure

## Next Audit Steps

1. Reconcile documented modules vs implemented services
2. Identify orphan services (services without routes)
3. Identify orphan routes (routes without services)
4. Audit Math.random() usage for fabricated AI outputs
5. Verify actual AI implementation vs stub implementations
6. Map documentation concepts to actual code

---

*This baseline is the factual starting point for the comprehensive audit.*

