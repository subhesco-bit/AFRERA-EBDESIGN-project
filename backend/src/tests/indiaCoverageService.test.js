'use strict';

const { validateStageChange, REQUIRED_ACTIVE_EVIDENCE } = require('../services/platform/indiaCoverageService');

describe('national market versus local service activation', () => {
  test('cannot claim active local services without district, language, scheme and fulfillment evidence', () => {
    expect(() => validateStageChange('candidate', 'active', { districtCoverage: 'all' }, 'Local service launch after partner review')).toThrow('verified evidence');
  });

  test('accepts a named, evidenced activation decision', () => {
    const evidence = Object.fromEntries(REQUIRED_ACTIVE_EVIDENCE.map((key) => [key, { source: 'verified local operator record' }]));
    expect(validateStageChange('candidate', 'active', evidence, 'District operators and partners signed off')).toBe(true);
  });

  test('rejects silent or duplicate stage changes', () => {
    expect(() => validateStageChange('candidate', 'candidate', {}, 'Specific and long enough rollout reason')).toThrow('unchanged');
    expect(() => validateStageChange('candidate', 'pilot', {}, 'short')).toThrow('rationale');
  });
});
