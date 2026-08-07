# Backend Service Module Mapping

This document enumerates the AFRERA backend service modules, route mount points, and exposed HTTP subroutes as discovered from `backend/src/index.js` and service router definitions. It is aligned to the actual backend implementation, not to the architecture plan alone.

- Total backend service files: 71
- Imported service modules in index.js: 59
- Services with mounted routes via mountRoute/app.use or setupRoutes: 57
- Services with no direct mount or setupRoutes: 2
- Unimported backend service files: 12

## Service Module Mapping

| Service File | Mount Path / Exposure | Route Count | Notes |
|---|---|---|---|
| advancedAIService.js | /api/v1/advanced-ai | 8 | direct mount |
| advancedVoiceAI.js | /api/v1/advanced-voice | 6 | direct mount |
| aiCopilotService.js | /api/v1/ai-copilot | 11 | direct mount |
| aiService.js | /api/v1/ai | 5 | direct mount |
| analyticsService.js | /api/v1/analytics | 3 | direct mount |
| arVrService.js | /api/v1/ar-vr | 10 | direct mount |
| authService.js | /api/v1/auth | 10 | direct mount |
| biodiversityService.js | /api/v1/biodiversity | 17 | direct mount |
| blockchainTraceabilityService.js | /api/v1/blockchain-traceability | 10 | direct mount |
| catalogIntelligenceService.js | /api/v1/catalog-intelligence | 8 | direct mount |
| commerceRulesService.js | /api/v1/commerce-rules | 5 | direct mount |
| consumerHealthService.js | /api/v1/consumer-health | 14 | direct mount |
| conversationalAIService.js | /api/v1/conversational-ai | 10 | direct mount |
| decisionSupportService.js | setupRoutes | 0 | direct mount |
| digitalProductPassportService.js | /api/v1/digital-product-passport | 25 | direct mount |
| dynamicPricingService.js | setupRoutes | 0 | setupRoutes |
| enterpriseControlService.js | /api/v1/control | 13 | direct mount |
| erpService.js | /api/v1/erp | 7 | direct mount |
| farmerService.js | - | 0 | not mounted |
| farmerTrainingService.js | setupRoutes | 0 | setupRoutes |
| farmerValueService.js | /api/v1/value | 5 | direct mount |
| financialService.js | /api/v1/financial | 8 | direct mount |
| foodIntelligenceService.js | /api/v1/food-intelligence | 10 | direct mount |
| foodSafetyService.js | /api/v1/food-safety | 21 | direct mount |
| formService.js | /api/v1/forms | 8 | direct mount |
| giIntelligenceService.js | /api/v1/gi-intelligence | 11 | direct mount |
| governmentSchemeService.js | setupRoutes | 0 | setupRoutes |
| greenhouseService.js | setupRoutes | 0 | setupRoutes |
| gstService.js | - | 0 | not mounted |
| indigenousKnowledgeService.js | /api/v1/indigenous-knowledge | 19 | direct mount |
| institutionalProcurementService.js | /api/v1/institutional-procurement | 16 | direct mount |
| insuranceClaimsService.js | setupRoutes | 0 | setupRoutes |
| insuranceService.js | /api/v1/insurance | 11 | direct mount |
| iotIntegrationService.js | /api/v1/iot-integration | 11 | direct mount |
| knowledgeGraphService.js | /api/v1/knowledge-graph | 7 | direct mount |
| laboratoryERPService.js | /api/v1/laboratory-erp | 13 | direct mount |
| logisticsService.js | /api/v1/logistics | 11 | direct mount |
| merchandisingService.js | /api/v1/merchandising | 10 | direct mount |
| moduleCatalogService.js | /api/v1/modules | 4 | direct mount |
| multilingualService.js | /api/v1/multilingual | 12 | direct mount |
| neProductIntelligenceService.js | /api/v1/ne-intelligence | 6 | direct mount |
| nutritionIntelligenceService.js | /api/v1/nutrition-intelligence | 10 | direct mount |
| offlinePaymentService.js | /api/v1/offline-payment | 10 | direct mount |
| offlineSyncService.js | /api/v1/offline-sync | 8 | direct mount |
| omnichannelAIService.js | /api/v1/omnichannel-ai | 15 | direct mount |
| orderService.js | /api/v1/orders | 10 | direct mount |
| organicTraceabilityService.js | /api/v1/organic-traceability | 13 | direct mount |
| predictiveAnalyticsService.js | /api/v1/predictive-analytics | 9 | direct mount |
| preSeasonOrderService.js | setupRoutes | 0 | setupRoutes |
| productService.js | /api/v1/products | 8 | direct mount |
| recipeIntelligenceService.js | /api/v1/recipe-intelligence | 17 | direct mount |
| sharedInfraService.js | setupRoutes | 0 | setupRoutes |
| shelfLifeService.js | /api/v1/shelf-life | 16 | direct mount |
| smsAuthService.js | /api/v1/sms-auth | 5 | direct mount |
| soilTestingService.js | setupRoutes | 0 | setupRoutes |
| subsidyService.js | setupRoutes | 0 | setupRoutes |
| v42IntelligenceService.js | /api/v1/intel | 11 | direct mount |
| valueCommerceService.js | /api/v1/value-commerce | 8 | direct mount |
| voiceAIService.js | /api/v1/voice-ai | 10 | direct mount |

