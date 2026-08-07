/**
 * Tests for the MCDA framework and the business rules recovered from the
 * v43 prototype.
 *
 * These rules affect whether a farmer gets a payout, a loan, or a fair price,
 * so the tests assert on the REASONING as well as the number — an unexplained
 * score is not an acceptable output here.
 */

const { mcda, rankOptions } = require('../core/mcda');
const ds = require('../services/decisionSupportService');

describe('MCDA framework', () => {
  test('computes the weighted total exactly', () => {
    const r = mcda([
      { name: 'A', weight: 0.6, score: 80, dataQuality: 'real' },
      { name: 'B', weight: 0.4, score: 50, dataQuality: 'assumed' }
    ]);
    expect(r.total).toBe(68); // 0.6*80 + 0.4*50
  });

  test('derives confidence from data provenance, not from the score', () => {
    const allReal = mcda([{ name: 'A', weight: 1, score: 20, dataQuality: 'real' }]);
    const allAssumed = mcda([{ name: 'A', weight: 1, score: 95, dataQuality: 'assumed' }]);
    // A high score built on assumptions must NOT read as confident.
    expect(allReal.confidence).toBeGreaterThan(allAssumed.confidence);
    expect(allAssumed.confidenceLabel).toMatch(/mostly assumptions/);
  });

  test('rejects a mis-specified model rather than silently renormalising', () => {
    expect(() => mcda([{ name: 'X', weight: 0.5, score: 50 }])).toThrow(/sum to 1/);
  });

  test('reports which criterion the result is most fragile to', () => {
    const r = mcda([
      { name: 'Dominant', weight: 0.8, score: 90, dataQuality: 'real' },
      { name: 'Minor', weight: 0.2, score: 90, dataQuality: 'real' }
    ]);
    expect(r.mostSensitiveTo).toBe('Dominant');
  });

  test('rejects empty or malformed criteria', () => {
    expect(() => mcda([])).toThrow();
    expect(() => mcda([{ weight: 1, score: 50 }])).toThrow(/name/);
    expect(() => mcda([{ name: 'A', weight: 1, score: NaN }])).toThrow(/score/);
  });

  test('flags a close call rather than declaring a winner', () => {
    const close = rankOptions([
      { option: 'a', criteria: [{ name: 'c', weight: 1, score: 70, dataQuality: 'real' }] },
      { option: 'b', criteria: [{ name: 'c', weight: 1, score: 68, dataQuality: 'real' }] }
    ]);
    expect(close.decisive).toBe(false);
    expect(close.note).toMatch(/close call/);
  });
});

describe('buyVsRentDecision', () => {
  test('applies the small/marginal farmer subsidy band', () => {
    const r = ds.buyVsRentDecision({ priceNew: 250000, rentDay: 1200, usesPerSeason: 4, cashTight: true });
    expect(r.economics.subsidyPct).toBe(50);
    expect(r.economics.netPurchaseCost).toBe(125000);
  });

  test('computes a break-even point in uses', () => {
    const r = ds.buyVsRentDecision({ priceNew: 100000, rentDay: 1000, usesPerSeason: 5 });
    expect(r.economics.breakEvenUses).toBeGreaterThan(0);
  });

  test('rejects a zero price rather than dividing by it', () => {
    expect(() => ds.buyVsRentDecision({ priceNew: 0, rentDay: 100, usesPerSeason: 1 })).toThrow();
  });

  test('returns a recommendation with both options scored', () => {
    const r = ds.buyVsRentDecision({ priceNew: 250000, rentDay: 1200, usesPerSeason: 4 });
    expect(['buy', 'rent']).toContain(r.recommendation);
    expect(r.options).toHaveLength(2);
  });
});

