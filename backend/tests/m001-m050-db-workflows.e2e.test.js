'use strict';

const pool = require('../src/database/pool');
const enterprise = require('../src/services/m001m050EnterpriseProductService');
const workflow = require('../src/services/m001m050WorkflowOrchestrationService');

const registryCases = [
  ['M034', require('../src/modules/M034/service'), { parcel_id:'PARCEL-CI-1', geometry:{type:'Polygon',coordinates:[]}, crs:'EPSG:4326', area_ha:1.5, status:'active' }],
  ['M035', require('../src/modules/M035/service'), { feature_id:'GIS-CI-1', layer:'land_use', geometry:{type:'Feature',geometry:null,properties:{}}, crs:'EPSG:4326', status:'active' }],
  ['M037', require('../src/modules/M037/service'), { resource_id:'WATER-CI-1', resource_type:'pond', location:{lat:26.1,lng:91.7}, capacity:1000, capacity_unit:'m3', seasonal_status:'perennial', status:'active' }],
  ['M038', require('../src/modules/M038/service'), { boundary_id:'BOUNDARY-CI-1', boundary_type:'village', name:'CI Village Boundary', geometry:{type:'Polygon',coordinates:[]}, crs:'EPSG:4326', status:'active' }],
  ['M039', require('../src/modules/M039/service'), { survey_id:'SURVEY-CI-1', survey_date:'2026-09-11', survey_type:'baseline', location:{village_id:'CI-V1'}, enumerator_id:'ci-enumerator', source_reference:'ci-evidence', findings:{complete:true}, status:'captured' }],
  ['M049', require('../src/modules/M049/service'), { asset_id:'ASSET-CI-1', asset_type:'warehouse', name:'CI Community Asset', location:{village_id:'CI-V1'}, village_id:'CI-V1', condition:'good', custodian:'CI Panchayat', utilization_pct:55, maintenance_state:'serviceable', status:'active' }],
];

function uniquePayload(payload) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const copy = JSON.parse(JSON.stringify(payload));
  for (const key of ['parcel_id','feature_id','resource_id','boundary_id','survey_id','asset_id']) if (copy[key]) copy[key] = `${copy[key]}-${suffix}`;
  return copy;
}

describe('M001-M050 database-backed operational workflows', () => {
  const created = [];
  afterAll(async () => {
    for (const item of created.reverse()) {
      try { await item.service.remove(item.id, {id:'ci-cleanup'}); } catch (_) {}
    }
    try { await pool.query("DELETE FROM m001_m050_decision_queue WHERE maker_id LIKE 'ci-%' OR checker_id LIKE 'ci-%'"); } catch (_) {}
    try { await pool.query("DELETE FROM m001_m050_workflow_instances WHERE created_by LIKE 'ci-%'"); } catch (_) {}
    try { await pool.query("DELETE FROM m001_m050_operational_tasks WHERE created_by LIKE 'ci-%'"); } catch (_) {}
    try { await pool.query("DELETE FROM m001_m050_kpi_snapshots WHERE recorded_by LIKE 'ci-%'"); } catch (_) {}
    await pool.end();
  });

  test.each(registryCases)('%s authoritative registry completes create/read/update/retire lifecycle', async (code, service, base) => {
    const payload = uniquePayload(base);
    const row = await service.create(payload, {id:'ci-maker'});
    created.push({service,id:row.id});
    expect(row.id).toBeTruthy();
    const fetched = await service.get(row.id);
    expect(fetched.id).toBe(row.id);
    const updated = await service.update(row.id, {status:'reviewed'}, {id:'ci-checker'});
    expect(updated.status).toBe('reviewed');
    const listed = await service.list({limit:20});
    expect(listed.some(x => x.id === row.id)).toBe(true);
  });

  test('operational task, sourced KPI, workflow and maker-checker decision persist end-to-end', async () => {
    const entityId = `CI-PARCEL-${Date.now()}`;
    const task = await enterprise.createTask('M034', {title:'Validate parcel geometry',entity_type:'parcel',entity_id:entityId,priority:'high',assigned_role:'gis_officer'}, {id:'ci-maker'});
    expect(task.status).toBe('open');
    const task2 = await enterprise.updateTask('M034', task.id, {status:'in_progress'}, {id:'ci-gis'});
    expect(task2.status).toBe('in_progress');

    const kpi = await enterprise.recordKpi('M034', {metric_key:'coverage',metric_value:82.5,unit:'percent',source_reference:'ci-authoritative-parcel-query'}, {id:'ci-kpi'});
    expect(Number(kpi.metric_value)).toBeCloseTo(82.5);
    const kpis = await enterprise.latestKpis('M034');
    expect(kpis.find(x => x.metric_key === 'coverage').source_reference).toBe('ci-authoritative-parcel-query');

    const wf = await workflow.create('M034', {entity_type:'parcel',entity_id:entityId,priority:'high',assigned_role:'gis_officer',context:{source:'ci'}}, {id:'ci-maker'});
    expect(wf.state).toBe('capture');
    const next = await workflow.transition('M034', wf.id, 'georeference', {actorId:'ci-gis',actorRole:'gis_officer',reason:'geometry captured',evidence:{source:'ci'},correlationId:'ci-correlation'});
    expect(next.state).toBe('georeference');

    const decision = await workflow.queueDecision('M034', {workflow_id:wf.id,decision_type:'record_reconciliation',proposed_action:{action:'accept_geometry'},recommendation:{source:'ci',confidence:0.9},risk_level:'elevated'}, {id:'ci-maker'});
    await expect(workflow.decide('M034', decision.id, {decision:'approved',checkerId:'ci-maker',reason:'self approval'})).rejects.toThrow(/Maker cannot/);
    const approved = await workflow.decide('M034', decision.id, {decision:'approved',checkerId:'ci-checker',reason:'evidence verified'});
    expect(approved.status).toBe('approved');
    expect(approved.checker_id).toBe('ci-checker');
  });
});
