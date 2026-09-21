'use strict';

const { AUTONOMY } = require('../core/ai/capabilityClasses');
const { DOMAIN_BINDINGS, authorizeDomain } = require('../core/ai/domainCapabilityContract');

describe('seven-class domain capability governance', () => {
  test('every binding resolves to a declared governance class', () => {
    const { CLASSES } = require('../core/ai/capabilityClasses');
    Object.values(DOMAIN_BINDINGS).forEach((binding) => expect(CLASSES[binding.classId]).toBeDefined());
  });

  test('clinical and veterinary guidance remains advisory even with complete evidence', () => {
    const binding = DOMAIN_BINDINGS['veterinary.guidance'];
    const evidence = Object.fromEntries(binding.evidence.map((key) => [key, 'recorded']));
    expect(authorizeDomain('veterinary.guidance', AUTONOMY.ADVISE, evidence).allowed).toBe(true);
    expect(authorizeDomain('veterinary.guidance', AUTONOMY.ACT, evidence)).toMatchObject({ allowed: false, reason: 'autonomy_exceeded' });
  });

  test('reflex is confined to classified preauthorized security signals', () => {
    const evidence = Object.fromEntries(DOMAIN_BINDINGS['security.fraud_freeze'].evidence.map((key) => [key, 'recorded']));
    expect(authorizeDomain('security.fraud_freeze', AUTONOMY.REFLEX, evidence).allowed).toBe(true);
    expect(authorizeDomain('commerce.dynamic_pricing', AUTONOMY.REFLEX, evidence).reason).toBe('autonomy_exceeded');
  });

  test('incomplete source evidence and unclassified domains fail closed', () => {
    expect(authorizeDomain('weather.advisory', AUTONOMY.ADVISE, { district: 'Kohima' })).toMatchObject({ allowed: false, reason: 'missing_evidence' });
    expect(authorizeDomain('unknown', AUTONOMY.ADVISE, {})).toMatchObject({ allowed: false, reason: 'unclassified_domain' });
  });
});
