/**
 * Real tests for the finance/insurance batch (2026-09-07):
 * - ruralFinanceService: EMI math + which schema it queries against
 * - insuranceClaimsService: ownership check that gates the previously-
 *   unauthenticated /status and /payout endpoints
 * - escrowService: route wiring sanity (the escrowRoutes.js dead file was
 *   removed; setupRoutes on escrowService is now the only implementation)
 *
 * These deliberately avoid requiring a live PostgreSQL connection - the
 * pure calculation/authorization functions are exercised directly, and DB
 * calls are asserted to throw a clear "Database not initialized" error
 * rather than silently returning garbage when no pool is configured.
 */

const ruralFinanceService = require('../services/legacy/ruralFinanceService');
const insuranceClaimsService = require('../services/legacy/insuranceClaimsService');
const escrowService = require('../services/legacy/escrowService');

describe('ruralFinanceService.calcEmi', () => {
  it('computes a standard reducing-balance EMI', () => {
    // 100000 principal, 12% p.a., 12 months -> known reducing-balance EMI
    const emi = ruralFinanceService.calcEmi(100000, 12, 12);
    expect(emi).toBeGreaterThan(8800);
    expect(emi).toBeLessThan(8900);
  });

  it('degrades to simple division when the rate is zero', () => {
    expect(ruralFinanceService.calcEmi(12000, 0, 12)).toBe(1000);
  });

  it('rejects a non-positive tenure', () => {
    expect(() => ruralFinanceService.calcEmi(1000, 10, 0)).toThrow(/tenure_months must be positive/);
  });
});

describe('ruralFinanceService.totalInterestOverTerm', () => {
  it('is EMI * months - principal, and positive for a nonzero rate', () => {
    const principal = 50000;
    const rate = 10;
    const months = 6;
    const emi = ruralFinanceService.calcEmi(principal, rate, months);
    const interest = ruralFinanceService.totalInterestOverTerm(principal, rate, months);
    expect(interest).toBeCloseTo(emi * months - principal, 2);
    expect(interest).toBeGreaterThan(0);
  });
});

describe('ruralFinanceService DB-backed functions', () => {
  // No PostgreSQL is configured in the test environment; these assert the
  // function fails loudly (clear error) rather than silently returning
  // wrong data - the exact regression this batch fixed (the old version of
  // this file queried columns - finance_id/village_id/service_type - that
  // do not exist in the real rural_finance table from migration 041, so it
  // would have thrown a raw Postgres "column does not exist" error instead
  // of ever reaching a clean, intentional failure mode).
  it('applyForFinance throws a clear "Database not initialized" error rather than a raw column/pool error', async () => {
    await expect(ruralFinanceService.applyForFinance({
      reu_id: 'reu-1', financial_product_type: 'working_capital',
      loan_amount: 1000, interest_rate: 10, tenure_months: 12,
    })).rejects.toThrow(/Database not initialized/);
  });

  it('listFinanceRecords throws the same clear error with no DB connection', async () => {
    await expect(ruralFinanceService.listFinanceRecords({})).rejects.toThrow(/Database not initialized/);
  });
});

describe('insuranceClaimsService.isClaimOwner', () => {
  it('allows admin/adjuster/superadmin regardless of claim owner', () => {
    for (const role of ['admin', 'adjuster', 'superadmin']) {
      expect(insuranceClaimsService.isClaimOwner({ user: { id: 'other', role } }, { farmer_id: 'someone-else' })).toBe(true);
    }
  });

  it('allows the claim owner', () => {
    const req = { user: { id: 'farmer-1', role: 'farmer' } };
    expect(insuranceClaimsService.isClaimOwner(req, { farmer_id: 'farmer-1' })).toBe(true);
  });

  it('denies a non-owner, non-privileged user', () => {
    const req = { user: { id: 'farmer-2', role: 'farmer' } };
    expect(insuranceClaimsService.isClaimOwner(req, { farmer_id: 'farmer-1' })).toBe(false);
  });

  it('fails open when the claim record has no farmer_id (partial data)', () => {
    const req = { user: { id: 'farmer-2', role: 'farmer' } };
    expect(insuranceClaimsService.isClaimOwner(req, {})).toBe(true);
  });
});

describe('escrowService route wiring', () => {
  it('exposes setupRoutes as the single mounting mechanism (escrowRoutes.js dead file removed)', () => {
    expect(typeof escrowService.setupRoutes).toBe('function');
  });

  it('exposes listEscrowTransactions and getEscrowStatus (previously missing, called by the dead escrowRoutes.js)', () => {
    expect(typeof escrowService.listEscrowTransactions).toBe('function');
    expect(typeof escrowService.getEscrowStatus).toBe('function');
  });
});
