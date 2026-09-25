const fs = require('fs');
const os = require('os');
const path = require('path');
const { SignalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { EventSchemaRegistry } = require('../core/eventSchemaRegistry');
const { EventNervousSystem } = require('../core/eventNervousSystem');

describe('Event standards compatibility', () => {
  it('emits CloudEvents-compatible context while preserving AFRERA aliases', async () => {
    const registry = new EventSchemaRegistry();
    registry.register(SIGNAL.TEMPERATURE_BREACH, '1.0.0', { required: ['temp'], payloadSchema: { type: 'object', required: ['temp'] } });
    const bus = new SignalBus();
    const nervous = new EventNervousSystem({ bus, registry });
    const result = await nervous.publish(SIGNAL.TEMPERATURE_BREACH, { temp: 13.2 }, { source: 'sensor-12', entityId: 'SHIP-1', severity: SEVERITY.CRITICAL });
    expect(result.event).toEqual(expect.objectContaining({ specversion: '1.0', id: expect.any(String), source: '/afrera/sensor-12', type: SIGNAL.TEMPERATURE_BREACH, subject: 'SHIP-1', datacontenttype: 'application/json', data: { temp: 13.2 } }));
    expect(result.event.eventId).toBe(result.event.id);
    expect(result.event.payload).toEqual(result.event.data);
    expect(result.signal.cloudEvent.id).toBe(result.event.id);
  });

  it('adds OpenTelemetry-compatible messaging attributes', async () => {
    const registry = new EventSchemaRegistry();
    registry.register('ops.test', '1.0.0', {});
    const nervous = new EventNervousSystem({ bus: new SignalBus(), registry });
    const result = await nervous.publish('ops.test', { ok: true });
    expect(result.event.telemetry).toEqual(expect.objectContaining({ 'messaging.system': 'afrera-signal-bus', 'messaging.operation.name': 'publish', 'messaging.message.id': result.event.id, 'messaging.destination.name': 'ops.test' }));
  });

  it('generates an AsyncAPI 3.1 contract from registered schemas', async () => {
    const registry = new EventSchemaRegistry();
    registry.register('risk.claim.submitted', '1.0.0', { required: ['claimId'], description: 'Claim intake', payloadSchema: { type: 'object', required: ['claimId'] } });
    const nervous = new EventNervousSystem({ bus: new SignalBus(), registry });
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrera-asyncapi-'));
    const file = path.join(root, 'asyncapi.json');
    const written = await nervous.writeAsyncApiContract(file);
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(written).toEqual(expect.objectContaining({ asyncapi: '3.1.0', channels: 1 }));
    expect(doc.asyncapi).toBe('3.1.0');
    expect(Object.keys(doc.channels)).toHaveLength(1);
    expect(doc['x-event-envelope']).toContain('CloudEvents');
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('uses strong UUID identifiers in signal and decision infrastructure', () => {
    const signalSource = fs.readFileSync(path.resolve(__dirname, '../core/signalBus.js'), 'utf8');
    const decisionSource = fs.readFileSync(path.resolve(__dirname, '../core/decisionEngine.js'), 'utf8');
    expect(signalSource).toContain('crypto.randomUUID()');
    expect(decisionSource).toContain("'dec_' + crypto.randomUUID()");
    expect(signalSource).not.toMatch(/Math\.random\s*\(/);
  });

  it('ships a checked-in AsyncAPI integration contract', () => {
    const doc = require('../contracts/asyncapi-events.json');
    expect(doc.asyncapi).toBe('3.1.0');
    expect(Object.keys(doc.channels).length).toBeGreaterThanOrEqual(5);
    expect(doc['x-cloudevents'].specversion).toBe('1.0');
    expect(doc['x-observability'].requiredAttributes).toContain('messaging.message.id');
  });
});