## Detailed Exposed Routes

### advancedAIService.js (/api/v1/advanced-ai)

| Method | Path |
|---|---|
| POST | /predict-demand |
| POST | /optimize-price |
| POST | /assess-credit-risk |
| POST | /detect-fraud |
| POST | /recommendations |
| POST | /detect-crop-disease |
| GET | /models |
| GET | /health |

### advancedVoiceAI.js (/api/v1/advanced-voice)

| Method | Path |
|---|---|
| POST | /conversation |
| POST | /process |
| GET | /languages |
| GET | /intents |
| POST | /text-query |
| GET | /health |

### aiCopilotService.js (/api/v1/ai-copilot)

| Method | Path |
|---|---|
| POST | /session |
| POST | /session/:id/message |
| GET | /session/:id/history |
| PUT | /session/:id/close |
| GET | /finance/analytics |
| GET | /logistics/routes |
| GET | /warehouse/inventory |
| GET | /insurance/policies |
| GET | /nutrition/analysis |
| GET | /marketplace/trends |
| GET | /analytics |

### aiService.js (/api/v1/ai)

| Method | Path |
|---|---|
| POST | /predict/demand |
| POST | /optimize/price |
| POST | /assess/credit-risk |
| POST | /detect/fraud |
| POST | /recommend |

### analyticsService.js (/api/v1/analytics)

| Method | Path |
|---|---|
| GET | /overview |
| GET | /insights |
| GET | /platform-stats |

### arVrService.js (/api/v1/ar-vr)

| Method | Path |
|---|---|
| POST | /experiences |
| GET | /experiences |
| PATCH | /experiences/:experienceId/publish |
| POST | /assets |
| GET | /assets |
| POST | /interaction-points |
| GET | /experiences/:experienceId/interaction-points |
| POST | /sessions |
| PATCH | /sessions/:sessionId/end |
| POST | /ar-vr-analytics |

### authService.js (/api/v1/auth)

| Method | Path |
|---|---|
| POST | /register |
| POST | /login |
| POST | /refresh |
| POST | /logout |
| POST | /2fa/setup |
| POST | /2fa/verify |
| POST | /2fa/disable |
| GET | /oauth/:provider/url |
| POST | /oauth/:provider/callback |
| GET | /me |

### biodiversityService.js (/api/v1/biodiversity)

| Method | Path |
|---|---|
| POST | /species |
| GET | /species |
| GET | /species/:id |
| POST | /native-crops |
| GET | /native-crops |
| POST | /traditional-varieties |
| GET | /traditional-varieties |
| POST | /medicinal-plants |
| GET | /medicinal-plants |
| POST | /wild-foods |
| GET | /wild-foods |
| POST | /conservation |
| GET | /conservation |
| PUT | /conservation/:id |
| POST | /risk-prediction |
| GET | /risk-predictions |
| GET | /analytics/dashboard |

