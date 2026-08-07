# API Registry

**Generated:** 2026-08-04 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 677

---

### digitalProductPassportService  (25)

- `POST /product-id`
- `GET /product-id/:id`
- `POST /batches`
- `GET /batches`
- `POST /farm-info`
- `GET /farm-info`
- `POST /farmer-info`
- `GET /farmer-info`
- `POST /certification-info`
- `GET /certification-info`
- `POST /processing-history`
- `GET /processing-history`
- `POST /logistics-history`
- `GET /logistics-history`
- `POST /sustainability-data`
- `GET /sustainability-data`
- `POST /carbon-data`
- `GET /carbon-data`
- `POST /quality-reports`
- `GET /quality-reports`
- `POST /recall-status`
- `GET /recall-status`
- `POST /qr-code`
- `GET /qr-code/:id`
- `GET /passport/:product_id/:batch_id`

### logisticsEnhancementRoutes  (23)

- `POST /fleet/vehicles`
- `GET /fleet/vehicles`
- `GET /fleet/vehicles/:vehicleId`
- `PUT /fleet/vehicles/:vehicleId`
- `POST /fleet/vehicles/:vehicleId/maintenance`
- `POST /tracking/:shipmentId`
- `GET /tracking/:shipmentId`
- `GET /tracking/:shipmentId/live`
- `POST /tracking/:shipmentId/geofence`
- `POST /temperature/:shipmentId`
- `GET /temperature/:shipmentId`
- `GET /temperature/:shipmentId/alerts`
- `POST /warehouse/locations`
- `GET /warehouse/locations`
- `POST /warehouse/inventory`
- `GET /warehouse/inventory`
- `POST /warehouse/inventory/movement`
- `GET /warehouse/performance`
- `POST /routes/optimize`
- `GET /routes/:routeId`
- `POST /deliveries/schedule`
- `GET /deliveries/schedule`
- `PUT /deliveries/schedule/:scheduleId`

### marketplaceEnhancements  (23)

- `POST /gst/calculate/order/:orderId`
- `POST /gst/calculate/product`
- `GET /gst/summary`
- `POST /gst/invoice/:orderId`
- `POST /gst/validate`
- `POST /reviews`
- `GET /reviews/product/:productId`
- `GET /reviews/product/:productId/stats`
- `POST /reviews/:reviewId/helpful`
- `PUT /reviews/:reviewId`
- `DELETE /reviews/:reviewId`
- `PUT /reviews/:reviewId/moderate`
- `GET /reviews/user`
- `POST /reviews/:reviewId/report`
- `POST /bulk-orders`
- `GET /bulk-orders/:orderId`
- `GET /bulk-orders`
- `PUT /bulk-orders/:orderId/status`
- `POST /bulk-orders/:orderId/quotation`
- `POST /quotations/:quotationId/accept`
- `POST /quotations/:quotationId/reject`
- `GET /bulk-orders/stats`
- `DELETE /bulk-orders/:orderId`

### governanceModule  (22)

- `POST /villages`
- `GET /villages`
- `GET /villages/:villageId`
- `PUT /villages/:villageId`
- `POST /panchayats`
- `GET /panchayats`
- `GET /panchayats/:panchayatId`
- `POST /panchayats/:panchayatId/schemes`
- `POST /csr-projects`
- `GET /csr-projects`
- `GET /csr-projects/:projectId`
- `PUT /csr-projects/:projectId`
- `POST /csr-projects/:projectId/contributions`
- `GET /csr/statistics`
- `POST /compliance-reports`
- `GET /compliance-reports`
- `GET /compliance-reports/:reportId`
- `PUT /compliance-reports/:reportId/review`
- `GET /compliance/statistics`
- `POST /cooperatives`
- `GET /cooperatives`
- `POST /cooperatives/:cooperativeId/members`

### foodSafetyService  (21)

