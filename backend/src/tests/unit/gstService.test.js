'use strict';

jest.mock('../../database/pool', () => ({ query: jest.fn(), connect: jest.fn() }));

const gstService = require('../../services/finance/gstService');
const accounting = require('../../services/finance/enterpriseAccountingService');

describe('canonical GST service', () => {
  beforeEach(() => {
    gstService.pool.query.mockReset();
    gstService.pool.connect.mockReset();
  });

  test('preserves NIL category rates rather than replacing zero with the default', () => {
    expect(gstService.getGSTRate('fruits')).toBe(0);
    expect(gstService.getGSTRate('unknown')).toBe(18);
  });

  test('validates GSTIN structure, state code and checksum', () => {
    expect(gstService.validateGSTNumber('27AAPFU0939F1ZV')).toBe(true);
    expect(gstService.validateGSTNumber('27AAPFU0939F1Z5')).toBe(false);
    expect(gstService.validateGSTNumber('99AAPFU0939F1ZV')).toBe(false);
  });

  test('splits intra-state tax without losing a rounding paisa', () => {
    const result = gstService.calculateTaxComponents({
      taxableValue: 100.05, rate: 5, supplierState: 'AS', placeOfSupply: 'Assam',
    });
    expect(result).toMatchObject({ supplyType: 'intra_state', cgst: 2.5, sgst: 2.5, igst: 0, totalTax: 5 });
    expect(result.cgst + result.sgst).toBe(result.totalTax);
  });

  test('uses IGST for inter-state supplies and assigns reverse charge liability', () => {
    expect(gstService.calculateTaxComponents({ taxableValue: 1250, rate: 18,
      supplierState: 'AS', placeOfSupply: 'WB', reverseCharge: true })).toMatchObject({
      supplyType: 'inter_state', cgst: 0, sgst: 0, igst: 225, totalTax: 225,
      taxLiabilityParty: 'recipient',
    });
  });

  test('makes exempt supplies zero rated even when a rate was supplied', () => {
    expect(gstService.calculateTaxComponents({ taxableValue: 500, rate: 18,
      supplierState: 'AS', placeOfSupply: 'AS', exempt: true })).toMatchObject({
      rate: 0, totalTax: 0, total: 500, exempt: true,
    });
  });

  test('resolves the rate effective on the supply date from the persisted source', async () => {
    gstService.pool.query.mockResolvedValue({ rows: [{ hsn_code: '0902', gst_rate: '5.00', effective_date: '2025-01-01' }] });
    await expect(gstService.resolveEffectiveRate({ hsnCode: '0902', supplyDate: '2026-04-01' }))
      .resolves.toMatchObject({ hsn_code: '0902', gst_rate: 5, source: 'gst_rates_effective_date' });
    expect(gstService.pool.query.mock.calls[0][1]).toEqual(['0902', '2026-04-01', null]);
  });

  test('rejects invalid filing and payment inputs before persistence', async () => {
    await expect(gstService.createReturn({ taxpayerGstNumber: 'bad', returnPeriod: '132026' }))
      .rejects.toMatchObject({ statusCode: 400 });
    await expect(gstService.createPayment({ amount: -1, taxType: 'IGST' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(gstService.pool.query).not.toHaveBeenCalled();
  });

  test('locks workflow rows and rejects illegal return transitions', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 7, return_status: 'accepted' }] })
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    gstService.pool.connect.mockResolvedValueOnce(client);
    await expect(gstService.transitionReturn(7, 'filed')).rejects.toMatchObject({ statusCode: 409 });
    expect(client.query.mock.calls.map((call) => call[0])).toEqual([
      'BEGIN', 'SELECT * FROM gst_returns WHERE id=$1 FOR UPDATE', 'ROLLBACK',
    ]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  test('legacy import delegates to the canonical singleton', () => {
    expect(require('../../services/legacy/gstService')).toBe(gstService);
  });

  test('posts GST liability through the canonical accounting lifecycle', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({ rows: [{ id: 20 }] }) };
    const post = jest.spyOn(accounting, 'createAndPostJournalWithClient')
      .mockResolvedValueOnce({ id: 99, status: 'posted' });

    await expect(gstService.postGSTInvoiceToLedger(client, {
      companyId: 1, invoiceId: 5, invoiceNumber: 'INV-5', invoiceDate: '2026-09-15',
      actorId: '00000000-0000-0000-0000-000000000001', igstAmount: 18,
    })).resolves.toMatchObject({ posted: true, journalEntryId: 99, totalGST: 18 });

    expect(post).toHaveBeenCalledWith(client, expect.objectContaining({
      idempotencyKey: 'gst-invoice:5', actorId: '00000000-0000-0000-0000-000000000001',
      lines: expect.arrayContaining([
        expect.objectContaining({ accountId: 10, debit: 18 }),
        expect.objectContaining({ accountId: 20, credit: 18 }),
      ]),
    }));
    post.mockRestore();
  });
});