### blockchainTraceabilityService.js (/api/v1/blockchain-traceability)

| Method | Path |
|---|---|
| POST | /blockchain-transactions |
| GET | /blockchain-transactions/:hash |
| POST | /traceability-events |
| GET | /traceability-events/:productId |
| POST | /chain-of-custody |
| GET | /chain-of-custody/verify/:productId |
| POST | /blockchain-certificates |
| GET | /blockchain-certificates/verify/:certificateNumber |
| POST | /verification-requests |
| POST | /blockchain-analytics |

### catalogIntelligenceService.js (/api/v1/catalog-intelligence)

| Method | Path |
|---|---|
| GET | /in-season |
| GET | /product-calendar |
| GET | /glut-forecast |
| GET | /scarcity-months |
| GET | /wellness |
| GET | /wellness/concerns |
| GET | /explain |
| GET | /glossary |

### commerceRulesService.js (/api/v1/commerce-rules)

| Method | Path |
|---|---|
| GET | /delivery-zone |
| GET | /serviceable-pincodes |
| POST | /subscription-plan |
| POST | /price-freeze |
| POST | /loyalty-redemption |

### consumerHealthService.js (/api/v1/consumer-health)

| Method | Path |
|---|---|
| POST | /health-profiles |
| GET | /health-profiles |
| POST | /dietary-profiles |
| POST | /health-metrics |
| GET | /health-metrics |
| POST | /health-goals |
| GET | /health-goals |
| POST | /dietary-recommendations |
| GET | /dietary-recommendations |
| POST | /health-alerts |
| GET | /health-alerts |
| POST | /food-consumption |
| GET | /health-analytics |
| GET | /bmi |

### conversationalAIService.js (/api/v1/conversational-ai)

| Method | Path |
|---|---|
| POST | /sessions |
| GET | /sessions/:sessionId |
| POST | /sessions/:sessionId/messages |
| GET | /sessions/:sessionId/messages |
| POST | /detect-intent |
| POST | /sessions/:sessionId/respond |
| GET | /domains |
| POST | /sessions/:sessionId/context |
| GET | /sessions/:sessionId/context |
| POST | /sessions/:sessionId/end |

### decisionSupportService.js (setupRoutes)

_No direct router routes found in service file._

### digitalProductPassportService.js (/api/v1/digital-product-passport)

| Method | Path |
|---|---|
| POST | /product-id |
| GET | /product-id/:id |
| POST | /batches |
| GET | /batches |
| POST | /farm-info |
| GET | /farm-info |
| POST | /farmer-info |
| GET | /farmer-info |
| POST | /certification-info |
| GET | /certification-info |
| POST | /processing-history |
| GET | /processing-history |
| POST | /logistics-history |
| GET | /logistics-history |
| POST | /sustainability-data |
| GET | /sustainability-data |
| POST | /carbon-data |
| GET | /carbon-data |
| POST | /quality-reports |
| GET | /quality-reports |
| POST | /recall-status |
| GET | /recall-status |
| POST | /qr-code |
| GET | /qr-code/:id |
| GET | /passport/:product_id/:batch_id |

### dynamicPricingService.js (setupRoutes)

_No direct router routes found in service file._

### enterpriseControlService.js (/api/v1/control)

| Method | Path |
|---|---|
| POST | /workflow/start |
| POST | /workflow/:instanceCode/act |
| GET | /workflow/pending |
| POST | /crm/leads |
| POST | /crm/leads/:leadCode/convert |
| GET | /crm/pipeline |
| GET | /clients/:id/health |
| GET | /legal/calendar |
| POST | /risk/:riskCode/assess |
| GET | /risk/heatmap |
| POST | /emergency/incidents |
| POST | /emergency/incidents/:incidentCode/acknowledge |
| GET | /emergency/active |

