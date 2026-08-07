/**
 * Unit tests for the statistics utilities that back the AI services.
 *
 * These assert against hand-computable known values (and, where relevant,
 * textbook results) rather than snapshots, so a regression in the maths is
 * caught rather than silently re-baselined.
 */

const stats = require('../utils/statistics');

describe('descriptive statistics', () => {
  test('mean', () => {
    expect(stats.mean([1, 2, 3, 4])).toBe(2.5);
    expect(stats.mean([])).toBe(0);
  });

  test('median handles odd and even lengths', () => {
    expect(stats.median([3, 1, 2])).toBe(2);
    expect(stats.median([1, 2, 3, 4])).toBe(2.5);
  });

  test('stdDev uses the sample (n-1) basis', () => {
    // Textbook series with known sample SD
    expect(stats.stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138089935, 8);
    expect(stats.stdDev([5])).toBe(0);
  });

  test('percentile interpolates', () => {
    expect(stats.percentile([1, 2, 3, 4], 0)).toBe(1);
    expect(stats.percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(stats.percentile([1, 2, 3, 4], 1)).toBe(4);
  });

  test('coerces numeric strings (pg returns NUMERIC as string)', () => {
    expect(stats.mean(['10', '20', '30'])).toBe(20);
  });
});

describe('linearRegression', () => {
  test('recovers slope and intercept of a perfect line y = 2x + 1', () => {
    const { slope, intercept, r2 } = stats.linearRegression([1, 3, 5, 7, 9]);
    expect(slope).toBeCloseTo(2, 10);
    expect(intercept).toBeCloseTo(1, 10);
    expect(r2).toBeCloseTo(1, 10);
  });

  test('flat series has zero slope', () => {
    expect(stats.linearRegression([5, 5, 5, 5]).slope).toBe(0);
  });
});

describe('correlation', () => {
  test('identical series correlate at 1, inverted at -1', () => {
    expect(stats.correlation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
    expect(stats.correlation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1, 10);
  });
});

describe('holtLinearForecast', () => {
  test('extrapolates a linear ramp', () => {
    const { forecast } = stats.holtLinearForecast([10, 20, 30, 40, 50], 3, 0.8, 0.5);
    expect(forecast[0]).toBeGreaterThan(50);
    expect(forecast[2]).toBeGreaterThan(forecast[0]);
  });

  test('never forecasts negative demand', () => {
    const { forecast } = stats.holtLinearForecast([50, 40, 30, 20, 10], 10, 0.8, 0.5);
    forecast.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  });

  test('degrades gracefully on empty and single-point input', () => {
    expect(stats.holtLinearForecast([], 3).forecast).toEqual([0, 0, 0]);
    expect(stats.holtLinearForecast([7], 2).forecast).toEqual([7, 7]);
  });
});

describe('outlier detection', () => {
  test('z-score flags an obvious spike', () => {
    const out = stats.zScoreOutliers([10, 11, 10, 12, 11, 10, 100], 2);
    expect(out.map((o) => o.value)).toContain(100);
  });

  test('IQR flags an obvious spike', () => {
    const out = stats.iqrOutliers([10, 11, 10, 12, 11, 10, 100]);
    expect(out.map((o) => o.value)).toContain(100);
  });

  test('constant series yields no outliers (no divide-by-zero)', () => {
    expect(stats.zScoreOutliers([5, 5, 5, 5])).toEqual([]);
    expect(stats.iqrOutliers([5, 5, 5, 5])).toEqual([]);
  });
});

describe('error metrics', () => {
  test('rmse', () => {
    expect(stats.rmse([1, 2, 3], [1, 2, 3])).toBe(0);
    expect(stats.rmse([1, 2, 3], [2, 3, 4])).toBe(1);
  });

  test('mape returns a fraction and skips zero actuals', () => {
    expect(stats.mape([100, 100], [110, 90])).toBeCloseTo(0.1, 10);
    expect(stats.mape([0, 100], [0, 100])).toBe(0);
  });
});

describe('weightedScore', () => {
  test('computes score and per-component contribution shares', () => {
    const { score, contributions } = stats.weightedScore({
      a: { value: 1, weight: 1 },
      b: { value: 0, weight: 1 }
    });
    expect(score).toBe(0.5);
    expect(contributions.a.share).toBeCloseTo(1, 10);
    expect(contributions.b.share).toBeCloseTo(0, 10);
  });

  test('clamps out-of-range values into 0..1', () => {
    const { score } = stats.weightedScore({ a: { value: 5, weight: 1 } });
    expect(score).toBe(1);
  });

  test('empty input is safe', () => {
    expect(stats.weightedScore({}).score).toBe(0);
  });
});

describe('robustness', () => {
  test('no function throws on empty, null, or non-numeric input', () => {
    const inputs = [[], [5], null, undefined, [NaN, Infinity, 'x']];
    inputs.forEach((input) => {
      expect(() => {
        stats.mean(input);
        stats.stdDev(input);
        stats.linearRegression(input);
        stats.holtLinearForecast(input, 3);
        stats.zScoreOutliers(input);
        stats.iqrOutliers(input);
        stats.seasonalIndices(input);
        stats.movingAverage(input);
        stats.exponentialSmoothing(input);
      }).not.toThrow();
    });
  });
});
