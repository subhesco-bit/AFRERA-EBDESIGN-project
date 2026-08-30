# API Registry

**Generated:** 2026-08-30 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 1794

---

### comprehensiveERPRoutes  (46)

- `POST /fi/gl/chart-of-accounts`
- `POST /fi/gl/accounts`
- `POST /fi/gl/journal-entries`
- `GET /fi/gl/trial-balance`
- `GET /fi/gl/balance-sheet`
- `GET /fi/gl/profit-loss`
- `GET /fi/gl/ai-analysis`
- `POST /co/cost-centers`
- `POST /co/profit-centers`
- `POST /co/cost-allocations`
- `GET /co/cost-centers/report`
- `GET /co/profit-centers/report`
- `POST /mm/material-master`
- `POST /mm/purchase-orders`
- `POST /mm/goods-receipts`
- `GET /mm/inventory`
- `GET /mm/ai-optimization`
- `POST /sd/customers`
- `POST /sd/sales-orders`
- `POST /sd/deliveries`
- `POST /sd/invoices`
- `POST /pp/production-orders`
- `POST /pp/production-orders/:production_order/release`
- `POST /pp/production-orders/:production_order/confirm`
- `GET /pp/ai-optimization`
- `POST /qm/inspection-lots`
- `POST /qm/inspection-results`
- `POST /qm/inspection-lots/:inspection_lot/usage-decision`
- `POST /pm/equipment`
- `POST /pm/maintenance-orders`
- `POST /pm/maintenance-orders/:maintenance_order/confirm`
- `POST /hr/employees`
- `POST /hr/org-units`
- `POST /hr/payroll`
- `GET /hr/ai-analysis`
- `POST /ps/projects`
- `POST /ps/wbs-elements`
- `POST /ps/projects/:project_code/status`
- `GET /ps/projects/:project_code/ai-analysis`
- `POST /tr/bank-accounts`
- `POST /tr/cash-flows`
- `GET /tr/cash-position`
- `POST /am/fixed-assets`
- `POST /am/fixed-assets/:asset_code/depreciation`
- `GET /bi/executive-dashboard`
- `GET /bi/profitability-analysis`

### logisticsEnhancementRoutes  (26)

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
- `POST /drivers/location`
- `GET /drivers/active`
- `GET /shipments/:id/trail`

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

### governanceModule  (24)

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
- `GET /compliance/gaps`
- `GET /compliance/ready`
- `POST /cooperatives`
- `GET /cooperatives`
- `POST /cooperatives/:cooperativeId/members`

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

### researchAndDevelopmentRoutes  (23)

- `GET /projects`
- `GET /projects/:projectId`
- `POST /projects`
- `PUT /projects/:projectId`
- `DELETE /projects/:projectId`
- `POST /projects/:projectId/milestones`
- `PUT /projects/:projectId/milestones/:milestoneId`
- `GET /collaborations`
- `POST /collaborations`
- `GET /innovations`
- `POST /innovations`
- `GET /patents`
- `POST /patents`
- `GET /funding`
- `POST /funding`
- `POST /funding/:fundingId/apply`
- `GET /publications`
- `POST /publications`
- `POST /ai-assistance`
- `GET /knowledge`
- `POST /knowledge`
- `GET /analytics`
- `GET /health`

### informationSharingRoutes  (22)

- `GET /documents`
- `GET /documents/search`
- `GET /documents/:documentId`
- `POST /documents`
- `PUT /documents/:documentId`
- `DELETE /documents/:documentId`
- `GET /folders`
- `GET /folders/tree`
- `POST /folders`
- `GET /permissions/:resourceId`
- `POST /permissions`
- `GET /permissions/:resourceId/check/:userId`
- `POST /sharing-links`
- `GET /sharing-links/access/:token`
- `GET /collaboration-sessions`
- `POST /collaboration-sessions`
- `POST /collaboration-sessions/:sessionId/join`
- `POST /collaboration-sessions/:sessionId/end`
- `POST /ai-recommendations`
- `GET /activity-logs/:resourceId`
- `GET /analytics`
- `GET /health`

### knowledgeRoutes  (22)

- `GET /articles`
- `GET /articles/:articleId`
- `POST /articles`
- `PUT /articles/:articleId`
- `DELETE /articles/:articleId`
- `GET /wiki`
- `GET /wiki/slug/:slug`
- `POST /wiki`
- `PUT /wiki/:wikiId`
- `GET /taxonomies`
- `GET /taxonomies/tree`
- `POST /taxonomies`
- `GET /search`
- `GET /versions/:itemId`
- `POST /versions/:itemId/restore/:versionNumber`
- `POST /access-control`
- `GET /access-control/:resourceId/check/:userId`
- `POST /feedback`
- `GET /feedback/:resourceId`
- `POST /ai-recommendations`
- `GET /analytics`
- `GET /health`

### nervousSystemRoutes  (22)

- `POST /brain/process-event`
- `GET /brain/decision-history`
- `GET /brain/focus`
- `POST /heart/start`
- `POST /heart/stop`
- `GET /heart/status`
- `POST /neural/create-pathway`
- `GET /neural/pathways`
- `POST /neural/strengthen/:pathwayId`
- `POST /reflex/create-arc`
- `GET /reflex/arcs`
- `POST /reflex/trigger`
- `POST /sensor/register`
- `GET /sensor/data/:sensorId`
- `GET /sensor/status`
- `POST /motor/execute`
- `GET /motor/active`
- `POST /route/register`
- `POST /route/request`
- `GET /route/optimal`
- `POST /route/deactivate/:routeId`
- `GET /health`

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