- `POST /haccp`
- `GET /haccp`
- `POST /haccp/:id/monitoring`
- `POST /fssai`
- `GET /fssai`
- `POST /iso22000`
- `GET /iso22000`
- `POST /recalls`
- `PUT /recalls/:id/status`
- `GET /recalls`
- `POST /capa`
- `PUT /capa/:id/status`
- `GET /capa`
- `POST /audits`
- `GET /audits`
- `POST /risk-assessment`
- `GET /risk-assessment`
- `POST /corrective-actions`
- `PUT /corrective-actions/:id/status`
- `GET /corrective-actions`
- `GET /dashboard`

### farmerPortalEnhancements  (20)

- `POST /land-records`
- `GET /land-records`
- `GET /land-records/:recordId`
- `PUT /land-records/:recordId`
- `PUT /land-records/:recordId/verify`
- `POST /land-records/sync-government`
- `GET /land-records/statistics/region`
- `DELETE /land-records/:recordId`
- `POST /crop-plans`
- `GET /crop-plans`
- `GET /crop-plans/recommendations/:landRecordId`
- `PUT /crop-plans/:planId/status`
- `GET /crop-plans/analytics`
- `GET /wallet`
- `GET /wallet/transactions`
- `POST /wallet/deposit`
- `POST /wallet/withdraw`
- `POST /wallet/transfer`
- `GET /wallet/balance`
- `POST /wallet/link-bank`

### logisticsEnhancements  (20)

- `POST /fleet`
- `GET /fleet`
- `GET /fleet/:vehicleId`
- `PUT /fleet/:vehicleId`
- `POST /fleet/:vehicleId/maintenance`
- `POST /shipments/:shipmentId/tracking`
- `GET /shipments/:shipmentId/tracking`
- `GET /shipments/:shipmentId/live-tracking`
- `POST /shipments/:shipmentId/geofence`
- `POST /shipments/:shipmentId/temperature`
- `GET /shipments/:shipmentId/temperature`
- `POST /shipments/:shipmentId/temperature-alerts`
- `GET /shipments/:shipmentId/temperature-alerts`
- `POST /warehouses`
- `GET /warehouses`
- `GET /warehouses/:warehouseId`
- `POST /warehouses/:warehouseId/inventory`
- `GET /warehouses/:warehouseId/inventory`
- `POST /warehouses/:warehouseId/shipments`
- `GET /statistics`

### indigenousKnowledgeService  (19)

- `POST /traditional-recipes`
- `GET /traditional-recipes`
- `GET /traditional-recipes/:id`
- `POST /traditional-medicine`
- `GET /traditional-medicine`
- `POST /indigenous-farming`
- `GET /indigenous-farming`
- `POST /oral-history`
- `GET /oral-history`
- `POST /tribal-knowledge`
- `GET /tribal-knowledge`
- `POST /documentation`
- `GET /documentation`
- `POST /protection`
- `PUT /protection/:id/status`
- `GET /protection`
- `POST /ip-management`
- `GET /ip-management`
- `PUT /ip-management/:id`

### insuranceEnhancements  (18)

- `POST /quotes`
- `GET /quotes/:quoteId`
- `POST /calculate/crop`
- `POST /calculate/transit`
- `POST /calculate/warehouse`
- `POST /calculate/livestock`
- `POST /policies`
- `GET /policies/:policyId`
- `GET /policies/number/:policyNumber`
- `GET /policies`
- `PUT /policies/:policyId/renew`
- `DELETE /policies/:policyId`
- `POST /policies/:policyId/payments/:installmentNumber`
- `GET /policies/:policyId/documents`
- `POST /policies/:policyId/documents`
- `POST /claims/:claimId/fraud-analysis`
- `GET /claims/:claimId/fraud-analysis`
- `GET /fraud/statistics`

### biodiversityService  (17)

- `POST /species`
- `GET /species`
- `GET /species/:id`
- `POST /native-crops`
- `GET /native-crops`
- `POST /traditional-varieties`
- `GET /traditional-varieties`
- `POST /medicinal-plants`
- `GET /medicinal-plants`
- `POST /wild-foods`
- `GET /wild-foods`
- `POST /conservation`
- `GET /conservation`
- `PUT /conservation/:id`
- `POST /risk-prediction`
- `GET /risk-predictions`
- `GET /analytics/dashboard`

### recipeIntelligenceService  (17)