describe('farmerSelectionDecision', () => {
  test('weights farmer development above raw price', () => {
    // The cheaper farmer has a far weaker development index and should lose:
    // the platform exists to develop farmers, so cheapest-wins would work
    // against its purpose.
    const r = ds.farmerSelectionDecision({
      candidates: [
        { farmer: 'High FDI', price: 120, fdiScore: 88, fulfilledOrders: 14 },
        { farmer: 'Cheaper', price: 95, fdiScore: 52, fulfilledOrders: 9 }
      ]
    });
    expect(r.ranked[0].farmer).toBe('High FDI');
  });

  test('handles an empty candidate list', () => {
    expect(ds.farmerSelectionDecision({ candidates: [] })).toBeNull();
  });

  test('marks a farmer with no track record as assumed data', () => {
    const r = ds.farmerSelectionDecision({
      candidates: [{ farmer: 'New', price: 100, fdiScore: 60, fulfilledOrders: 0 }]
    });
    const track = r.ranked[0].result.criteria.find((c) => c.name.includes('Fulfilment'));
    expect(track.dataQuality).toBe('assumed');
  });
});

describe('claimFraudScore', () => {
  test('every point added carries a stated reason', () => {
    const r = ds.claimFraudScore({
      documentsSubmitted: 1, documentsRequired: 4,
      lateDays: 45, amount: 90000, sumInsured: 100000, priorClaims: 3
    });
    expect(r.band).toBe('high');
    expect(r.reasons.length).toBeGreaterThanOrEqual(4);
    expect(r.explainable).toBe(true);
  });

  test('a high score triggers investigation, never automatic rejection', () => {
    const r = ds.claimFraudScore({
      documentsSubmitted: 0, documentsRequired: 4,
      lateDays: 90, amount: 99000, sumInsured: 100000, priorClaims: 5
    });
    expect(r.action).toBe('investigate');
    expect(r.action).not.toBe('reject');
  });

  test('a clean claim is auto-processed and says why', () => {
    const r = ds.claimFraudScore({
      documentsSubmitted: 4, documentsRequired: 4,
      lateDays: 2, amount: 1000, sumInsured: 100000, priorClaims: 0
    });
    expect(r.action).toBe('auto_process');
    expect(r.reasons[0]).toMatch(/No risk flags/);
  });

  test('score is capped at 100', () => {
    const r = ds.claimFraudScore({
      documentsSubmitted: 0, documentsRequired: 9,
      lateDays: 999, amount: 1e9, sumInsured: 1, priorClaims: 99
    });
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe('moqPrice', () => {
  test.each([
    [100, 0],
    [300, 5],
    [600, 9],
    [5000, 14]
  ])('quantity %i falls in the %i%% tier', (qty, discPct) => {
    expect(ds.moqPrice({ basePrice: 100, qty }).discountPct).toBe(discPct);
  });

  test('reports the saving, not just the price', () => {
    const r = ds.moqPrice({ basePrice: 100, qty: 600 });
    expect(r.unit).toBe(91);
    expect(r.savings).toBe(9 * 600);
  });
});

describe('benchmarkVerdict', () => {
  const bench = { min: 100, max: 150, median: 120, count: 8 };

  test('warns a farmer who is UNDERSELLING their own harvest', () => {
    // The marketplace must protect the producer, not only the buyer.
    const r = ds.benchmarkVerdict({ myFloor: 50, benchmark: bench });
    expect(r.level).toBe('info');
    expect(r.message).toMatch(/underselling/);
  });

  test('warns a farmer priced too high to sell', () => {
    expect(ds.benchmarkVerdict({ myFloor: 500, benchmark: bench }).level).toBe('warn');
  });

  test('confirms a sellable position', () => {
    expect(ds.benchmarkVerdict({ myFloor: 120, benchmark: bench }).level).toBe('ok');
  });

  test('says so honestly when there is no peer data', () => {
    expect(ds.benchmarkVerdict({ myFloor: 120, benchmark: null }).level).toBe('none');
    expect(ds.benchmarkVerdict({ myFloor: 120, benchmark: { count: 0 } }).level).toBe('none');
  });
});