### erpService.js (/api/v1/erp)

| Method | Path |
|---|---|
| GET | /status |
| POST | /sync/product |
| POST | /sync/order |
| POST | /sync/farmer |
| POST | /sync/transaction |
| POST | /sync/asset |
| POST | /sync/bulk |

### farmerService.js (not directly mounted)

_No direct router routes found in service file._

### farmerTrainingService.js (setupRoutes)

_No direct router routes found in service file._

### farmerValueService.js (/api/v1/value)

| Method | Path |
|---|---|
| GET | /farmers/:farmerId/value-index |
| POST | /farmers/:farmerId/value-index/compute |
| GET | /farmers/:farmerId/unclaimed-support |
| GET | /farmers/:farmerId/cash-flow |
| GET | /farmers/:farmerId/ledger |

### financialService.js (/api/v1/financial)

| Method | Path |
|---|---|
| POST | /loans |
| GET | /loans/farmer/:farmerId |
| POST | /loans/:id/approve |
| GET | /loans/:id/emi |
| POST | /emi/:id/pay |
| POST | /advances |
| GET | /advances/farmer/:farmerId |
| GET | /credit-score/:farmerId |

### foodIntelligenceService.js (/api/v1/food-intelligence)

| Method | Path |
|---|---|
| POST | /food-items |
| GET | /food-items/search |
| POST | /quality-assessments |
| GET | /food-items/:foodItemId/quality-assessments |
| POST | /contaminant-tests |
| GET | /food-items/:foodItemId/contaminant-tests |
| POST | /freshness-assessments |
| POST | /food-recalls |
| GET | /food-recalls/active |
| POST | /food-intelligence |

### foodSafetyService.js (/api/v1/food-safety)

| Method | Path |
|---|---|
| POST | /haccp |
| GET | /haccp |
| POST | /haccp/:id/monitoring |
| POST | /fssai |
| GET | /fssai |
| POST | /iso22000 |
| GET | /iso22000 |
| POST | /recalls |
| PUT | /recalls/:id/status |
| GET | /recalls |
| POST | /capa |
| PUT | /capa/:id/status |
| GET | /capa |
| POST | /audits |
| GET | /audits |
| POST | /risk-assessment |
| GET | /risk-assessment |
| POST | /corrective-actions |
| PUT | /corrective-actions/:id/status |
| GET | /corrective-actions |
| GET | /dashboard |

### formService.js (/api/v1/forms)

| Method | Path |
|---|---|
| GET | / |
| GET | /templates |
| POST | / |
| GET | /:id |
| PUT | /:id |
| DELETE | /:id |
| POST | /:id/submit |
| GET | /:id/submissions |

### giIntelligenceService.js (/api/v1/gi-intelligence)

| Method | Path |
|---|---|
| POST | /gi-products |
| GET | /gi-products |
| POST | /gi-producers |
| GET | /gi-products/:giProductId/producers |
| POST | /gi-pricing |
| POST | /gi-authentication |
| GET | /gi-authentication/verify/:authCode |
| POST | /gi-marketplace |
| GET | /gi-marketplace |
| POST | /gi-analytics |
| GET | /gi-analytics/:giProductId |

### governmentSchemeService.js (setupRoutes)

_No direct router routes found in service file._

### greenhouseService.js (setupRoutes)

_No direct router routes found in service file._

### gstService.js (not directly mounted)

_No direct router routes found in service file._

### indigenousKnowledgeService.js (/api/v1/indigenous-knowledge)

| Method | Path |
|---|---|
| POST | /traditional-recipes |
| GET | /traditional-recipes |
| GET | /traditional-recipes/:id |
| POST | /traditional-medicine |
| GET | /traditional-medicine |
| POST | /indigenous-farming |
| GET | /indigenous-farming |
| POST | /oral-history |
| GET | /oral-history |
| POST | /tribal-knowledge |
| GET | /tribal-knowledge |
| POST | /documentation |
| GET | /documentation |
| POST | /protection |
| PUT | /protection/:id/status |
| GET | /protection |
| POST | /ip-management |
| GET | /ip-management |
| PUT | /ip-management/:id |

