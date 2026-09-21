# Codex Feature Merge Matrix

Generated: 2026-09-12T04:36:12.406Z

## Purpose

This report prevents destructive merging. Same filenames can contain different content and different feature ideas, so duplicate names must be renamed in the merge lab before evaluation.

## Summary

- Scanned merge candidates: 64330
- Same-name/different-content conflict files: 46907
- Conflict filename groups: 2702
- Rename plan: `docs/codex-duplicate-rename-plan.csv`
- Conflict evidence: `docs/codex-duplicate-filename-conflicts.csv`

## Merge Rule

1. Copy candidate versions into `_MERGE_LAB/features/<feature>/` using the generated renamed path.
2. Evaluate all versions for UI, API, service logic, database, security, cost, mobile, desktop, and tests.
3. Build one new production version in the canonical project.
4. Run feature tests and production build.
5. Delete or archive temporary merge-lab copies only after the merged feature is proven.

## Top Feature Tracks

| Feature | Files | Sources | Name Conflicts | Frontend | Backend | Database | Action |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| ai-chat-copilot | 9354 | 11 | 7091 | 7 | 19 | 0 | priority-enhancement-track |
| ecommerce-marketplace | 4580 | 15 | 4023 | 39 | 143 | 0 | priority-enhancement-track |
| dietitian-nutrition | 300 | 7 | 253 | 8 | 36 | 0 | priority-enhancement-track |
| dynamic-pricing | 209 | 6 | 191 | 5 | 23 | 0 | priority-enhancement-track |
| farm-costing | 111 | 7 | 96 | 3 | 13 | 0 | priority-enhancement-track |
| ai-image-cartoon | 163 | 9 | 95 | 11 | 22 | 0 | priority-enhancement-track |
| support-misc | 4363 | 6 | 4355 | 0 | 0 | 0 | merge-lab-required |
| database-model | 5642 | 18 | 3867 | 1 | 910 | 9 | full-stack-merge-and-test |
| support-index | 2910 | 8 | 2908 | 0 | 0 | 0 | merge-lab-required |
| support-styles | 1350 | 3 | 1350 | 0 | 0 | 0 | merge-lab-required |
| support-module | 1336 | 3 | 1336 | 0 | 0 | 0 | merge-lab-required |
| docs-readme | 1331 | 7 | 1331 | 0 | 0 | 0 | merge-lab-required |
| support-readme | 1243 | 4 | 1243 | 0 | 0 | 0 | merge-lab-required |
| backend-runtime | 1210 | 1 | 1210 | 0 | 1210 | 0 | merge-lab-required |
| mobile-shell | 561 | 8 | 326 | 12 | 0 | 0 | merge-lab-required |
| security-auth | 463 | 10 | 219 | 13 | 42 | 0 | full-stack-merge-and-test |
| backend-index | 197 | 1 | 197 | 0 | 197 | 0 | merge-lab-required |
| support-package | 185 | 5 | 185 | 0 | 0 | 0 | merge-lab-required |
| support-registry-cache | 167 | 6 | 167 | 0 | 0 | 0 | merge-lab-required |
| backend-module | 167 | 1 | 167 | 0 | 167 | 0 | merge-lab-required |
| frontend-index | 155 | 1 | 155 | 155 | 0 | 0 | merge-lab-required |
| backend-readme | 152 | 1 | 152 | 0 | 152 | 0 | merge-lab-required |
| frontend-readme | 150 | 1 | 150 | 150 | 0 | 0 | merge-lab-required |
| frontend-styles | 150 | 1 | 150 | 150 | 0 | 0 | merge-lab-required |
| support-license | 132 | 1 | 132 | 0 | 0 | 0 | merge-lab-required |
| support-cables | 104 | 3 | 104 | 0 | 0 | 0 | merge-lab-required |
| voice-farmer | 94 | 6 | 90 | 1 | 13 | 0 | full-stack-merge-and-test |
| support-index-d | 71 | 1 | 71 | 0 | 0 | 0 | merge-lab-required |
| support-aibackbone | 50 | 4 | 50 | 0 | 0 | 0 | merge-lab-required |
| public-price-extraction | 83 | 8 | 46 | 1 | 10 | 0 | full-stack-merge-and-test |
| support-compliance | 45 | 3 | 45 | 0 | 0 | 0 | merge-lab-required |
| support-seedvault | 44 | 4 | 44 | 0 | 0 | 0 | merge-lab-required |
| support-aiagent | 43 | 3 | 43 | 0 | 0 | 0 | merge-lab-required |
| support-analytics | 42 | 4 | 42 | 0 | 0 | 0 | merge-lab-required |
| support-completeerpintegration | 41 | 3 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-comprehensiveerp | 41 | 3 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-assetaccounting | 41 | 4 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-systemadministration | 41 | 4 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-projectsystems | 41 | 4 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-animalhealth | 41 | 4 | 41 | 0 | 0 | 0 | merge-lab-required |
| support-agriculturalintelligence | 40 | 3 | 40 | 0 | 0 | 0 | merge-lab-required |
| support-aicollaboration | 40 | 3 | 40 | 0 | 0 | 0 | merge-lab-required |
| support-defensefitnessprep | 39 | 3 | 39 | 0 | 0 | 0 | merge-lab-required |
| support-nervoussystem | 38 | 3 | 38 | 0 | 0 | 0 | merge-lab-required |
| support-farmertraining | 36 | 3 | 36 | 0 | 0 | 0 | merge-lab-required |
| support-livestockmanagement | 36 | 4 | 36 | 0 | 0 | 0 | merge-lab-required |
| support-identitymanagement | 36 | 4 | 36 | 0 | 0 | 0 | merge-lab-required |
| support-rfq | 36 | 3 | 36 | 0 | 0 | 0 | merge-lab-required |
| support-completeaiintegration | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-aioperationintelligence | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-aiselfhealing | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-decisionsupport | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-logisticsenhancement | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-researchanddevelopment | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-sapmodulearchitecture | 35 | 3 | 35 | 0 | 0 | 0 | merge-lab-required |
| support-hr | 33 | 3 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-fisheriesmanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-soilmanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-communitymanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-operationsmanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-watermanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-horticulturemanagement | 33 | 4 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-digitaltwin | 33 | 3 | 33 | 0 | 0 | 0 | merge-lab-required |
| support-climateadvisory | 35 | 4 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-insurance | 32 | 4 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-logistics | 32 | 4 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-advancedfeatures | 32 | 3 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-coldstorage | 32 | 3 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-cooperativeshare | 32 | 3 | 32 | 0 | 0 | 0 | merge-lab-required |
| support-realtimemonitoring | 31 | 3 | 31 | 0 | 0 | 0 | merge-lab-required |
| support-cropvalueresearch | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-platformtelemetry | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-wearableintegration | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-audit | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-farmer | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-freightpooling | 30 | 3 | 30 | 0 | 0 | 0 | merge-lab-required |
| docs-changelog | 30 | 1 | 30 | 0 | 0 | 0 | merge-lab-required |
| support-fertilizerinventory | 29 | 4 | 29 | 0 | 0 | 0 | merge-lab-required |
| support-aibrain | 29 | 3 | 29 | 0 | 0 | 0 | merge-lab-required |
| support-informationsharing | 29 | 3 | 29 | 0 | 0 | 0 | merge-lab-required |
