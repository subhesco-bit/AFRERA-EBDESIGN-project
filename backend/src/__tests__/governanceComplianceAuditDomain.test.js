/**
 * Real tests for the Governance/Compliance/Audit batch (2026-09-07).
 *
 * Covers:
 * - complianceService: TDS rate lookup/no-PAN surcharge, RCM math, input
 *   validation (all pure or DB-backed via database/pool.js's generic
 *   statement mock, which is self-contained in test mode).
 * - auditService: event logging + report shape, via the same pool mock.
 * - governanceService: village/CSR CRUD round-trips through the mock.
 * - The mountRoute() bug this batch found and fixed in backend/src/index.js:
 *   `typeof someExpressRouter === 'object'` is always false because an
 *   Express Router is a callable function with .use/.get/etc. attached, not
 *   a plain object. That check silently rejected every one of the ~112
 *   generated M001..M150 module mounts (confirmed live: 0/112+ mounted
 *   before the fix, 216+ after, across a full backend boot). This test
 *   guards the assumption directly rather than re-running the whole server.
 */

'use strict';

const complianceService = require('../services/legacy/complianceService');
const auditService = require('../services/legacy/auditService');
const governanceService = require('../services/legacy/governanceService');

describe('mountRoute() router-detection assumption (regression for the M008/M077/... mount bug)', () => {
  it('an Express Router is a function, not a plain object — `typeof x === "object"` must never gate router validity', () => {
    const router = require('express').Router();
    expect(typeof router).toBe('function');
    expect(typeof router.use).toBe('function');
    // This is the exact condition backend/src/index.js's mountRoute() now uses.
    expect(!router || typeof router.use !== 'function').toBe(false);
    // And this is the condition it used to use, which wrongly rejected the router above.
    expect(typeof router !== 'object' || typeof router.use !== 'function').toBe(true);
  });
});

describe('complianceService.TDS_RATES', () => {
  it('exposes the statutory section/rate for every deductee type used by deductTds', () => {
    expect(complianceService.TDS_RATES.transporter).toEqual({ section: '194C', rate: 1.0, note: expect.any(String) });
    expect(complianceService.TDS_RATES.professional.rate).toBe(10.0);
  });
});

describe('complianceService.deductTds', () => {
  it('rejects an unknown deductee type', async () => {
    await expect(complianceService.deductTds({
      deducteeType: 'not-a-real-type', paymentAmountInr: 1000,
    })).rejects.toThrow(/Unknown deductee type/);
  });

  it('rejects a non-positive payment amount', async () => {
    await expect(complianceService.deductTds({
      deducteeType: 'vendor', paymentAmountInr: 0,
    })).rejects.toThrow(/paymentAmountInr must be positive/);
  });

  it('applies the normal contractor rate when a PAN is on record', async () => {
    const result = await complianceService.deductTds({
      deducteeId: 'ded-1', deducteeName: 'Test Vendor', deducteePan: 'ABCDE1234F',
      deducteeType: 'vendor', paymentAmountInr: 10000,
    });
    expect(result.deductee_type).toBe('vendor');
    expect(Number(result.tds_rate_pct)).toBe(2.0);
    expect(result.higher_rate_no_pan).toBe(false);
    expect(result.netPayableInr).toBeCloseTo(10000 - result.tds_amount_inr, 2);
  });

  it('applies the flat 20% s.206AA rate when no PAN is furnished', async () => {
    const result = await complianceService.deductTds({
      deducteeName: 'No PAN Vendor', deducteeType: 'vendor', paymentAmountInr: 10000,
    });
    expect(Number(result.tds_rate_pct)).toBe(20.0);
    expect(result.higher_rate_no_pan).toBe(true);
    expect(result.explanation).toMatch(/206AA/);
  });
});

describe('complianceService.recordRcm / rcmOutstanding', () => {
  it('rejects a non-positive taxable value', async () => {
    await expect(complianceService.recordRcm({
      supplierName: 'Farmer A', supplyDescription: 'Paddy', taxableValueInr: 0,
      gstRatePct: 5, period: '01-2027',
    })).rejects.toThrow(/taxableValueInr must be positive/);
  });

  it('records an RCM liability with the buyer-liable note and correct ITC framing', async () => {
    const result = await complianceService.recordRcm({
      supplierName: 'Farmer A', supplyDescription: 'Paddy', taxableValueInr: 5000,
      gstRatePct: 5, period: '01-2027', itcEligible: false,
    });
    expect(result.note).toMatch(/Liability sits with the BUYER/);
    expect(result.note).toMatch(/real cost, not a timing difference/);
  });
});

describe('auditService.logEvent / getRecentEvents', () => {
  it('logs an event and it is retrievable via getRecentEvents', async () => {
    const logged = await auditService.logEvent({
      userId: 'user-1', action: 'compliance_review', entityType: 'compliance_report',
      entityId: 'cr-1', changes: { status: 'reviewed' }, status: 'success',
    });
    expect(logged.action).toBe('compliance_review');
    expect(logged.user_id).toBe('user-1');

    const recent = await auditService.getRecentEvents(10);
    expect(Array.isArray(recent)).toBe(true);
    expect(recent.some((e) => e.id === logged.id)).toBe(true);
  });
});

describe('governanceService villages + CSR round-trip', () => {
  it('creates a village and reads it back with getVillages', async () => {
    const created = await governanceService.createVillage({
      name: 'Test Village', district: 'Test District', state: 'Assam',
    });
    expect(created.name).toBe('Test Village');

    const list = await governanceService.getVillages({});
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((v) => v.id === created.id)).toBe(true);
  });

  it('creates a CSR project and reads it back', async () => {
    // csr_projects (migration 012): name and organization are NOT NULL;
    // the field is `name`, not `title` - matches governanceModule.js's
    // req.body passthrough into createCSRProject().
    const project = await governanceService.createCSRProject({
      name: 'Well Rehabilitation', organization: 'Test Org', budget: 250000,
    });
    expect(project.name).toBe('Well Rehabilitation');

    const fetched = await governanceService.getCSRProject(project.id);
    expect(fetched).toBeTruthy();
    expect(fetched.id).toBe(project.id);
  });
});