### institutionalProcurementService.js (/api/v1/institutional-procurement)

| Method | Path |
|---|---|
| POST | /tenders |
| GET | /tenders |
| POST | /tenders/:id/bids |
| POST | /demand-forecast |
| GET | /demand-forecast |
| POST | /menu-plans |
| GET | /menu-plans |
| POST | /nutrition-compliance |
| GET | /nutrition-compliance |
| POST | /contracts |
| GET | /contracts |
| POST | /quality-inspections |
| GET | /quality-inspections |
| POST | /settlements |
| GET | /settlements |
| GET | /dashboard |

### insuranceClaimsService.js (setupRoutes)

_No direct router routes found in service file._

### insuranceService.js (/api/v1/insurance)

| Method | Path |
|---|---|
| POST | /policies |
| GET | /policies/:id |
| GET | /policies |
| POST | /claims |
| GET | /claims/:id |
| GET | /claims |
| PUT | /claims/:id/process |
| POST | /master-policies |
| GET | /master-policies |
| GET | /products |
| POST | /calculate-premium |

### iotIntegrationService.js (/api/v1/iot-integration)

| Method | Path |
|---|---|
| POST | /iot-devices |
| GET | /iot-devices |
| PATCH | /iot-devices/:deviceId/status |
| POST | /sensor-data |
| GET | /sensor-data/:deviceId |
| POST | /device-commands |
| GET | /device-commands/:deviceId |
| POST | /device-alerts |
| GET | /device-alerts/unacknowledged |
| GET | /iot-devices/:deviceId/health |
| POST | /iot-analytics |

### knowledgeGraphService.js (/api/v1/knowledge-graph)

| Method | Path |
|---|---|
| POST | /knowledge-nodes |
| GET | /knowledge-nodes/search |
| POST | /relationships |
| GET | /knowledge-nodes/:nodeId/related |
| POST | /graph-queries |
| POST | /graph-queries/:queryId/execute |
| POST | /knowledge-analytics |

### laboratoryERPService.js (/api/v1/laboratory-erp)

| Method | Path |
|---|---|
| POST | /laboratories |
| GET | /laboratories |
| GET | /test-categories |
| GET | /test-methods |
| POST | /samples |
| GET | /samples |
| GET | /samples/:sampleNumber |
| POST | /test-assignments |
| PUT | /test-assignments/:assignmentId/results |
| POST | /certification-reports |
| GET | /certification-reports/:reportNumber |
| POST | /samples/:sampleId/tracking |
| GET | /samples/:sampleId/tracking |

### logisticsService.js (/api/v1/logistics)

| Method | Path |
|---|---|
| POST | /shipments |
| GET | /shipments/:id |
| GET | /shipments |
| PUT | /shipments/:id/status |
| POST | /shipments/:id/tracking |
| GET | /shipments/:id/tracking |
| POST | /vehicles |
| GET | /vehicles |
| POST | /drivers |
| GET | /drivers |
| GET | /modes |

### merchandisingService.js (/api/v1/merchandising)

| Method | Path |
|---|---|
| GET | /moods |
| GET | /mood |
| GET | /rituals |
| GET | /ritual |
| GET | /tips |
| GET | /tips/audiences |
| GET | /portals |
| GET | /portal |
| GET | /occasions |
| GET | /occasions/upcoming |

### moduleCatalogService.js (/api/v1/modules)

| Method | Path |
|---|---|
| GET | / |
| GET | /overview |
| GET | /:id |
| POST | /assistant |

### multilingualService.js (/api/v1/multilingual)

| Method | Path |
|---|---|
| POST | /detect |
| POST | /translate |
| GET | /content |
| GET | /content/:key |
| POST | /content |
| GET | /preferences |
| PUT | /preferences |
| GET | /languages |
| GET | /pronunciation/:term |
| GET | /pronunciation |
| POST | /pronunciation |
| GET | /memory/stats |

