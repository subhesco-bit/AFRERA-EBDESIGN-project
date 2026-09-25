'use strict';

jest.mock('../../../database/pool', () => ({ query: jest.fn(), connect: jest.fn() }));

const stack = require('../farmerVoiceAgentStack');

describe('farmerVoiceAgentStack', () => {
  test('offers keypad navigation and human handoff for low-literacy IVR', () => {
    const menu = stack.menuFor('hi');
    expect(menu.dtmf['1']).toBe('price_inquiry');
    expect(menu.dtmf['0']).toBe('human_handoff');
    expect(menu.text).toContain('0');
  });

  test('routes scheme questions to human review with no autonomous mutation', () => {
    expect(stack.buildDispatch('subsidy_inquiry', { crop: 'rice' })).toMatchObject({
      domain: 'schemes',
      capability: 'scheme_information',
      mode: 'human_review',
      requiresHumanReview: true,
      autonomousMutationAllowed: false,
    });
  });

  test('keeps read-only price requests non-mutating', () => {
    expect(stack.buildDispatch('price_inquiry')).toMatchObject({
      domain: 'market',
      mode: 'read_only',
      requiresHumanReview: false,
      autonomousMutationAllowed: false,
    });
  });

  test('uses stricter confidence for English than Assamese', () => {
    const en = stack.classifyText('price rice', 'en');
    const as = stack.classifyText('price rice', 'as');
    expect(en.threshold).toBeGreaterThan(as.threshold);
  });

  test('reports speech provider truth rather than claiming voice is live', () => {
    const status = stack.capabilityStatus();
    expect(status.dtmfOperational).toBe(true);
    expect(status.textIntentOperational).toBe(true);
    expect(status.highRiskAutonomousActions).toBe(false);
    expect(status.audioStored).toBe(false);
    expect(Array.isArray(status.speechProviders)).toBe(true);
  });
});