- `POST /recipes`
- `GET /recipes`
- `GET /recipes/:id`
- `POST /generate-recipe`
- `POST /nutrition-calculation`
- `GET /nutrition-data/:ingredient`
- `POST /ingredient-substitution`
- `POST /cost-calculation`
- `GET /ingredient-pricing/:ingredient`
- `GET /seasonal-recipes`
- `GET /seasonal-ingredients`
- `GET /regional-recipes`
- `GET /regional-cuisine/:region`
- `POST /institutional-recipes`
- `GET /institutional-recipes`
- `POST /scale-recipe`
- `GET /dashboard`

### institutionalProcurementService  (16)

- `POST /tenders`
- `GET /tenders`
- `POST /tenders/:id/bids`
- `POST /demand-forecast`
- `GET /demand-forecast`
- `POST /menu-plans`
- `GET /menu-plans`
- `POST /nutrition-compliance`
- `GET /nutrition-compliance`
- `POST /contracts`
- `GET /contracts`
- `POST /quality-inspections`
- `GET /quality-inspections`
- `POST /settlements`
- `GET /settlements`
- `GET /dashboard`

### shelfLifeService  (16)

- `POST /temperature`
- `GET /temperature`
- `GET /temperature/analytics`
- `POST /humidity`
- `GET /humidity`
- `POST /packaging-analysis`
- `GET /packaging-analysis`
- `POST /transport-analysis`
- `GET /transport-analysis`
- `POST /storage-analysis`
- `GET /storage-analysis`
- `POST /shelf-life-prediction`
- `GET /shelf-life-prediction`
- `POST /spoilage-risk`
- `GET /spoilage-risk`
- `GET /dashboard`

### gstRoutes  (16)

- `POST /calculate/order/:orderId`
- `POST /calculate/product`
- `GET /summary`
- `POST /invoice/:orderId`
- `PUT /order/:orderId/gst`
- `POST /validate/gst-number`
- `GET /rate/:category`
- `GET /rates`
- `POST /rates`
- `DELETE /rates/:category`
- `POST /returns`
- `GET /returns`
- `PUT /returns/:returnId/status`
- `POST /payments`
- `GET /payments`
- `PUT /payments/:paymentId/status`

### omnichannelAIService  (15)

- `POST /session`
- `POST /message`
- `GET /web/config`
- `POST /android/push`
- `POST /ios/push`
- `POST /whatsapp/template`
- `POST /sms/send`
- `POST /telegram/webhook`
- `POST /email/send`
- `POST /voice/transcribe`
- `POST /ivr/call-flow`
- `POST /kiosk/screen`
- `GET /analytics`
- `GET /config/:channel_type`
- `PUT /config/:channel_type`

### consumerHealthService  (14)

- `POST /health-profiles`
- `GET /health-profiles`
- `POST /dietary-profiles`
- `POST /health-metrics`
- `GET /health-metrics`
- `POST /health-goals`
- `GET /health-goals`
- `POST /dietary-recommendations`
- `GET /dietary-recommendations`
- `POST /health-alerts`
- `GET /health-alerts`
- `POST /food-consumption`
- `GET /health-analytics`
- `GET /bmi`

### enterpriseControlService  (13)

- `POST /workflow/start`
- `POST /workflow/:instanceCode/act`
- `GET /workflow/pending`
- `POST /crm/leads`
- `POST /crm/leads/:leadCode/convert`
- `GET /crm/pipeline`
- `GET /clients/:id/health`
- `GET /legal/calendar`
- `POST /risk/:riskCode/assess`
- `GET /risk/heatmap`
- `POST /emergency/incidents`
- `POST /emergency/incidents/:incidentCode/acknowledge`
- `GET /emergency/active`

### laboratoryERPService  (13)

- `POST /laboratories`
- `GET /laboratories`
- `GET /test-categories`
- `GET /test-methods`
- `POST /samples`
- `GET /samples`
- `GET /samples/:sampleNumber`
- `POST /test-assignments`
- `PUT /test-assignments/:assignmentId/results`
- `POST /certification-reports`
- `GET /certification-reports/:reportNumber`
- `POST /samples/:sampleId/tracking`
- `GET /samples/:sampleId/tracking`

### organicTraceabilityService  (13)