### logisticsEnhancements  (21)

- `POST /fleet`
- `GET /fleet`
- `GET /fleet/maintenance-due`
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

### pigRoutes  (21)

- `GET /herd`
- `POST /herd`
- `GET /herd/:id`
- `PUT /herd/:id`
- `DELETE /herd/:id`
- `GET /herd/:animalId/weight-records`
- `POST /herd/:animalId/weight-records`
- `GET /herd/:animalId/feed-consumption`
- `POST /herd/:animalId/feed-consumption`
- `GET /herd/:sowId/breeding`
- `POST /herd/:sowId/breeding`
- `GET /herd/:animalId/vaccinations`
- `POST /herd/:animalId/vaccinations`
- `GET /herd/:animalId/performance`
- `GET /herd/:animalId/fcr`
- `GET /breeding-alerts`
- `GET /vaccination-alerts`
- `POST /ai/optimize-meat/:animalId`
- `POST /ai/monitor-health/:animalId`
- `POST /ai/optimize-feed/:animalId`
- `POST /ai/recommend-breeding/:animalId`

### sheepRoutes  (21)

- `GET /flock`
- `POST /flock`
- `GET /flock/:id`
- `PUT /flock/:id`
- `DELETE /flock/:id`
- `GET /flock/:animalId/wool-production`
- `POST /flock/:animalId/wool-production`
- `GET /flock/:animalId/feed-consumption`
- `POST /flock/:animalId/feed-consumption`
- `GET /flock/:femaleId/breeding`
- `POST /flock/:femaleId/breeding`
- `GET /flock/:animalId/vaccinations`
- `POST /flock/:animalId/vaccinations`
- `GET /flock/:animalId/performance`
- `GET /breeding-alerts`
- `GET /vaccination-alerts`
- `GET /shearing-alerts`
- `POST /ai/optimize-wool/:animalId`
- `POST /ai/monitor-health/:animalId`
- `POST /ai/optimize-feed/:animalId`
- `POST /ai/recommend-breeding/:animalId`

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

### goatRoutes  (20)

- `GET /herd`
- `POST /herd`
- `GET /herd/:id`
- `PUT /herd/:id`
- `DELETE /herd/:id`
- `GET /herd/:animalId/milk-production`
- `POST /herd/:animalId/milk-production`
- `GET /herd/:animalId/feed-consumption`
- `POST /herd/:animalId/feed-consumption`
- `GET /herd/:femaleId/breeding`
- `POST /herd/:femaleId/breeding`
- `GET /herd/:animalId/vaccinations`
- `POST /herd/:animalId/vaccinations`
- `GET /herd/:animalId/performance`
- `GET /breeding-alerts`
- `GET /vaccination-alerts`
- `POST /ai/optimize-milk/:animalId`
- `POST /ai/monitor-health/:animalId`
- `POST /ai/optimize-feed/:animalId`
- `POST /ai/recommend-breeding/:animalId`

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

### institutionalProcurementService  (19)

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
- `POST /contract-offers`
- `GET /contract-offers`
- `PUT /contract-offers/:id`

### animalHealthRoutes  (19)

- `GET /examinations`
- `POST /examinations`
- `PUT /examinations/:id`
- `DELETE /examinations/:id`
- `GET /treatments`
- `POST /treatments`
- `PUT /treatments/:id`
- `DELETE /treatments/:id`
- `GET /outbreaks`
- `POST /outbreaks`
- `PUT /outbreaks/:id`
- `DELETE /outbreaks/:id`
- `GET /quarantines`
- `POST /quarantines`
- `PUT /quarantines/:id`
- `DELETE /quarantines/:id`
- `GET /overview`
- `GET /active-outbreaks`
- `GET /active-quarantines`

### insuranceEnhancements  (19)

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
- `PATCH /quotes/:quoteId/status`
- `POST /claims/:claimId/fraud-analysis`
- `GET /claims/:claimId/fraud-analysis`
- `GET /fraud/statistics`

### poultryRoutes  (19)

- `GET /flocks`
- `POST /flocks`
- `GET /flocks/:id`
- `PUT /flocks/:id`
- `DELETE /flocks/:id`
- `GET /flocks/:flockId/egg-production`
- `POST /flocks/:flockId/egg-production`
- `GET /flocks/:flockId/feed-consumption`
- `POST /flocks/:flockId/feed-consumption`
- `GET /flocks/:flockId/mortality`
- `POST /flocks/:flockId/mortality`
- `GET /flocks/:flockId/vaccinations`
- `POST /flocks/:flockId/vaccinations`
- `GET /flocks/:flockId/performance`
- `GET /vaccination-alerts`
- `POST /ai/optimize-production/:flockId`
- `POST /ai/monitor-health/:flockId`
- `POST /ai/optimize-feed/:flockId`
- `POST /ai/predict-mortality/:flockId`

### sapModuleArchitectureRoutes  (19)

- `GET /modules`
- `GET /modules/:id`
- `GET /modules/type/:type`
- `POST /modules`
- `PUT /modules/:id`
- `DELETE /modules/:id`
- `GET /modules/:id/dependencies`
- `GET /dependency-graph`
- `GET /modules/:id/resolve-dependencies`
- `GET /modules/:id/configuration`
- `PUT /modules/:id/configuration`
- `GET /modules/:id/version`
- `PUT /modules/:id/version`
- `POST /modules/:id/transition`
- `GET /modules/:id/lifecycle`
- `GET /modules/:id/compatibility`
- `GET /modules/:id/mta-descriptor`
- `GET /overview`
- `GET /service-health`

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

