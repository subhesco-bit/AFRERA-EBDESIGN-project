'use strict';

jest.mock('../../../database/pool', () => ({ connect: jest.fn(), query: jest.fn() }));

const pool = require('../../../database/pool');
const accounting = require('../enterpriseAccountingService');

describe('enterpriseAccountingService', () => {
  afterEach(() => jest.clearAllMocks());

  test('validates exact four-decimal double-entry without floating point arithmetic', () => {
    expect(() => accounting.validateLines([
      { accountId: 1, debit: '0.1000', credit: 0 },
      { accountId: 2, debit: '0.2000', credit: 0 },
      { accountId: 3, debit: 0, credit: '0.3000' },
    ])).not.toThrow();
    expect(() => accounting.validateLines([
      { accountId: 1, debit: '100.0001', credit: 0 },
      { accountId: 2, debit: 0, credit: '100.0000' },
    ])).toThrow(/unbalanced/i);
  });

  test.each([
    [[{ accountId: 1, debit: 10, credit: 0 }], /at least two lines/i],
    [[{ accountId: 1, debit: 10, credit: 10 }, { accountId: 2, debit: 0, credit: 20 }], /exactly one/i],
    [[{ accountId: 1, debit: -10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }], /non-negative decimal/i],
    [[{ accountId: 1, debit: '1.00001', credit: 0 }, { accountId: 2, debit: 0, credit: 1 }], /four decimal/i],
  ])('rejects invalid journal lines', (lines, message) => {
    expect(() => accounting.validateLines(lines)).toThrow(message);
  });

  test('creates a draft and all lines in one transaction', async () => {
    const calls = [];
    const client = {
      release: jest.fn(),
      query: jest.fn(async (sql) => {
        calls.push(sql);
        if (sql.includes('SELECT id FROM chart_of_accounts')) return { rows: [{ id: 10 }, { id: 20 }] };
        if (sql.includes('SELECT fp.id')) return { rows: [{ id: 7, status: 'open' }] };
        if (sql.includes('INSERT INTO journal_entries')) return { rows: [{ id: 99, status: 'draft', fiscal_period_id: 7 }] };
        return { rows: [] };
      }),
    };
    pool.connect.mockResolvedValue(client);

    const result = await accounting.createDraftJournal({
      companyId: 1, entryDate: '2026-09-15', description: 'Inventory purchase',
      lines: [{ accountId: 10, debit: '125.2500' }, { accountId: 20, credit: '125.2500' }],
    });

    expect(result).toMatchObject({ id: 99, status: 'draft' });
    expect(calls[0]).toBe('BEGIN');
    expect(calls.filter((sql) => sql.includes('INSERT INTO journal_lines'))).toHaveLength(2);
    expect(calls).toContain('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('rolls back without writing a journal when the invariant fails', async () => {
    const client = { query: jest.fn(async () => ({ rows: [] })), release: jest.fn() };
    pool.connect.mockResolvedValue(client);
    await expect(accounting.createDraftJournal({
      companyId: 1, entryDate: '2026-09-15',
      lines: [{ accountId: 10, debit: '10.00' }, { accountId: 20, credit: '9.99' }],
    })).rejects.toThrow(/unbalanced/i);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query.mock.calls.some(([sql]) => sql.includes('INSERT INTO journal_entries'))).toBe(false);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('never permits a locked accounting period to post', async () => {
    const client = {
      release: jest.fn(),
      query: jest.fn(async (sql) => {
        if (sql.includes('SELECT * FROM journal_entries')) return { rows: [{ id: 4, status: 'draft', company_id: 1, entry_date: '2026-09-15', fiscal_period_id: 8 }] };
        if (sql.includes('SELECT fp.id')) return { rows: [{ id: 8, status: 'locked' }] };
        return { rows: [] };
      }),
    };
    pool.connect.mockResolvedValue(client);
    await expect(accounting.postJournal(4, '00000000-0000-0000-0000-000000000001')).rejects.toThrow(/locked/i);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('enforces irreversible fiscal period transitions', async () => {
    const client = {
      release: jest.fn(),
      query: jest.fn(async (sql) => sql.includes('SELECT * FROM fiscal_periods')
        ? { rows: [{ id: 2, status: 'locked' }] } : { rows: [] }),
    };
    pool.connect.mockResolvedValue(client);
    await expect(accounting.setPeriodStatus(2, 'open')).rejects.toThrow(/locked -> open/i);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });
});
