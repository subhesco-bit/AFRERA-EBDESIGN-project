'use strict';

const assert = require('assert');
const {
  remainingAfterCommit,
  allocateFifo,
  weightedAverageCostPaisePerKg,
  intakeWac,
  issueAtWac,
  splitQtyWeighted,
  settlementAmounts,
  journalBalances,
  settlementJournal,
  paiseFromKgPrice,
} = require('../lotKernel');

describe('lotKernel', () => {
  it('keeps remaining mass on the same body', () => {
    assert.strictEqual(remainingAfterCommit(840000, 400000), 440000);
    assert.throws(() => remainingAfterCommit(510000, 600000));
  });

  it('allocates FIFO and refuses oversell', () => {
    const take = allocateFifo(
      [
        { id: 'a', remainingGrams: 400000 },
        { id: 'b', remainingGrams: 440000 },
      ],
      600000,
    );
    assert.deepStrictEqual(take, [
      { lotId: 'a', qtyGrams: 400000 },
      { lotId: 'b', qtyGrams: 200000 },
    ]);
    assert.throws(() => allocateFifo([{ id: 'a', remainingGrams: 100 }], 200));
  });

  it('blends declared cost as WAC; issues FIFO mass at that average', () => {
    const wac = weightedAverageCostPaisePerKg([
      { id: 'a', remainingGrams: 400000, costPaise: 7400000 },
      { id: 'b', remainingGrams: 600000, costPaise: 9000000 },
    ]);
    assert.strictEqual(wac, 16400);

    const blended = intakeWac(400000, 7400000, 600000, 9000000);
    assert.strictEqual(blended.wacPaisePerKg, 16400);

    const issued = issueAtWac(
      [
        { id: 'a', remainingGrams: 400000, costPaise: 7400000 },
        { id: 'b', remainingGrams: 600000, costPaise: 9000000 },
      ],
      500000,
    );
    assert.strictEqual(issued.issuedCostPaise, paiseFromKgPrice(500000, 16400));
    assert.strictEqual(
      issued.take.reduce((n, t) => n + t.costPaise, 0),
      issued.issuedCostPaise,
    );
    assert.deepStrictEqual(
      issued.take.map((t) => ({ lotId: t.lotId, qtyGrams: t.qtyGrams })),
      [
        { lotId: 'a', qtyGrams: 400000 },
        { lotId: 'b', qtyGrams: 100000 },
      ],
    );
    assert.throws(() => weightedAverageCostPaisePerKg([{ id: 'a', remainingGrams: 100, costPaise: undefined }]));
  });

  it('splits farmgate qty-weighted with remainder on the last cell', () => {
    const split = splitQtyWeighted(
      [
        { cellId: 'c-enghi', qtyGrams: 510000 },
        { cellId: 'c-ronghang', qtyGrams: 400000 },
      ],
      9231000,
    );
    assert.strictEqual(split.reduce((n, s) => n + s.amountPaise, 0), 9231000);
  });

  it('posts a balanced settlement from declared price and freight', () => {
    const amounts = settlementAmounts(510000, 18500, 400);
    assert.strictEqual(amounts.farmgate, 9231000);
    const lines = settlementJournal({ variety: 'Chakhao Poireiton', hoursToPay: 18, ...amounts });
    assert.strictEqual(journalBalances(lines), true);
  });
});