### consumerHealthService  (15)

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
- `POST /bmr-tdee`

### nutritionIntelligenceService  (15)

- `GET /nutrients`
- `POST /food-profiles`
- `GET /food-profiles/search`
- `POST /product-nutrition`
- `GET /product-nutrition/:productId`
- `POST /product-nutrition/:productId/score`
- `GET /product-nutrition/:productId/score`
- `POST /product-nutrition/:productId/pricing`
- `GET /product-nutrition/:productId/value-per-nutrient`
- `POST /compare`
- `GET /dietary-profiles`
- `POST /recommendations`
- `GET /recommendations`
- `POST /recipes`
- `GET /wellness-practices`

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

### completeAIIntegrationRoutes  (15)

- `POST /farmer/:farmerId/crop-planning-recommendation`
- `POST /farmer/:farmerId/harvest-timing-prediction`
- `POST /farmer/:farmerId/resource-optimization`
- `POST /crop/:cropId/disease-detection`
- `POST /crop/:cropId/yield-prediction`
- `POST /livestock/:livestockId/health-monitoring`
- `POST /livestock/:livestockId/breeding-recommendation`
- `POST /dairy/:dairyId/production-optimization`
- `POST /poultry/:poultryId/health-monitoring`
- `POST /goat/:goatId/production-optimization`
- `POST /sheep/:sheepId/production-optimization`
- `POST /pig/:pigId/production-optimization`
- `GET /status`
- `POST /force-sync`
- `GET /model-info`

### completeERPIntegrationRoutes  (15)

- `POST /farmer/:farmerId/crop-planning`
- `POST /farmer/:farmerId/harvest`
- `POST /farmer/:farmerId/field`
- `POST /crop/:cropId/lifecycle`
- `POST /crop/:cropId/yield`
- `POST /livestock/:livestockId`
- `POST /livestock/:livestockId/production`
- `POST /livestock/:livestockId/health`
- `POST /dairy/:dairyId/production`
- `POST /poultry/:poultryId/production`
- `POST /goat/:goatId/production`
- `POST /sheep/:sheepId/production`
- `POST /pig/:pigId/production`
- `GET /status`
- `POST /force-sync`

### costControlRoutes  (15)

- `POST /cost-centers`
- `GET /cost-centers`
- `GET /cost-centers/:costCenterId`
- `GET /cost-centers/:costCenterId/actuals`
- `POST /profit-centers`
- `GET /profit-centers`
- `POST /budgets`
- `GET /budgets`
- `GET /budgets/:budgetId`
- `POST /budgets/:budgetId/submit`
- `POST /budgets/:budgetId/approve`
- `POST /budgets/:budgetId/lines`
- `GET /budgets/:budgetId/lines`
- `GET /budgets/:budgetId/vs-actual`
- `GET /budgets/:budgetId/cost-reduction-recommendations`

### platformCoreRoutes  (15)

- `GET /config`
- `PUT /config/:key`
- `GET /health`
- `GET /stats`
- `GET /optimizations`
- `POST /initialize`
- `GET /scaling/recommendations`
- `GET /capacity/predict`
- `POST /disaster-recovery`
- `GET /performance/monitor`
- `POST /self-healing`
- `GET /configuration/optimized`
- `POST /configuration/apply`
- `GET /metrics`
- `GET /state`

### aiBrainRoutes  (14)

- `POST /cycle`
- `POST /perception`
- `POST /attention`
- `POST /reasoning`
- `POST /learning`
- `POST /decision`
- `POST /planning`
- `POST /knowledge`
- `GET /knowledge/:domain`
- `GET /knowledge`
- `GET /state`
- `PUT /context`
- `DELETE /working-memory`
- `GET /health`

### experienceRoutes  (14)

- `GET /resolve`
- `GET /tokens`
- `POST /tokens`
- `GET /themes`
- `GET /contrast`
- `GET /motion`
- `GET /breakpoint`
- `GET /components`
- `POST /components`
- `GET /accessibility`
- `POST /accessibility`
- `GET /preferences`
- `PUT /preferences`
- `GET /feedback/:eventKey`

### projectSystemsRoutes  (14)

- `POST /`
- `GET /`
- `GET /:projectId`
- `POST /:projectId/status`
- `POST /:projectId/wbs`
- `GET /:projectId/wbs`
- `GET /:projectId/wbs/rollup`
- `GET /wbs/:wbsId`
- `POST /wbs/:wbsId/status`
- `POST /:projectId/milestones`
- `GET /:projectId/milestones`
- `GET /:projectId/milestones/summary`
- `POST /milestones/:milestoneId/complete`
- `GET /:projectId/budget-vs-actual`

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

### logisticsService  (13)

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
- `GET /lanes/:laneCode/eco-score`
- `GET /shipments/:id/eco-score`

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

### aiOperationIntelligenceRoutes  (13)

- `GET /metrics`
- `POST /analyze`
- `POST /recommend`
- `POST /optimize`
- `POST /cycle`
- `GET /predict`
- `GET /anomalies`
- `GET /improvements`
- `GET /strategies`
- `POST /strategy`
- `GET /resources`
- `GET /history`
- `GET /service-health`

### enterpriseAIRoutes  (13)

- `POST /credit-score`
- `POST /scheme-eligibility`
- `POST /assess-risk`
- `POST /recommendations`
- `POST /entity-profile`
- `POST /anomaly-detection`
- `POST /predict-yield`
- `POST /predict-demand`
- `POST /predict-price`
- `GET /model-slots`
- `GET /unserved-intents`
- `POST /model-slots`
- `POST /query`

