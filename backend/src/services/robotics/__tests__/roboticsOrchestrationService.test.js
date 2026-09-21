'use strict';

const {
  RoboticsOrchestrationService,
  SimulatorAdapter,
  missionNeedsApproval,
} = require('../roboticsOrchestrationService');

function databaseWith(rowsByQuery = []) {
  let index = 0;
  const client = {
    query: jest.fn(async sql => {
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
      const rows = rowsByQuery[index++] || [];
      return { rows };
    }),
    release: jest.fn(),
  };
  return { database: { connect: jest.fn(async () => client), query: jest.fn() }, client };
}

describe('canonical robotics orchestration', () => {
  test('classifies physical actions and high hazard missions for human approval', () => {
    expect(missionNeedsApproval({ hazard_level: 'low', steps: [{ action: 'inspect' }] })).toBe(false);
    expect(missionNeedsApproval({ hazard_level: 'low', steps: [{ action: 'spray' }] })).toBe(true);
    expect(missionNeedsApproval({ hazard_level: 'critical', steps: [{ action: 'inspect' }] })).toBe(true);
  });

  test('simulator conforms to dispatch and emergency stop contracts', async () => {
    const adapter = new SimulatorAdapter();
    const dispatched = await adapter.dispatch({ device: { id: 'd1' }, mission: { id: 'm1' }, command: { type: 'start' } });
    expect(dispatched).toEqual(expect.objectContaining({ accepted: true, simulated: true, deviceId: 'd1', missionId: 'm1' }));
    await expect(adapter.emergencyStop({ device: { id: 'd1' } })).resolves.toEqual(expect.objectContaining({ accepted: true }));
  });

  test('fails closed for uncertified, offline, stopped, or unhealthy devices', () => {
    const service = new RoboticsOrchestrationService({ database: {} });
    const mission = { status: 'approved' };
    expect(() => service.assertReady({ certification_status: 'pending', operational_status: 'online' }, mission)).toThrow('not certified');
    expect(() => service.assertReady({ certification_status: 'certified', operational_status: 'offline' }, mission)).toThrow('not online');
    expect(() => service.assertReady({ certification_status: 'certified', operational_status: 'online', emergency_stop_active: true }, mission)).toThrow('Emergency stop');
    expect(() => service.assertReady({ certification_status: 'certified', operational_status: 'online', last_telemetry: { safetyInterlock: false } }, mission)).toThrow('interlock');
  });

  test('requires an independent approver under the two-person rule', async () => {
    const setup = databaseWith([[{ id: 'm1', status: 'pending_approval', created_by: 'creator' }]]);
    const service = new RoboticsOrchestrationService({ database: setup.database });
    await expect(service.approveMission('m1', { approved: true }, 'creator')).rejects.toMatchObject({ code: 'TWO_PERSON_RULE' });
    expect(setup.client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('AI planning stays advisory and cannot authorize or persist execution', async () => {
    const gateway = { run: jest.fn(async () => ({ success: true, content: 'inspect row 7' })) };
    const service = new RoboticsOrchestrationService({ database: {}, gateway });
    const result = await service.planWithAI({ objective: 'Plan an inspection', deviceId: 'd1' }, 'u1');
    expect(gateway.run).toHaveBeenCalledWith(expect.objectContaining({
      moduleId: 'robotics-orchestration', capability: 'advisory-mission-planning',
    }));
    expect(result).toEqual(expect.objectContaining({ executionAuthorized: false, persistedMission: false, humanApprovalRequired: true }));
  });

  test('rejects adapters without both execution safety methods', () => {
    const service = new RoboticsOrchestrationService({ database: {} });
    expect(() => service.registerAdapter('unsafe', { dispatch: async () => ({ accepted: true }) })).toThrow('emergencyStop');
  });
});
