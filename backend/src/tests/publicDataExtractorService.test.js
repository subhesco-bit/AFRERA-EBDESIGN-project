jest.mock('../database/pool', () => ({ query: jest.fn() }));

const service = require('../services/publicDataExtractorService');

describe('public data extractor service', () => {
  it('requires HTTPS and an explicitly approved host', () => {
    expect(() => service.assertSourceUrl('http://data.example.test/feed', ['data.example.test']))
      .toThrow('HTTPS');
    expect(() => service.assertSourceUrl('https://unapproved.example.test/feed', ['data.example.test']))
      .toThrow('not approved');
    expect(service.assertSourceUrl('https://data.example.test/feed', ['data.example.test']).hostname)
      .toBe('data.example.test');
  });

  it('filters records with exact, contains, and numeric predicates', () => {
    const records = [
      { region: 'Assam', value: 12 },
      { region: 'Bihar', value: 3 },
    ];
    expect(service.filterRecords(records, { region: { contains: 'ass' }, value: { gte: 10 } }))
      .toEqual([{ region: 'Assam', value: 12 }]);
  });

  it('produces a stable SHA-256 record identity', () => {
    expect(service.stableRecordHash({ a: 1, b: 2 }))
      .toBe(service.stableRecordHash({ a: 1, b: 2 }));
    expect(service.stableRecordHash({ a: 1, b: 2 })).toMatch(/^[a-f0-9]{64}$/);
  });
});
