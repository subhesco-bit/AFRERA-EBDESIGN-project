const fs=require('fs');
const path=require('path');

// M051-M100 are certified against their real module artifacts. This registry is
// deliberately explicit: each module gets a business invariant and an evidence
// requirement; generic CRUD presence is never sufficient.
const definitions={
 M051:{domain:'FPO',invariant:p=>p.fpoId&&p.registrationNumber,evidence:['registrationNumber','legalIdentity']},
 M052:{domain:'FPO Governance',invariant:p=>p.fpoId&&p.governanceBody&&p.effectiveDate,evidence:['resolution','officeBearers']},
 M053:{domain:'FPO Membership',invariant:p=>p.fpoId&&p.farmerId&&p.status,evidence:['memberId','farmerId']},
 M054:{domain:'FPO Finance',invariant:p=>p.fpoId&&p.transactionType&&Number.isFinite(Number(p.amount))&&Number(p.amount)>=0,evidence:['transactionId','ledgerReference']},
 M055:{domain:'FPO Procurement',invariant:p=>p.fpoId&&p.supplierId&&p.productId&&Number(p.quantity)>0,evidence:['purchaseOrderId','price']},
 M056:{domain:'FPO Inventory',invariant:p=>p.fpoId&&p.productId&&p.movementType&&Number(p.quantity)>0,evidence:['movementId','warehouseId']},
 M057:{domain:'FPO Marketing',invariant:p=>p.fpoId&&p.campaignId&&p.startDate&&p.endDate,evidence:['targetMarket','budget']},
 M058:{domain:'FPO Sales',invariant:p=>p.fpoId&&p.buyerId&&p.productId&&Number(p.quantity)>0,evidence:['orderId','price']},
 M059:{domain:'FPO Compliance',invariant:p=>p.fpoId&&p.requirementId&&p.dueDate,evidence:['requirementId','evidenceRef']},
 M060:{domain:'FPO Performance',invariant:p=>p.fpoId&&Number.isFinite(Number(p.periodRevenue))&&Number.isFinite(Number(p.periodCost)),evidence:['period','revenue','cost']},
 M061:{domain:'Crop Planning',invariant:p=>p.farmId&&p.seasonId&&p.cropId&&Number(p.area)>0,evidence:['plotId','seasonId']},
 M062:{domain:'Crop Calendar',invariant:p=>p.cropId&&p.regionId&&p.sowingWindowStart&&p.harvestWindowStart,evidence:['calendarVersion']},
 M063:{domain:'Crop Registration',invariant:p=>p.farmerId&&p.plotId&&p.cropId&&p.seasonId,evidence:['registrationId','plotId']},
 M064:{domain:'Variety Management',invariant:p=>p.cropId&&p.varietyId&&p.climateZone,evidence:['varietyId','source']},
 M065:{domain:'Seed Requirement',invariant:p=>p.cropPlanId&&Number(p.area)>0&&Number(p.seedRate)>0,evidence:['calculationVersion']},
 M066:{domain:'Nursery Management',invariant:p=>p.nurseryId&&p.cropId&&Number(p.batchQuantity)>0,evidence:['batchId','germinationRate']},
 M067:{domain:'Sowing Management',invariant:p=>p.plotId&&p.cropId&&p.sowingDate,evidence:['operator','seedLotId']},
 M068:{domain:'Crop Monitoring',invariant:p=>p.plotId&&p.observationDate&&p.growthStage,evidence:['observationId','observer']},
 M069:{domain:'Harvest Planning',invariant:p=>p.plotId&&p.cropId&&p.plannedHarvestDate&&Number(p.expectedQuantity)>=0,evidence:['labourPlan','equipmentPlan']},
 M070:{domain:'Yield Recording',invariant:p=>p.plotId&&p.harvestId&&Number(p.quantity)>=0&&p.unit,evidence:['harvestId','measurementMethod']},
 M071:{domain:'Dairy Management',invariant:p=>p.herdId&&p.animalId&&p.observationDate,evidence:['animalId','milkRecord']},
 M072:{domain:'Poultry Management',invariant:p=>p.flockId&&p.observationDate&&Number(p.count)>=0,evidence:['flockId','healthRecord']},
 M073:{domain:'Goat Management',invariant:p=>p.herdId&&p.animalId&&p.observationDate,evidence:['animalId','healthRecord']},
 M074:{domain:'Sheep Management',invariant:p=>p.herdId&&p.animalId&&p.observationDate,evidence:['animalId','healthRecord']},
 M075:{domain:'Pig Management',invariant:p=>p.herdId&&p.animalId&&p.observationDate,evidence:['animalId','healthRecord']},
 M076:{domain:'Water Budgeting',invariant:p=>p.locationId&&p.budgetPeriod&&Number(p.totalAllocation)>0,evidence:['budgetId','allocationBasis']},
 M077:{domain:'Water Quality',invariant:p=>p.locationId&&p.measurementDate&&p.parameter&&Number.isFinite(Number(p.value)),evidence:['measurementId','method']},
 M078:{domain:'Water Conservation',invariant:p=>p.locationId&&p.interventionId&&Number(p.expectedSavings)>=0,evidence:['baseline','target']},
 M079:{domain:'Irrigation Management',invariant:p=>p.plotId&&p.irrigationDate&&Number(p.appliedVolume)>=0,evidence:['source','meterOrEstimate']},
 M080:{domain:'Water Analytics',invariant:p=>p.locationId&&p.periodStart&&p.periodEnd&&p.metrics,evidence:['sourceRecords']},
 M081:{domain:'Weather Monitoring',invariant:p=>p.locationId&&p.observedAt&&Number.isFinite(Number(p.temperature)),evidence:['observationSource']},
 M082:{domain:'Weather Forecasting',invariant:p=>p.locationId&&p.forecastAt&&p.horizon&&p.source,evidence:['forecastSource','issuedAt']},
 M083:{domain:'Climate Advisory',invariant:p=>p.locationId&&p.advisoryType&&p.validFrom&&p.validTo,evidence:['triggerData']},
 M084:{domain:'Disaster Risk',invariant:p=>p.locationId&&p.hazardType&&Number(p.exposure)>=0,evidence:['hazardSource','assessmentDate']},
 M085:{domain:'Drought Monitoring',invariant:p=>p.locationId&&p.observationDate&&Number.isFinite(Number(p.droughtIndex)),evidence:['indexMethod']},
 M086:{domain:'Flood Monitoring',invariant:p=>p.locationId&&p.observationDate&&Number.isFinite(Number(p.riverLevel)),evidence:['sensorOrGauge']},
 M087:{domain:'Pest Risk',invariant:p=>p.cropId&&p.locationId&&p.assessmentDate&&Number.isFinite(Number(p.riskScore)),evidence:['riskModel','observations']},
 M088:{domain:'Disease Risk',invariant:p=>p.cropId&&p.locationId&&p.assessmentDate&&Number.isFinite(Number(p.riskScore)),evidence:['riskModel','observations']},
 M089:{domain:'Climate Risk',invariant:p=>p.locationId&&p.assessmentDate&&Number.isFinite(Number(p.riskScore)),evidence:['hazard','vulnerability','exposure']},
 M090:{domain:'Agrometeorology',invariant:p=>p.plotId&&p.operationType&&p.recommendedWindowStart&&p.recommendedWindowEnd,evidence:['weatherInputs','cropStage']},
 M091:{domain:'Farm Operations',invariant:p=>p.farmId&&p.activityId&&p.activityDate,evidence:['operator','activityEvidence']},
 M092:{domain:'Farm Task Scheduling',invariant:p=>p.farmId&&p.taskId&&p.scheduledStart&&p.scheduledEnd,evidence:['resourcePlan']},
 M093:{domain:'Farm Labour',invariant:p=>p.farmId&&p.workerId&&p.workDate&&Number(p.hours)>0,evidence:['attendance','output']},
 M094:{domain:'Contract Labour',invariant:p=>p.farmId&&p.contractId&&p.workerCount>0,evidence:['contract','rate']},
 M095:{domain:'Farm Machinery',invariant:p=>p.farmId&&p.machineId&&p.operationDate&&Number(p.hours)>0,evidence:['machineId','operator']},
 M096:{domain:'Equipment Scheduling',invariant:p=>p.machineId&&p.startTime&&p.endTime&&p.farmId,evidence:['availabilityCheck']},
 M097:{domain:'Farm Inputs',invariant:p=>p.farmId&&p.inputId&&Number(p.quantity)>0&&p.applicationDate,evidence:['inputLot','application']},
 M098:{domain:'Farm Costing',invariant:p=>p.farmId&&p.period&&Number.isFinite(Number(p.revenue))&&Number.isFinite(Number(p.cost)),evidence:['costLedger','revenueSource']},
 M099:{domain:'Farm Productivity',invariant:p=>p.farmId&&p.period&&Number.isFinite(Number(p.output))&&Number.isFinite(Number(p.input)),evidence:['productionRecords']},
 M100:{domain:'Farm Operations Intelligence',invariant:p=>p.farmId&&p.period&&p.kpis,evidence:['kpiSources','calculationVersion']}
};

function discover(moduleCode,root=path.resolve(__dirname)){const d=path.join(root,moduleCode);return {backend:d,service:fs.existsSync(path.join(d,'service.js')),controller:fs.existsSync(path.join(d,'controller.js')),routes:fs.existsSync(path.join(d,'routes.js')),model:fs.existsSync(path.join(d,'model.sql')),index:fs.existsSync(path.join(d,'index.js'))};}
function validate(moduleCode,payload){const def=definitions[moduleCode];if(!def)throw new Error(`Unknown M051-M100 module: ${moduleCode}`);const ok=def.invariant(payload||{});return {moduleCode,domain:def.domain,valid:!!ok,requiredEvidence:def.evidence};}
function certify(moduleCode,payload){const v=validate(moduleCode,payload);const assets=discover(moduleCode);const structural=assets.service&&assets.controller&&assets.routes&&assets.model&&assets.index;return {...v,assets,structural,certified:v.valid&&structural};}
module.exports={definitions,discover,validate,certify};