### neProductIntelligenceService.js (/api/v1/ne-intelligence)

| Method | Path |
|---|---|
| POST | /curcumin |
| GET | /chilli-heat |
| GET | /costed-products |
| POST | /scheme-eligibility |
| POST | /emi |
| POST | /landed-cost |

### nutritionIntelligenceService.js (/api/v1/nutrition-intelligence)

| Method | Path |
|---|---|
| GET | /nutrients |
| POST | /food-profiles |
| GET | /food-profiles/search |
| POST | /product-nutrition |
| GET | /product-nutrition/:productId |
| POST | /product-nutrition/:productId/score |
| GET | /product-nutrition/:productId/score |
| POST | /product-nutrition/:productId/pricing |
| POST | /compare |
| GET | /dietary-profiles |

### offlinePaymentService.js (/api/v1/offline-payment)

| Method | Path |
|---|---|
| POST | /generate-qr |
| POST | /process |
| POST | /ussd/generate |
| POST | /ussd/process |
| POST | /sync |
| GET | /status/:transactionId |
| GET | /pending |
| POST | /set-pin |
| GET | /config |
| GET | /health |

### offlineSyncService.js (/api/v1/offline-sync)

| Method | Path |
|---|---|
| POST | /queue |
| POST | /process |
| GET | /status |
| POST | /resolve-conflict |
| GET | /snapshot/:entityType |
| PUT | /preferences |
| GET | /preferences |
| GET | /health |

### omnichannelAIService.js (/api/v1/omnichannel-ai)

| Method | Path |
|---|---|
| POST | /session |
| POST | /message |
| GET | /web/config |
| POST | /android/push |
| POST | /ios/push |
| POST | /whatsapp/template |
| POST | /sms/send |
| POST | /telegram/webhook |
| POST | /email/send |
| POST | /voice/transcribe |
| POST | /ivr/call-flow |
| POST | /kiosk/screen |
| GET | /analytics |
| GET | /config/:channel_type |
| PUT | /config/:channel_type |

### orderService.js (/api/v1/orders)

| Method | Path |
|---|---|
| GET | /cart |
| POST | /cart |
| PUT | /cart/:id |
| DELETE | /cart/:id |
| DELETE | /cart |
| POST | / |
| GET | /:id |
| GET | / |
| PUT | /:id/status |
| POST | /:id/payment |

### organicTraceabilityService.js (/api/v1/organic-traceability)

| Method | Path |
|---|---|
| POST | /farms |
| GET | /farms |
| POST | /plots |
| GET | /farms/:farmId/plots |
| POST | /crops |
| POST | /harvests |
| POST | /chain-of-custody |
| GET | /chain-of-custody/:productId |
| GET | /qr-data/:productId |
| POST | /consumer-transparency |
| GET | /consumer-transparency/qr/:qrCode |
| GET | /standards |
| POST | /fraud-alerts |

### predictiveAnalyticsService.js (/api/v1/predictive-analytics)

| Method | Path |
|---|---|
| POST | /predictive-models |
| GET | /predictive-models |
| POST | /predictions |
| GET | /predictions/:entityId/:entityType |
| POST | /forecasts |
| GET | /forecasts |
| POST | /prediction-alerts |
| GET | /prediction-alerts/unacknowledged |
| POST | /predictive-analytics |

### preSeasonOrderService.js (setupRoutes)

_No direct router routes found in service file._

### productService.js (/api/v1/products)

| Method | Path |
|---|---|
| GET | / |
| GET | /:id |
| POST | / |
| PUT | /:id |
| DELETE | /:id |
| GET | /categories/list |
| GET | /states/list |
| GET | /search |

### recipeIntelligenceService.js (/api/v1/recipe-intelligence)