### multilingualService  (12)

- `POST /detect`
- `POST /translate`
- `GET /content`
- `GET /content/:key`
- `POST /content`
- `GET /preferences`
- `PUT /preferences`
- `GET /languages`
- `GET /pronunciation/:term`
- `GET /pronunciation`
- `POST /pronunciation`
- `GET /memory/stats`

### dairyRoutes  (12)

- `GET /animals`
- `POST /animals`
- `PUT /animals/:id`
- `DELETE /animals/:id`
- `GET /milk-records`
- `POST /milk-records`
- `GET /milk-yield-trends`
- `GET /health-alerts`
- `POST /ai/optimize-production/:animalId`
- `POST /ai/predict-health/:animalId`
- `POST /ai/optimize-feed/:animalId`
- `POST /ai/recommend-breeding/:animalId`

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

### productService  (11)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`
- `GET /categories/list`
- `GET /states/list`
- `GET /search`
- `POST /:id/generate-image`
- `GET /:id/video-script`
- `POST /:id/generate-video`

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

### aiSelfHealingRoutes  (11)

- `POST /detect`
- `POST /root-cause`
- `POST /recover`
- `POST /heal`
- `GET /predict`
- `GET /history`
- `GET /health`
- `POST /pattern`
- `POST /strategy`
- `GET /system-state`
- `GET /service-health`

### ecommerceRoutes  (11)

- `POST /listings`
- `GET /listings`
- `GET /listings/:id`
- `PUT /listings/:id`
- `DELETE /listings/:id`
- `GET /seller/analytics`
- `GET /seller/listings`
- `GET /gi-listings`
- `GET /market/price-trends/:categoryId`
- `GET /market/demand/:categoryId`
- `POST /price-recommendation`

### riskPricingRoutes  (11)

- `GET /crops/:cropKey`
- `GET /forward`
- `GET /calibration/:state/:district/:cropKey`
- `POST /advise`
- `POST /publish`
- `POST /basis`
- `GET /lots/:lotCode/price`
- `POST /lots/:lotCode/open-bucket`
- `GET /booking-curve/:cropKey`
- `POST /booking-curve`
- `GET /lots/attention`

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

### weatherRoutes  (11)

- `GET /coverage`
- `GET /for-arp`
- `GET /alerts/active`
- `GET /alerts/dispatch-check`
- `GET /pest-forecast`
- `GET /forecast-accuracy`
- `GET /advisory-triggers`
- `POST /observations`
- `POST /forecasts`
- `POST /forecasts/score`
- `POST /alerts`

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

### financialService  (10)

- `POST /loans`
- `GET /loans/farmer/:farmerId`
- `POST /loans/:id/approve`
- `GET /loans/:id/emi`
- `POST /emi/:id/pay`
- `POST /advances`
- `GET /advances/farmer/:farmerId`
- `GET /credit-score/:farmerId`
- `GET /buyers/:buyerId/credit-eligibility`
- `GET /credit-risk-score/:farmerId`

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

### sharedInfrastructureService  (10)

- `GET /access/:accessId`
- `GET /access/village/:villageId`
- `GET /access/type/:infrastructureType`
- `GET /access/village/:villageId/summary`
- `POST /access`
- `GET /ai/usage-optimization/:villageId`
- `GET /ai/predictive-maintenance/:infrastructureType`
- `GET /analytics/cost-sharing/:district`
- `GET /ai/resource-allocation/:villageId`
- `GET /monitoring/real-time/:infrastructureId`

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

### aiAgentRoutes  (10)

- `POST /execute`
- `POST /coordinate`
- `GET /agent/:agent_name`
- `GET /agents`
- `POST /agent`
- `PUT /agent/:agent_name`
- `DELETE /agent/:agent_name/memory`
- `POST /tool`
- `GET /tools`
- `GET /health`

### aiCollaborationRoutes  (10)

- `GET /context`
- `PUT /context`
- `POST /log-work`
- `GET /work-history/:aiSource`
- `GET /continuable/:currentAI`
- `POST /handoff`
- `POST /handoff/:handoffId/accept`
- `GET /handoffs/pending/:forAI`
- `GET /stats`
- `GET /report`

### aiCollaborationRoutes  (10)

- `GET /context`
- `PUT /context`
- `POST /log-work`
- `GET /work-history/:aiSource`
- `GET /continuable/:currentAI`
- `POST /handoff`
- `POST /handoff/:handoffId/accept`
- `GET /handoffs/pending/:forAI`
- `GET /stats`
- `GET /report`

### ecommerceIntegrationRoutes  (10)

- `POST /nutrition-score/:productId`
- `GET /nutrition-price/:productId`
- `GET /recipes/:productId`
- `GET /recipe-products/:recipeId`
- `GET /health-recommendations`
- `GET /compatibility/:productId`
- `POST /cart-nutrition`
- `POST /cart-rda`
- `GET /dietitian-collections`
- `GET /dietitian-recommendation`

### ecommerceMarketingRoutes  (10)

- `POST /create-campaign`
- `POST /launch-campaign/:campaignId`
- `POST /update-campaign-metrics/:campaignId`
- `POST /create-sponsored-product`
- `GET /sponsored-products`
- `POST /create-promotion`
- `POST /apply-promotion/:promoCode`
- `POST /retargeting-cart`
- `POST /retargeting-product-view`
- `GET /analytics`

### organizationManagementRoutes  (10)