- `POST /farms`
- `GET /farms`
- `POST /plots`
- `GET /farms/:farmId/plots`
- `POST /crops`
- `POST /harvests`
- `POST /chain-of-custody`
- `GET /chain-of-custody/:productId`
- `GET /qr-data/:productId`
- `POST /consumer-transparency`
- `GET /consumer-transparency/qr/:qrCode`
- `GET /standards`
- `POST /fraud-alerts`

### aiCopilotService  (11)

- `POST /session`
- `POST /session/:id/message`
- `GET /session/:id/history`
- `PUT /session/:id/close`
- `GET /finance/analytics`
- `GET /logistics/routes`
- `GET /warehouse/inventory`
- `GET /insurance/policies`
- `GET /nutrition/analysis`
- `GET /marketplace/trends`
- `GET /analytics`

### giIntelligenceService  (11)

- `POST /gi-products`
- `GET /gi-products`
- `POST /gi-producers`
- `GET /gi-products/:giProductId/producers`
- `POST /gi-pricing`
- `POST /gi-authentication`
- `GET /gi-authentication/verify/:authCode`
- `POST /gi-marketplace`
- `GET /gi-marketplace`
- `POST /gi-analytics`
- `GET /gi-analytics/:giProductId`

### insuranceService  (11)

- `POST /policies`
- `GET /policies/:id`
- `GET /policies`
- `POST /claims`
- `GET /claims/:id`
- `GET /claims`
- `PUT /claims/:id/process`
- `POST /master-policies`
- `GET /master-policies`
- `GET /products`
- `POST /calculate-premium`

### iotIntegrationService  (11)

- `POST /iot-devices`
- `GET /iot-devices`
- `PATCH /iot-devices/:deviceId/status`
- `POST /sensor-data`
- `GET /sensor-data/:deviceId`
- `POST /device-commands`
- `GET /device-commands/:deviceId`
- `POST /device-alerts`
- `GET /device-alerts/unacknowledged`
- `GET /iot-devices/:deviceId/health`
- `POST /iot-analytics`

### logisticsService  (11)

- `POST /shipments`
- `GET /shipments/:id`
- `GET /shipments`
- `PUT /shipments/:id/status`
- `POST /shipments/:id/tracking`
- `GET /shipments/:id/tracking`
- `POST /vehicles`
- `GET /vehicles`
- `POST /drivers`
- `GET /drivers`
- `GET /modes`

### multilingualService  (11)

- `POST /detect`
- `POST /translate`
- `GET /content/:key`
- `POST /content`
- `GET /preferences`
- `PUT /preferences`
- `GET /languages`
- `GET /pronunciation/:term`
- `GET /pronunciation`
- `POST /pronunciation`
- `GET /memory/stats`

### v42IntelligenceService  (11)

- `GET /crops/resolve`
- `GET /crops/:conceptKey/terms`
- `GET /freight/quote`
- `GET /freight/slots`
- `POST /freight/slots/:slotCode/book`
- `POST /promos/validate`
- `GET /engines`
- `GET /organic-inputs`
- `GET /insurance-plans`
- `GET /accessibility-modes`
- `POST /freight/slots/:slotCode/release`

### vendorRoutes  (11)

- `GET /corporate/:buyerId/profile`
- `GET /corporate/:buyerId/credit-status`
- `GET /corporate/:buyerId/orders`
- `POST /corporate/orders`
- `GET /logistics/:providerId/profile`
- `GET /logistics/:providerId/shipments`
- `GET /logistics/coldchain-nodes`
- `GET /logistics/return-trucks`
- `POST /logistics/bookings`
- `GET /processor/:processorId/profile`
- `GET /retailer/:retailerId/profile`

### arVrService  (10)

- `POST /experiences`
- `GET /experiences`
- `PATCH /experiences/:experienceId/publish`
- `POST /assets`
- `GET /assets`
- `POST /interaction-points`
- `GET /experiences/:experienceId/interaction-points`
- `POST /sessions`
- `PATCH /sessions/:sessionId/end`
- `POST /ar-vr-analytics`

### authService  (10)

- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `POST /2fa/setup`
- `POST /2fa/verify`
- `POST /2fa/disable`
- `GET /oauth/:provider/url`
- `POST /oauth/:provider/callback`
- `GET /me`

### blockchainTraceabilityService  (10)

- `POST /blockchain-transactions`
- `GET /blockchain-transactions/:hash`
- `POST /traceability-events`
- `GET /traceability-events/:productId`
- `POST /chain-of-custody`
- `GET /chain-of-custody/verify/:productId`
- `POST /blockchain-certificates`
- `GET /blockchain-certificates/verify/:certificateNumber`
- `POST /verification-requests`
- `POST /blockchain-analytics`

### conversationalAIService  (10)

- `POST /sessions`
- `GET /sessions/:sessionId`
- `POST /sessions/:sessionId/messages`
- `GET /sessions/:sessionId/messages`
- `POST /detect-intent`
- `POST /sessions/:sessionId/respond`
- `GET /domains`
- `POST /sessions/:sessionId/context`
- `GET /sessions/:sessionId/context`
- `POST /sessions/:sessionId/end`

### foodIntelligenceService  (10)

- `POST /food-items`
- `GET /food-items/search`
- `POST /quality-assessments`
- `GET /food-items/:foodItemId/quality-assessments`
- `POST /contaminant-tests`
- `GET /food-items/:foodItemId/contaminant-tests`
- `POST /freshness-assessments`
- `POST /food-recalls`
- `GET /food-recalls/active`
- `POST /food-intelligence`

### merchandisingService  (10)

- `GET /moods`
- `GET /mood`
- `GET /rituals`
- `GET /ritual`
- `GET /tips`
- `GET /tips/audiences`
- `GET /portals`
- `GET /portal`
- `GET /occasions`
- `GET /occasions/upcoming`

### nutritionIntelligenceService  (10)

- `GET /nutrients`
- `POST /food-profiles`
- `GET /food-profiles/search`
- `POST /product-nutrition`
- `GET /product-nutrition/:productId`
- `POST /product-nutrition/:productId/score`
- `GET /product-nutrition/:productId/score`
- `POST /product-nutrition/:productId/pricing`
- `POST /compare`
- `GET /dietary-profiles`

### offlinePaymentService  (10)

- `POST /generate-qr`
- `POST /process`
- `POST /ussd/generate`
- `POST /ussd/process`
- `POST /sync`
- `GET /status/:transactionId`
- `GET /pending`
- `POST /set-pin`
- `GET /config`
- `GET /health`

### orderService  (10)

- `GET /cart`
- `POST /cart`
- `PUT /cart/:id`
- `DELETE /cart/:id`
- `DELETE /cart`
- `POST /`
- `GET /:id`
- `GET /`
- `PUT /:id/status`
- `POST /:id/payment`

### voiceAIService  (10)

- `POST /voice-sessions`
- `POST /voice-sessions/:sessionId/end`
- `POST /voice-commands`
- `GET /voice-sessions/:sessionId/commands`
- `POST /speech-recognition`
- `POST /voice-responses`
- `POST /voice-preferences`
- `GET /voice-preferences`
- `POST /voice-analytics`
- `GET /voice-analytics`

### predictiveAnalyticsService  (9)

- `POST /predictive-models`
- `GET /predictive-models`
- `POST /predictions`
- `GET /predictions/:entityId/:entityType`
- `POST /forecasts`
- `GET /forecasts`
- `POST /prediction-alerts`
- `GET /prediction-alerts/unacknowledged`
- `POST /predictive-analytics`

### advancedFeatures  (9)

- `POST /ai/recommendations`
- `POST /blockchain/contracts`
- `POST /blockchain/contracts/:contractId/execute`
- `POST /iot/devices`
- `POST /iot/devices/:deviceId/data`
- `POST /analytics/demand-forecast`
- `POST /voice/commands`
- `POST /ar-vr/experiences`
- `POST /knowledge-graph/query`

### decisionSupportRoutes  (9)

- `POST /corp-credit-eligible`
- `POST /floor-benchmark`
- `POST /eco-logistics-miles`
- `POST /harvest-points`
- `POST /alloc-score`
- `POST /compost-plan`
- `GET /scheme-expiry-status`
- `POST /compliance-gaps`
- `GET /health`