| Method | Path |
|---|---|
| POST | /recipes |
| GET | /recipes |
| GET | /recipes/:id |
| POST | /generate-recipe |
| POST | /nutrition-calculation |
| GET | /nutrition-data/:ingredient |
| POST | /ingredient-substitution |
| POST | /cost-calculation |
| GET | /ingredient-pricing/:ingredient |
| GET | /seasonal-recipes |
| GET | /seasonal-ingredients |
| GET | /regional-recipes |
| GET | /regional-cuisine/:region |
| POST | /institutional-recipes |
| GET | /institutional-recipes |
| POST | /scale-recipe |
| GET | /dashboard |

### sharedInfraService.js (setupRoutes)

_No direct router routes found in service file._

### shelfLifeService.js (/api/v1/shelf-life)

| Method | Path |
|---|---|
| POST | /temperature |
| GET | /temperature |
| GET | /temperature/analytics |
| POST | /humidity |
| GET | /humidity |
| POST | /packaging-analysis |
| GET | /packaging-analysis |
| POST | /transport-analysis |
| GET | /transport-analysis |
| POST | /storage-analysis |
| GET | /storage-analysis |
| POST | /shelf-life-prediction |
| GET | /shelf-life-prediction |
| POST | /spoilage-risk |
| GET | /spoilage-risk |
| GET | /dashboard |

### smsAuthService.js (/api/v1/sms-auth)

| Method | Path |
|---|---|
| POST | /initiate |
| POST | /verify |
| POST | /register |
| POST | /complete-registration |
| GET | /languages |

### soilTestingService.js (setupRoutes)

_No direct router routes found in service file._

### subsidyService.js (setupRoutes)

_No direct router routes found in service file._

### v42IntelligenceService.js (/api/v1/intel)

| Method | Path |
|---|---|
| GET | /crops/resolve |
| GET | /crops/:conceptKey/terms |
| GET | /freight/quote |
| GET | /freight/slots |
| POST | /freight/slots/:slotCode/book |
| POST | /promos/validate |
| GET | /engines |
| GET | /organic-inputs |
| GET | /insurance-plans |
| GET | /accessibility-modes |
| POST | /freight/slots/:slotCode/release |

### valueCommerceService.js (/api/v1/value-commerce)

| Method | Path |
|---|---|
| GET | /value-factors |
| POST | /product-value-scores |
| GET | /product-value-scores/:productId |
| POST | /value-pricing |
| POST | /consumer-preferences |
| GET | /consumer-preferences |
| GET | /recommendations |
| GET | /value-tiers |

### voiceAIService.js (/api/v1/voice-ai)

| Method | Path |
|---|---|
| POST | /voice-sessions |
| POST | /voice-sessions/:sessionId/end |
| POST | /voice-commands |
| GET | /voice-sessions/:sessionId/commands |
| POST | /speech-recognition |
| POST | /voice-responses |
| POST | /voice-preferences |
| GET | /voice-preferences |
| POST | /voice-analytics |
| GET | /voice-analytics |

## Route Wrapper Modules

- `routes/farmerRoutes.js` mounted at `/api/v1/farmers`
- `routes/gstRoutes.js` mounted at `/api/v1/gst`
- `backend/src/services/decisionSupportService.js` mounted via `setupRoutes(app)`

## Orphaned Service Files

The following service files are not imported in `backend/src/index.js` and therefore have no live mounting path in the current app entrypoint:

- advancedFeaturesService.js
- auditService.js
- bulkOrderService.js
- cropPlanningService.js
- enterpriseAIService.js
- governanceService.js
- insuranceFraudDetectionService.js
- insurancePolicyIssuanceService.js
- insurancePremiumService.js
- landRecordsService.js
- logisticsEnhancementService.js
- productReviewService.js

## Notes

- `farmerService.js` and `gstService.js` are not mounted directly by `index.js` because they expose logic through route wrappers in `routes/farmerRoutes.js` and `routes/gstRoutes.js`.
- This mapping is generated from the current backend code and should be updated whenever service router definitions or index.js mounts change.
- Services with `setupRoutes` are registered directly on the Express app and may not expose a router object via `mountRoute`.
