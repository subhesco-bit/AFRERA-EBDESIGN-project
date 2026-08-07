# EVGA CAP Mapping — Initial Snapshot

Target CAP range noted in EVGA Phase 13: CAP-076 .. CAP-288

Files that reference CAP- identifiers (initial scan):

- EVGA_FINAL_Deliverables.md
- EVGA_PHASE13_Enhanced_Evidence_Verification.md
- EVGA_PHASE11_Expanded_Enterprise_Platforms_Audit.md
- EVGA_PHASE4_Evidence_Based_Verification.md
- EVGA_PHASE8_AI_Verification.md
- EVGA_PHASE3_Master_Capability_Repository.md
- EVGA_PHASE7_Traceability_Matrix.md
- EVGA_PHASE14_Enhanced_Heat_Maps.md
- EVGA_PHASE13_REVERIFIED_2026-08-03.md
- EVGA_PHASE6_Heat_Maps.md
- EVGA_PHASE5_Problem_Detection.md
- backend\eslint-report.json
- backend\src\services\aiCopilotService.js
- backend\src\services\institutionalProcurementService.js
- backend\src\services\indigenousKnowledgeService.js
- backend\src\services\biodiversityService.js
- backend\src\services\foodSafetyService.js
- backend\src\services\multilingualService.js
- backend\src\services\digitalProductPassportService.js
- backend\src\database\indigenous_knowledge_schema.sql
- backend\src\database\food_safety_schema.sql
- backend\src\database\biodiversity_schema.sql
- backend\src\database\omnichannel_ai_schema.sql
- backend\src\database\ai_copilot_schema.sql
- backend\src\database\multilingual_schema.sql
- backend\src\database\digital_product_passport_schema.sql
- backend\src\database\institutional_procurement_schema.sql
- backend\src\database\shelf_life_schema.sql
- backend\src\database\recipe_intelligence_schema.sql
- backend\src\database\migrations\016_ai_copilot_schema.sql
- backend\src\database\migrations\018_biodiversity_schema.sql
- backend\src\database\migrations\022_digital_product_passport_schema.sql
- backend\src\database\migrations\025_food_safety_schema.sql
- backend\src\database\migrations\029_indigenous_knowledge_schema.sql
- backend\src\database\migrations\030_institutional_procurement_schema.sql
- backend\src\database\migrations\035_multilingual_schema.sql
- backend\src\database\migrations\037_omnichannel_ai_schema.sql
- backend\src\database\migrations\040_recipe_intelligence_schema.sql
- backend\src\services\omnichannelAIService.js
- backend\src\database\migrations\043_shelf_life_schema.sql
- backend\src\services\recipeIntelligenceService.js
- backend\src\services\shelfLifeService.js

Next steps (automated):
1. Extract unique CAP- IDs from the files above and produce a CSV: cap_id,first_mentioned_in_file,occurrence_count
2. For each CAP ID, grep the repo to find code locations mentioning or implementing the capability; mark as FOUND / MISSING.
3. Add per-CAP remediation todos (evga:cap-XXX) into the session todos table with acceptance criteria.

This file is an initial snapshot to be refined by automated extraction in the next step.