### advancedAIService  (8)

- `POST /predict-demand`
- `POST /optimize-price`
- `POST /assess-credit-risk`
- `POST /detect-fraud`
- `POST /recommendations`
- `POST /detect-crop-disease`
- `GET /models`
- `GET /health`

### catalogIntelligenceService  (8)

- `GET /in-season`
- `GET /product-calendar`
- `GET /glut-forecast`
- `GET /scarcity-months`
- `GET /wellness`
- `GET /wellness/concerns`
- `GET /explain`
- `GET /glossary`

### financialService  (8)

- `POST /loans`
- `GET /loans/farmer/:farmerId`
- `POST /loans/:id/approve`
- `GET /loans/:id/emi`
- `POST /emi/:id/pay`
- `POST /advances`
- `GET /advances/farmer/:farmerId`
- `GET /credit-score/:farmerId`

### formService  (8)

- `GET /`
- `GET /templates`
- `POST /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/submit`
- `GET /:id/submissions`

### offlineSyncService  (8)

- `POST /queue`
- `POST /process`
- `GET /status`
- `POST /resolve-conflict`
- `GET /snapshot/:entityType`
- `PUT /preferences`
- `GET /preferences`
- `GET /health`

### productService  (8)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `GET /categories/list`
- `GET /states/list`
- `GET /search`

### valueCommerceService  (8)

- `GET /value-factors`
- `POST /product-value-scores`
- `GET /product-value-scores/:productId`
- `POST /value-pricing`
- `POST /consumer-preferences`
- `GET /consumer-preferences`
- `GET /recommendations`
- `GET /value-tiers`

### erpService  (7)

- `GET /status`
- `POST /sync/product`
- `POST /sync/order`
- `POST /sync/farmer`
- `POST /sync/transaction`
- `POST /sync/asset`
- `POST /sync/bulk`

### knowledgeGraphService  (7)

- `POST /knowledge-nodes`
- `GET /knowledge-nodes/search`
- `POST /relationships`
- `GET /knowledge-nodes/:nodeId/related`
- `POST /graph-queries`
- `POST /graph-queries/:queryId/execute`
- `POST /knowledge-analytics`

### auditRoutes  (7)

- `POST /events`
- `GET /entities/:entityType/:entityId`
- `GET /users/:userId`
- `GET /report`
- `GET /compliance/:complianceType`
- `GET /security`
- `GET /export`

### advancedVoiceAI  (6)

- `POST /conversation`
- `POST /process`
- `GET /languages`
- `GET /intents`
- `POST /text-query`
- `GET /health`

### neProductIntelligenceService  (6)

- `POST /curcumin`
- `GET /chilli-heat`
- `GET /costed-products`
- `POST /scheme-eligibility`
- `POST /emi`
- `POST /landed-cost`

### farmerRoutes  (6)

- `GET /`
- `GET /fpos/list`
- `GET /:farmerId`
- `POST /:farmerId/fdi`
- `GET /:farmerId/certifications`
- `POST /:farmerId/certifications`

### aiService  (5)

- `POST /predict/demand`
- `POST /optimize/price`
- `POST /assess/credit-risk`
- `POST /detect/fraud`
- `POST /recommend`

### commerceRulesService  (5)

- `GET /delivery-zone`
- `GET /serviceable-pincodes`
- `POST /subscription-plan`
- `POST /price-freeze`
- `POST /loyalty-redemption`

### farmerValueService  (5)

- `GET /farmers/:farmerId/value-index`
- `POST /farmers/:farmerId/value-index/compute`
- `GET /farmers/:farmerId/unclaimed-support`
- `GET /farmers/:farmerId/cash-flow`
- `GET /farmers/:farmerId/ledger`

### smsAuthService  (5)

- `POST /initiate`
- `POST /verify`
- `POST /register`
- `POST /complete-registration`
- `GET /languages`

### moduleCatalogService  (4)

- `GET /`
- `GET /overview`
- `GET /:id`
- `POST /assistant`

### analyticsService  (2)

- `GET /overview`
- `GET /insights`