- `POST /organizations`
- `GET /organizations/:id`
- `PUT /organizations/:id`
- `POST /organizations/:id/optimize-structure`
- `GET /organizations/:id/recommend-hierarchy`
- `GET /organizations/:id/units/:unitId/predict-performance`
- `POST /organizations/:id/optimize-resources`
- `POST /organizations/:id/analyze-change-impact`
- `GET /organizations/:id/units`
- `POST /organizations/:id/units`

### platformConfigurationRoutes  (10)

- `GET /configuration`
- `GET /configuration/recommendations`
- `POST /configuration/apply`
- `POST /configuration/tune`
- `GET /configuration/adjust-performance`
- `POST /configuration/security-scan`
- `GET /configuration/compliance`
- `GET /configuration/history`
- `POST /configuration/rollback`
- `POST /configuration/validate`

### recoveredFinanceRoutes  (10)

- `GET /ledger/trial-balance`
- `GET /ledger/verify`
- `GET /schemes/match`
- `POST /enwr/issue`
- `GET /enwr/my-receipts`
- `GET /freight/rate`
- `GET /subsidy/equipment`
- `POST /risk/event`
- `GET /risk/:partyId`
- `GET /certificates/expiring`

### buyingClubService  (9)

- `GET /clubs/:clubId`
- `GET /clubs/village/:villageId`
- `GET /clubs/district/:district`
- `POST /clubs`
- `PUT /clubs/:clubId`
- `POST /clubs/:clubId/members`
- `POST /orders`
- `GET /orders/club/:clubId`
- `GET /clubs/statistics`

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

### agriculturalIntelligenceRoutes  (9)

- `POST /crop-yield/predict`
- `POST /soil/analyze`
- `GET /weather-intelligence`
- `POST /pest-outbreak/predict`
- `POST /crops/recommend`
- `POST /irrigation/optimize`
- `POST /fertilizer/recommend`
- `GET /analytics`
- `GET /health`

### assetAccountingRoutes  (9)

- `POST /assets`
- `GET /assets`
- `GET /assets/summary`
- `GET /assets/:assetId`
- `POST /assets/:assetId/depreciation-schedule`
- `GET /assets/:assetId/depreciation-schedule`
- `POST /assets/:assetId/depreciation-schedule/:periodDate/post`
- `POST /depreciation-run`
- `POST /assets/:assetId/dispose`

### bulkOrderRoutes  (9)

- `POST /`
- `GET /analytics`
- `GET /user/:userId`
- `GET /:orderId`
- `PATCH /:orderId/status`
- `GET /:orderId/quotations`
- `POST /:orderId/quotations`
- `POST /quotations/:quotationId/accept`
- `POST /:orderId/cancel`

### backendModuleBridge  (9)

- `GET /:moduleId/:operation/:id`
- `GET /:moduleId/:operation`
- `POST /:moduleId/:operation/:id`
- `POST /:moduleId/:operation`
- `PUT /:moduleId/:operation/:id`
- `PUT /:moduleId/:operation`
- `DELETE /:moduleId/:operation/:id`
- `DELETE /:moduleId/:operation`
- `GET /:moduleId`

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

### farmerTrainingRoutes  (9)

- `POST /programs`
- `POST /register`
- `GET /progress/:registrationId`
- `POST /folu-assessment`
- `GET /carbon-footprint/:farmerId`
- `POST /compliance-report`
- `GET /northeast-organic`
- `POST /certificates/:registrationId`
- `GET /recommendations/:farmerId`

### nutrientValueSalesRoutes  (9)

- `POST /calculate-price/:productId`
- `POST /submit-verification`
- `POST /approve-verification/:verificationId`
- `POST /create-listing`
- `POST /assign-tier/:productId`
- `POST /compare-products`
- `POST /issue-certificate`
- `POST /calculate-commission/:orderId`
- `GET /search`

### productReviewRoutes  (9)

- `POST /products/:productId`
- `GET /products/:productId`
- `GET /products/:productId/stats`
- `GET /me`
- `PUT /:reviewId`
- `DELETE /:reviewId`
- `POST /:reviewId/helpful`
- `POST /:reviewId/report`
- `PATCH /:reviewId/moderate`

### rfqRoutes  (9)

- `POST /rfq`
- `POST /rfq/:id/bid`
- `GET /rfq/:id/bids`
- `POST /quotes/outcome`
- `GET /quotes/loss-analysis`
- `POST /qc/hold`
- `POST /qc/release`
- `GET /qc/holds`
- `GET /fpo/centre-pnl`

### roleManagementRoutes  (9)

