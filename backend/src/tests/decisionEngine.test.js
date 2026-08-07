/**
 * Tests for the signal bus and cross-module decision engine.
 *
 * The negative cases matter as much as the positive ones here: an engine that
 * fires on every signal is noise, and noise gets ignored. Several tests below
 * assert that a decision is NOT made.
 */

const { SignalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { DecisionEngine, ACTION } = require('../core/decisionEngine');

function freshEngine() {
  const bus = new SignalBus();
  const engine = new DecisionEngine(bus);
  engine.start();
  return { bus, engine };
}

describe('SignalBus', () => {
  test('emits to exact type, domain wildcard, and firehose subscribers', () => {
    const bus = new SignalBus();
    const exact = jest.fn();
    const wildcard = jest.fn();
    const firehose = jest.fn();

    bus.onSignal(SIGNAL.TEMPERATURE_BREACH, exact);
    bus.onSignal('iot.*', wildcard);
    bus.onSignal('*', firehose);

    bus.emitSignal(SIGNAL.TEMPERATURE_BREACH, { temp: 12 }, { source: 'test' });

    expect(exact).toHaveBeenCalledTimes(1);
    expect(wildcard).toHaveBeenCalledTimes(1);
    expect(firehose).toHaveBeenCalledTimes(1);
  });

  test('a throwing subscriber does not break the emitter or other subscribers', () => {
    const bus = new SignalBus();
    const healthy = jest.fn();

    bus.onSignal(SIGNAL.ORDER_PLACED, () => {
      throw new Error('subscriber exploded');
    });
    bus.onSignal(SIGNAL.ORDER_PLACED, healthy);

    expect(() =>
      bus.emitSignal(SIGNAL.ORDER_PLACED, {}, { source: 'test' })
    ).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
  });

  test('history is bounded (no unbounded growth in a long-lived process)', () => {
    const bus = new SignalBus();
    for (let i = 0; i < 600; i++) {
      bus.emitSignal(SIGNAL.ORDER_PLACED, { i }, { source: 'test' });
    }
    expect(bus.stats().buffered).toBeLessThanOrEqual(bus.stats().capacity);
  });

  test('recent() filters by type, entity and severity', () => {
    const bus = new SignalBus();
    bus.emitSignal(SIGNAL.ORDER_PLACED, {}, { source: 't', entityId: 'A' });
    bus.emitSignal(SIGNAL.FRAUD_SUSPECTED, {}, { source: 't', entityId: 'B', severity: SEVERITY.CRITICAL });

    expect(bus.recent({ type: SIGNAL.ORDER_PLACED })).toHaveLength(1);
    expect(bus.recent({ entityId: 'B' })).toHaveLength(1);
    expect(bus.recent({ minSeverity: SEVERITY.CRITICAL })).toHaveLength(1);
  });
});

describe('DecisionEngine — reflex path', () => {
  test('EMERGENCY severity escalates immediately regardless of type', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.RECALL_ISSUED, {}, { severity: SEVERITY.EMERGENCY, source: 'test' });

    const d = engine.recentDecisions().find((x) => x.rule === 'reflex.emergency_escalation');
    expect(d).toBeDefined();
    expect(d.mode).toBe('reflex');
    expect(d.requiresHuman).toBe(true);
    expect(d.actions).toContain(ACTION.ESCALATE_HUMAN);
  });

  test('non-emergency severity does not trigger the reflex', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.ORDER_PLACED, {}, { severity: SEVERITY.INFO, source: 'test' });

    expect(
      engine.recentDecisions().find((x) => x.rule === 'reflex.emergency_escalation')
    ).toBeUndefined();
  });
});

describe('DecisionEngine — cold chain correlation', () => {
  test('a single isolated breach is treated as operational noise', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.TEMPERATURE_BREACH, { temp: 9 }, { source: 'iot', entityId: 'S1' });

    expect(
      engine.recentDecisions().find((d) => d.rule === 'coldchain.compound_breach')
    ).toBeUndefined();
  });

  test('breach corroborated by delay and shelf-life escalates and opens a claim', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.TEMPERATURE_BREACH, {}, { source: 'iot', entityId: 'S2' });
    bus.emitSignal(SIGNAL.SHIPMENT_DELAYED, {}, { source: 'logistics', entityId: 'S2' });
    bus.emitSignal(SIGNAL.SHELF_LIFE_CRITICAL, {}, { source: 'shelfLife', entityId: 'S2' });
    bus.emitSignal(SIGNAL.TEMPERATURE_BREACH, {}, { source: 'iot', entityId: 'S2' });

    const d = engine.recentDecisions().find((x) => x.rule === 'coldchain.compound_breach');
    expect(d).toBeDefined();
    expect(d.actions).toEqual(expect.arrayContaining([ACTION.HOLD_SHIPMENT, ACTION.OPEN_CLAIM]));
    expect(d.requiresHuman).toBe(true);
    expect(d.rationale).toMatch(/S2/);
  });

  test('signals for a different shipment do not cross-contaminate', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.TEMPERATURE_BREACH, {}, { source: 'iot', entityId: 'S3' });
    bus.emitSignal(SIGNAL.SHIPMENT_DELAYED, {}, { source: 'logistics', entityId: 'OTHER' });
    bus.emitSignal(SIGNAL.SHELF_LIFE_CRITICAL, {}, { source: 'shelfLife', entityId: 'OTHER' });

    expect(
      engine.recentDecisions().find((d) => d.rule === 'coldchain.compound_breach')
    ).toBeUndefined();
  });
});

