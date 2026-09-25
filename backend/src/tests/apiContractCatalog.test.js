const path = require('path');
const fs = require('fs');
const { SIGNAL } = require('../core/signalBus');

describe('API and event contract catalog', () => {
  it('contracts every registered signal type without pretending generic payloads are detailed', () => {
    const contract = require('../contracts/asyncapi-events-all.json');
    const addresses = new Set(Object.values(contract.channels).map((channel) => String(channel.address).replace(/\//g, '.')));
    const signalValues = Object.values(SIGNAL);
    expect(addresses.size).toBe(signalValues.length);
    for (const eventType of signalValues) expect(addresses.has(eventType)).toBe(true);
    expect(contract['x-afrera-governance'].signalCount).toBe(signalValues.length);
    expect(contract['x-afrera-governance'].genericEnvelopeContracts).toBeGreaterThan(0);
    expect(contract['x-afrera-governance'].detailedPayloadContracts).toBeGreaterThan(0);
  });

  it('keeps the generated catalog typed and fully event-covered', () => {
    const manifestPath = path.resolve(__dirname, '../../../.audit/phase-program/api-contract-catalog/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.restServerOperations).toBeGreaterThan(0);
    expect(manifest.restClientCalls).toBeGreaterThan(0);
    expect(manifest.discardedGenericMethodCalls).toBeGreaterThan(0);
    expect(manifest.signalTypes).toBe(Object.keys(SIGNAL).length);
    expect(manifest.governedEventContracts).toBe(Object.keys(SIGNAL).length);
    expect(manifest.uncontractedSignalTypes).toBe(0);
    expect(manifest.graphqlStatus).toMatch(/ABSENT|DISCOVERED/);
  });
});