- `POST /`
- `GET /`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/permissions/:permissionId`
- `DELETE /:id/permissions/:permissionId`
- `POST /optimize`
- `GET /permissions/analysis`

### tenantManagementRoutes  (9)

- `POST /tenants`
- `GET /tenants/:id`
- `GET /tenants`
- `PUT /tenants/:id`
- `DELETE /tenants/:id`
- `POST /tenants/:id/optimize-resources`
- `GET /tenants/:id/predict-usage`
- `GET /tenants/:id/recommend-tier`
- `POST /tenants/:id/optimize-cost`

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

### procurementSubscriptionService  (8)

- `GET /subscriptions/:subscriptionId`
- `GET /subscriptions/subscriber/:subscriberId`
- `GET /subscriptions/product/:productId`
- `POST /subscriptions`
- `PUT /subscriptions/:subscriptionId`
- `POST /subscriptions/:subscriptionId/cancel`
- `GET /subscriptions/due/:date`
- `GET /subscriptions/statistics`

### valueCommerceService  (8)

- `GET /value-factors`
- `POST /product-value-scores`
- `GET /product-value-scores/:productId`
- `POST /value-pricing`
- `POST /consumer-preferences`
- `GET /consumer-preferences`
- `GET /recommendations`
- `GET /value-tiers`

### auditRoutes  (8)

- `POST /events`
- `GET /entities/:entityType/:entityId`
- `GET /users/:userId`
- `GET /report`
- `GET /compliance/:complianceType`
- `GET /security`
- `GET /export`
- `GET /recent`

### coldStorageRoutes  (8)

- `POST /facilities`
- `GET /facilities`
- `GET /facilities/:facilityId`
- `PUT /facilities/:facilityId`
- `GET /utilization`
- `POST /bookings`
- `GET /bookings`
- `PUT /bookings/:bookingId/status`

### complianceRoutes  (8)

- `POST /tds/deduct`
- `GET /tds/summary`
- `GET /tds/rates`
- `POST /irn/register`
- `POST /irn/result`
- `POST /gstr/draft`
- `POST /rcm`
- `GET /rcm/outstanding`

### cropPlanningRoutes  (8)

- `POST /`
- `GET /`
- `GET /recommend/:landRecordId`
- `GET /suitable-crops`
- `GET /market-demand`
- `GET /weather-forecast`
- `PATCH /:planId/status`
- `GET /analytics`

### ecommerceAIRoutes  (8)

- `POST /segment-customers-rfm`
- `POST /segment-customers-behavioral`
- `POST /forecast-demand/:productId`
- `POST /optimize-inventory/:productId`
- `GET /recommendations/:userId`
- `POST /predict-sales`
- `GET /clv/:userId`
- `GET /market-basket`

### ecommerceBusinessSalesRoutes  (8)

- `POST /create-bulk-order`
- `POST /submit-quotation`
- `POST /accept-quotation/:quotationId`
- `POST /create-contract-farming`
- `POST /record-milestone`
- `GET /sales-analytics`
- `GET /b2b-conversion-metrics`
- `POST /calculate-commission/:orderId`

### farmerHealthRoutes  (8)

- `GET /health-records`
- `GET /health-records/:id`
- `POST /health-records`
- `PUT /health-records/:id`
- `DELETE /health-records/:id`
- `GET /farmers/:farmerId/health-summary`
- `GET /welfare-programs`
- `POST /welfare-enrollments`

### hrRoutes  (8)

- `POST /employees`
- `GET /employees/:employeeId/attrition-risk`
- `GET /employees/:employeeId/sentiment`
- `GET /employees/:employeeId/training-recommendations`
- `POST /shifts/optimize`
- `POST /timesheets/analyze-anomalies`
- `GET /analytics/workforce`
- `GET /analytics/predictions`

### landRecordsRoutes  (8)

- `POST /`
- `GET /`
- `GET /regional-statistics`
- `GET /:recordId`
- `PUT /:recordId`
- `DELETE /:recordId`
- `POST /:recordId/verify`
- `POST /sync-government`

### systemAdministrationRoutes  (8)

- `POST /initialize`
- `GET /incidents/predict`
- `POST /incidents/root-cause`
- `POST /self-healing`
- `GET /capacity/forecast`
- `POST /security/threats/detect`
- `GET /dashboard/health`
- `POST /maintenance/automated`

### aiAdvisoryService  (7)

- `GET /advisories/:advisoryId`
- `GET /advisories/village/:villageId`
- `GET /advisories/farmer/:farmerId`
- `GET /advisories/type/:advisoryType`
- `POST /advisories`
- `PUT /advisories/:advisoryId/status`
- `GET /advisories/statistics`

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

### ruralEnterpriseService  (7)

- `GET /enterprises/:enterpriseId`
- `GET /enterprises/village/:villageId`
- `GET /enterprises/type/:enterpriseType`
- `POST /enterprises`
- `PUT /enterprises/:enterpriseId`
- `GET /enterprises/statistics`
- `GET /enterprises/search`

### aiGatewayRoutes  (7)

- `POST /chat`
- `GET /statistics`
- `GET /providers`
- `GET /models/:provider`
- `PUT /providers/:provider/enable`
- `PUT /providers/:provider/disable`
- `POST /stream`

### libraryRoutes  (7)

- `POST /initialize`
- `GET /search`
- `GET /statistics`
- `GET /verify`
- `GET /item/:filename`
- `GET /modules`
- `GET /components`

### unifiedAIRoutes  (7)

- `POST /unified`
- `POST /conversational`
- `POST /analytical`
- `POST /automation`
- `POST /governance`
- `GET /agents`
- `GET /usage`

### cooperativeShareRoutes  (7)

- `POST /members`
- `GET /members`
- `GET /capital`
- `POST /distributions/preview`
- `POST /distributions`
- `GET /distributions`
- `GET /distributions/:id`

### gdprRoutes  (7)

- `POST /consent`
- `GET /consent/:userId`
- `POST /rtbf`
- `GET /export/:userId`
- `GET /data-residency/:userId`
- `POST /privacy-impact-assessment`
- `GET /policy`

### farmerRoutes  (7)

- `GET /`
- `GET /fpos/list`
- `GET /me`
- `GET /:farmerId`
- `POST /:farmerId/fdi`
- `GET /:farmerId/certifications`
- `POST /:farmerId/certifications`

### fertilizerRoutes  (7)

- `GET /inventory`
- `POST /inventory`
- `PUT /inventory/:id`
- `DELETE /inventory/:id`
- `POST /inventory/:id/issue`
- `GET /issues`
- `GET /inventory/reorder-alerts`

### foodRoutes  (7)

- `POST /processing/start-batch`
- `POST /nutrition/analyze`
- `POST /traceability/record-movement`
- `POST /shelf-life/predict`
- `POST /safety/compliance-check`
- `GET /batch/:batch_id`
- `POST /certification/organic-recommend`

### unifiedAIRoutes  (7)

- `POST /unified`
- `POST /conversational`
- `POST /analytical`
- `POST /automation`
- `POST /governance`
- `GET /agents`
- `GET /usage`

### wearableIntegrationRoutes  (7)

- `GET /status`
- `GET /fitbit/auth-url`
- `POST /fitbit/callback`
- `POST /fitbit/sync`
- `POST /sync`
- `GET /activity/recent`
- `DELETE /:provider`

### advancedVoiceAI  (6)

- `POST /conversation`
- `POST /process`
- `GET /languages`
- `GET /intents`
- `POST /text-query`
- `GET /health`

### commerceRulesService  (6)

- `GET /delivery-zone`
- `GET /serviceable-pincodes`
- `POST /subscription-plan`
- `POST /price-freeze`
- `POST /loyalty-redemption`
- `GET /harvest-points/:userId`

### custodyEventRoutes  (6)

- `POST /events`
- `GET /chain/:shipmentId`
- `POST /settlement/instructions`
- `POST /settlement/:instructionId/confirm`
- `GET /settlement/:instructionId`
- `GET /state-machine`

### millCircuitService  (6)

- `GET /mill-circuit/slots`
- `POST /mill-circuit/slots`
- `POST /mill-circuit/bookings`
- `GET /mill-circuit/bookings`
- `GET /fpo-ledger/entries`
- `POST /fpo-ledger/entries`

### mobilityRidesService  (6)

- `GET /rides/:rideId`
- `GET /rides/village/:villageId`
- `GET /rides/driver/:driverId`
- `POST /rides`
- `PUT /rides/:rideId/status`
- `GET /rides/statistics`

### neProductIntelligenceService  (6)

- `POST /curcumin`
- `GET /chilli-heat`
- `GET /costed-products`
- `POST /scheme-eligibility`
- `POST /emi`
- `POST /landed-cost`

### renewableEnergyService  (6)

- `GET /systems/:systemId`
- `GET /systems/village/:villageId`
- `GET /systems/type/:energyType`
- `POST /systems`
- `PUT /systems/:systemId`
- `GET /systems/statistics`

### villageProfileService  (6)

- `GET /villages/:villageId`
- `GET /villages/district/:district`
- `GET /villages/block/:block`
- `GET /districts/:district/economic-summary`
- `POST /villages`
- `GET /villages/search`

### aiBackboneRoutes  (6)

- `POST /call`
- `GET /status`
- `POST /switch-provider`
- `POST /reset-statistics`
- `POST /agricultural-decision`
- `POST /livestock-optimization`

### moduleRegistryRoutes  (6)

- `GET /discover`
- `GET /stats`
- `GET /loaded`
- `POST /:moduleId/load`
- `POST /:moduleId/execute`
- `GET /:moduleId/health`

### ecommerceERPRoutes  (6)

- `POST /post-gl`
- `POST /generate-gst-invoice/:orderId`
- `POST /sync-inventory/:productId`
- `POST /create-purchase-order`
- `POST /sync-customer/:userId`
- `POST /create-production-order`

### energyRoutes  (6)

- `POST /calculator/lifetime-cost`
- `GET /database/grid-tariffs/:region`
- `POST /optimizer/recommend-stack`
- `GET /metrics/:village_id`
- `POST /productive/demand-forecast`
- `POST /stack/compare`

### engineeringProjectRoutes  (6)

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `PUT /projects/:id/phase`
- `POST /projects/:id/cost-estimates`
- `GET /projects/:id/cost-estimates`

### equipmentExchangeRoutes  (6)

- `POST /`
- `GET /`
- `GET /:listingId`
- `POST /:listingId/reserve`
- `POST /:listingId/complete`
- `DELETE /:listingId`

### freightPoolingRoutes  (6)

- `GET /poolable-shipments`
- `POST /windows`
- `GET /windows`
- `GET /windows/:windowId`
- `POST /windows/:windowId/join`
- `POST /windows/:windowId/dispatch`

### geofencingRoutes  (6)

- `POST /zones`
- `GET /zones`
- `GET /zones/:id`
- `POST /checkins`
- `GET /checkins`
- `POST /driver-zone-check`

### healthRoutes  (6)

- `GET /`
- `GET /detailed`
- `GET /ready`
- `GET /live`
- `GET /checks`
- `POST /checks/:name`

### fisheriesRoutes  (6)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/ponds`
- `GET /:id/feed`
- `GET /:id/harvest`