describe('DecisionEngine — fraud with financial exposure', () => {
  test('low fraud probability does not act', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.FRAUD_SUSPECTED, { probability: 0.3 }, { source: 'ai', entityId: 'U1' });

    expect(
      engine.recentDecisions().find((d) => d.rule === 'risk.fraud_with_payment_exposure')
    ).toBeUndefined();
  });

  test('high probability with an in-flight payment freezes the payout', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.PAYMENT_RECEIVED, { amount: 1000 }, { source: 'orders', entityId: 'U2' });
    bus.emitSignal(SIGNAL.FRAUD_SUSPECTED, { probability: 0.9 }, { source: 'ai', entityId: 'U2' });

    const d = engine.recentDecisions().find((x) => x.rule === 'risk.fraud_with_payment_exposure');
    expect(d).toBeDefined();
    expect(d.actions).toEqual(
      expect.arrayContaining([ACTION.BLOCK_TRANSACTION, ACTION.FREEZE_PAYOUT, ACTION.ESCALATE_HUMAN])
    );
  });

  test('high probability without payment exposure blocks but does not freeze', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.FRAUD_SUSPECTED, { probability: 0.7 }, { source: 'ai', entityId: 'U3' });

    const d = engine.recentDecisions().find((x) => x.rule === 'risk.fraud_with_payment_exposure');
    expect(d).toBeDefined();
    expect(d.actions).toContain(ACTION.BLOCK_TRANSACTION);
    expect(d.actions).not.toContain(ACTION.FREEZE_PAYOUT);
  });
});

describe('DecisionEngine — forecast trust gating', () => {
  test('an untrustworthy forecast is ignored', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      { accuracy: 0.4, trend: 20, forecast: [100, 110] },
      { source: 'ai', entityId: 'P1' }
    );

    expect(
      engine.recentDecisions().find((d) => d.rule === 'commerce.demand_shift_response')
    ).toBeUndefined();
  });

  test('explicitly insufficient data is ignored even at high accuracy', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      { accuracy: 0.95, trend: 20, forecast: [100, 110], insufficientData: true },
      { source: 'ai', entityId: 'P2' }
    );

    expect(
      engine.recentDecisions().find((d) => d.rule === 'commerce.demand_shift_response')
    ).toBeUndefined();
  });

  test('a trustworthy rising forecast recommends restock', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      { accuracy: 0.9, trend: 15, forecast: [100, 110, 120] },
      { source: 'ai', entityId: 'P3' }
    );

    const d = engine.recentDecisions().find((x) => x.rule === 'commerce.demand_shift_response');
    expect(d).toBeDefined();
    expect(d.actions).toContain(ACTION.RECOMMEND_RESTOCK);
  });

  test('a flat trend is not acted on', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      { accuracy: 0.95, trend: 0.1, forecast: [100, 100, 100] },
      { source: 'ai', entityId: 'P4' }
    );

    expect(
      engine.recentDecisions().find((d) => d.rule === 'commerce.demand_shift_response')
    ).toBeUndefined();
  });
});

describe('DecisionEngine — resilience and auditability', () => {
  test('a failing rule does not prevent other rules from running', () => {
    const { bus, engine } = freshEngine();
    engine.addRule({
      id: 'test.broken',
      triggers: [SIGNAL.RECALL_ISSUED],
      evaluate: () => {
        throw new Error('rule is broken');
      }
    });

    expect(() =>
      bus.emitSignal(SIGNAL.RECALL_ISSUED, {}, { severity: SEVERITY.EMERGENCY, source: 't' })
    ).not.toThrow();

    // The emergency reflex still fired despite the broken rule.
    expect(
      engine.recentDecisions().find((d) => d.rule === 'reflex.emergency_escalation')
    ).toBeDefined();
  });

  test('every decision carries a rationale and its causing signals', () => {
    const { bus, engine } = freshEngine();
    bus.emitSignal(SIGNAL.RECALL_ISSUED, {}, { severity: SEVERITY.EMERGENCY, source: 't' });

    const d = engine.recentDecisions()[0];
    expect(typeof d.rationale).toBe('string');
    expect(d.rationale.length).toBeGreaterThan(10);
    expect(Array.isArray(d.causedBy)).toBe(true);
    expect(d.causedBy.length).toBeGreaterThan(0);
    expect(d.timestamp).toBeDefined();
  });

  test('decisions are re-emitted onto the bus for effectors to consume', () => {
    const { bus, engine } = freshEngine();
    const effector = jest.fn();
    bus.onSignal(SIGNAL.DECISION_MADE, effector);

    bus.emitSignal(SIGNAL.RECALL_ISSUED, {}, { severity: SEVERITY.EMERGENCY, source: 't' });

    expect(effector).toHaveBeenCalled();
    expect(engine.recentDecisions().length).toBeGreaterThan(0);
  });

  test('decision history is bounded', () => {
    const { bus, engine } = freshEngine();
    for (let i = 0; i < 250; i++) {
      bus.emitSignal(SIGNAL.RECALL_ISSUED, {}, { severity: SEVERITY.EMERGENCY, source: 't' });
    }
    expect(engine.decisions.length).toBeLessThanOrEqual(engine.maxDecisions);
  });
});
