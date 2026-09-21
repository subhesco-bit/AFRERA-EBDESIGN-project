const service = require('../src/services/cloneGapClosureService');

describe('clone gap closure controls', () => {
  test('rejects unbalanced journals before persistence', async () => {
    await expect(service.createJournal({journalDate:'2026-09-11',sourceType:'test',sourceId:'1',lines:[{accountCode:'1000',direction:'debit',amount:100},{accountCode:'2000',direction:'credit',amount:90}]})).rejects.toThrow('not balanced');
  });

  test('requires journal lines', async () => {
    await expect(service.createJournal({journalDate:'2026-09-11',sourceType:'test',sourceId:'1',lines:[]})).rejects.toThrow('At least one journal line');
  });
});