### marketDataRoutes  (6)

- `GET /prices/trend`
- `POST /prices/ingest`
- `POST /dbt/reconcile`
- `GET /dbt/unclaimed`
- `POST /competitor/observe`
- `GET /competitor/position`

### seedVaultRoutes  (6)

- `GET /`
- `GET /categories`
- `POST /`
- `PUT /:seedId`
- `POST /:seedId/record-usage`
- `DELETE /:seedId`

### aiService  (5)

- `POST /predict/demand`
- `POST /optimize/price`
- `POST /assess/credit-risk`
- `POST /detect/fraud`
- `POST /recommend`

### farmerValueService  (5)

- `GET /farmers/:farmerId/value-index`
- `POST /farmers/:farmerId/value-index/compute`
- `GET /farmers/:farmerId/unclaimed-support`
- `GET /farmers/:farmerId/cash-flow`
- `GET /farmers/:farmerId/ledger`

### machineryAccessService  (5)

- `GET /access/:accessId`
- `GET /access/village/:villageId`
- `GET /access/type/:machineryType`
- `GET /access/village/:villageId/summary`
- `POST /access`

### marketAccessService  (5)

- `GET /access/:accessId`
- `GET /access/village/:villageId`
- `GET /access/type/:marketType`
- `GET /access/village/:villageId/summary`
- `POST /access`

### marketIntelligenceService  (5)

- `GET /intelligence/:intelligenceId`
- `GET /intelligence/village/:villageId`
- `GET /intelligence/crop/:cropId`
- `GET /intelligence/village/:villageId/latest`
- `POST /intelligence`

### ruralFinanceService  (5)

- `GET /finance/:financeId`
- `GET /finance/village/:villageId`
- `GET /finance/service/:serviceType`
- `GET /finance/village/:villageId/summary`
- `POST /finance`

### smsAuthService  (5)

- `POST /initiate`
- `POST /verify`
- `POST /register`
- `POST /complete-registration`
- `GET /languages`

### civilDisruptionRoutes  (5)

- `POST /`
- `GET /active`
- `POST /:id/verify`
- `POST /:id/resolve`
- `GET /shipments/:shipmentId/risk`

### climateMonitoringRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### communityManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### cropManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### dprGenerationRoutes  (5)

- `POST /preview`
- `POST /`
- `GET /`
- `GET /:id`
- `GET /:id/pdf`

### mfaRoutes  (5)

- `POST /setup`
- `POST /verify`
- `POST /disable`
- `POST /backup/sms`
- `GET /status`

### farmerFamilyRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### fisheriesManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### foluRoutes  (5)

- `GET /land-use/summary`
- `POST /parcels`
- `POST /land-use/change`
- `POST /carbon/estimate`
- `GET /schemes/:farmerId`

### horticultureManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### identityManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### inputSupplyManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### irrigationManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### landManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### apicultureRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/honey`
- `GET /:id/hives`

### forestryRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/timber`
- `GET /:id/plantation`

### mushroomRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/spawn`
- `GET /:id/substrate`

### sericultureRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/silk`
- `GET /:id/mulberry`

### vermicompostRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `GET /:id/earthworms`
- `GET /:id/waste`

### livestockManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### operationsManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### preventiveMaintenanceRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### realtimeMonitoringRoutes  (5)

- `POST /monitors`
- `GET /monitors`
- `GET /monitors/:id`
- `DELETE /monitors/:id`
- `GET /health`

### regionalVarietyRoutes  (5)

- `GET /`
- `GET /categories`
- `GET /:id`
- `POST /:id/generate-image`
- `POST /:id/create-listing`

### soilManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### waterManagementRoutes  (5)

- `GET /`
- `GET /:id`
- `POST /`
- `PUT /:id`
- `DELETE /:id`

### householdEconomyService  (4)

- `GET /households/:householdId`
- `GET /households/village/:villageId`
- `GET /households/village/:villageId/summary`
- `POST /households`

### moduleCatalogService  (4)

- `GET /`
- `GET /overview`
- `GET /:id`
- `POST /assistant`

### climateAdvisoryRoutes  (4)

- `GET /advisories`
- `GET /advisories/:id`
- `POST /advisories`
- `PUT /advisories/:id`

### companyRoutes  (4)

- `GET /`
- `GET /:id`
- `GET /:id/fiscal-years`
- `GET /:id/chart-of-accounts`

### cropValueResearchRoutes  (4)

- `GET /status`
- `POST /research`
- `GET /pending`
- `POST /pending/:id/review`

### defenseFitnessPrepRoutes  (4)

- `GET /categories`
- `GET /standards/:category`
- `POST /attempts`
- `GET /readiness/:category`

### productMediaAIRoutes  (4)

- `GET /status`
- `POST /products/:productId/image`
- `POST /products/:productId/video-script`
- `POST /products/:productId/video`

### returnLoadBoardRoutes  (4)

- `POST /`
- `GET /`
- `POST /:postingId/book`
- `DELETE /:postingId`

### visionRoutes  (4)

- `POST /analyze-quality`
- `POST /metadata`
- `POST /thumbnail`
- `POST /ocr`

### enterpriseMemoryService  (3)

- `POST /entries`
- `GET /search`
- `GET /entities/:entityType/:entityId`

### demandRoutes  (3)

- `GET /forecast`
- `GET /heatmap`
- `GET /mandi-signal`

### analyticsReportRoutes  (2)

- `GET /report-types`
- `POST /reports/:reportType`

### costRoutes  (2)

- `GET /breakup`
- `GET /corridor-model`

### foluBenchmarkRoutes  (2)

- `GET /transitions`
- `GET /report`

### glutWarningRoutes  (2)

- `GET /check`
- `GET /scan`

### platformTelemetryRoutes  (2)

- `GET /status`
- `GET /analytics`

### revenueRoutes  (2)

- `GET /overview`
- `POST /allocate`

### sellerRankingRoutes  (2)

- `GET /sellers`
- `GET /sellers/:userId/trust-score`

### wikipediaRoutes  (2)

- `GET /lookup`
- `GET /summary/:title`

### whatsappService  (1)

- `POST /webhook`

### trackDartRoutes  (1)

- `GET /`
