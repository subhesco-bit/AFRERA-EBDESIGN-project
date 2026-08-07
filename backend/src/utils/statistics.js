/**
 * Statistics utilities
 *
 * Real, dependency-free statistical implementations used to replace the
 * Math.random() placeholder "models" that previously backed the AI services
 * (advancedAIService.js et al).
 *
 * Design notes:
 * - Every function is pure and synchronous so it can be unit tested directly.
 * - Every function degrades gracefully on short/empty series rather than
 *   throwing, because production callers feed it whatever history exists.
 * - Nothing here pretends to be a neural network. These are classical methods
 *   (Holt linear trend, seasonal decomposition, z-score/IQR outliers, ridge-free
 *   OLS regression) chosen because they are correct, explainable, and work on
 *   the data volumes this platform actually has.
 */

/** Coerce to finite numbers, dropping nulls/NaN/Infinity. */
function clean(series) {
  if (!Array.isArray(series)) return [];
  return series
    .map((v) => (typeof v === 'string' ? parseFloat(v) : v))
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
}

function mean(series) {
  const s = clean(series);
  if (s.length === 0) return 0;
  return s.reduce((a, b) => a + b, 0) / s.length;
}

function median(series) {
  const s = clean(series).sort((a, b) => a - b);
  if (s.length === 0) return 0;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Sample standard deviation (n-1). Returns 0 for series shorter than 2. */
function stdDev(series) {
  const s = clean(series);
  if (s.length < 2) return 0;
  const m = mean(s);
  const variance = s.reduce((acc, v) => acc + (v - m) ** 2, 0) / (s.length - 1);
  return Math.sqrt(variance);
}

function variance(series) {
  return stdDev(series) ** 2;
}

/** Linear interpolation percentile. p in [0,1]. */
function percentile(series, p) {
  const s = clean(series).sort((a, b) => a - b);
  if (s.length === 0) return 0;
  if (s.length === 1) return s[0];
  const idx = p * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/** Coefficient of variation — unitless volatility measure. */
function coefficientOfVariation(series) {
  const m = mean(series);
  if (m === 0) return 0;
  return stdDev(series) / Math.abs(m);
}

/**
 * Ordinary least squares fit of y = slope*x + intercept, x = 0..n-1.
 * Also returns r2 (goodness of fit) so callers can express real confidence
 * instead of a hardcoded "0.94".
 */
function linearRegression(series) {
  const y = clean(series);
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: n === 1 ? y[0] : 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = mean(y);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const pred = slope * i + intercept;
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? (ssRes === 0 ? 1 : 0) : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

/** Pearson correlation between two equal-length series. */
function correlation(a, b) {
  const x = clean(a);
  const y = clean(b);
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const xm = mean(x.slice(0, n));
  const ym = mean(y.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xm) * (y[i] - ym);
    dx += (x[i] - xm) ** 2;
    dy += (y[i] - ym) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

/** Trailing simple moving average. */
function movingAverage(series, window = 7) {
  const s = clean(series);
  if (s.length === 0 || window < 1) return [];
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = s.slice(start, i + 1);
    out.push(mean(slice));
  }
  return out;
}

/** Single exponential smoothing. alpha in (0,1]. */
function exponentialSmoothing(series, alpha = 0.3) {
  const s = clean(series);
  if (s.length === 0) return [];
  const out = [s[0]];
  for (let i = 1; i < s.length; i++) {
    out.push(alpha * s[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

/**
 * Holt's linear trend method (double exponential smoothing).
 * Returns level, trend, and a forecast horizon. This is the real replacement
 * for the previous "LSTM" mock, and is appropriate for the short, noisy
 * daily-demand series this platform collects.
 */
function holtLinearForecast(series, horizon = 30, alpha = 0.3, beta = 0.1) {
  const s = clean(series);
  if (s.length === 0) {
    return { forecast: new Array(horizon).fill(0), level: 0, trend: 0, fitted: [] };
  }
  if (s.length === 1) {
    return { forecast: new Array(horizon).fill(s[0]), level: s[0], trend: 0, fitted: [s[0]] };
  }

  let level = s[0];
  let trend = s[1] - s[0];
  const fitted = [level];

  for (let i = 1; i < s.length; i++) {
    const prevLevel = level;
    level = alpha * s[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level);
  }

  const forecast = [];
  for (let h = 1; h <= horizon; h++) {
    // Demand cannot be negative; clamp rather than emit nonsense.
    forecast.push(Math.max(0, level + h * trend));
  }

  return { forecast, level, trend, fitted };
}

/**
 * Additive seasonal indices for a fixed period (e.g. 7 = weekly).
 * Returns a multiplier per phase; 1.0 means "average".
 */
function seasonalIndices(series, period = 7) {
  const s = clean(series);
  if (s.length < period * 2) return new Array(period).fill(1);

  const overall = mean(s);
  if (overall === 0) return new Array(period).fill(1);

  const buckets = Array.from({ length: period }, () => []);
  s.forEach((v, i) => buckets[i % period].push(v));

  return buckets.map((b) => (b.length ? mean(b) / overall : 1));
}

/**
 * Z-score outlier detection. Returns indices and scores of points beyond
 * `threshold` standard deviations. Real replacement for "anomaly_detection".
 */
function zScoreOutliers(series, threshold = 3) {
  const s = clean(series);
  const m = mean(s);
  const sd = stdDev(s);
  if (sd === 0) return [];

  return s
    .map((value, index) => ({ index, value, score: Math.abs((value - m) / sd) }))
    .filter((p) => p.score > threshold);
}

/**
 * Interquartile-range outlier detection — more robust than z-score on
 * skewed data (which transaction amounts usually are).
 */
function iqrOutliers(series, multiplier = 1.5) {
  const s = clean(series);
  if (s.length < 4) return [];
  const q1 = percentile(s, 0.25);
  const q3 = percentile(s, 0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return [];
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;

  return s
    .map((value, index) => ({ index, value }))
    .filter((p) => p.value < lower || p.value > upper);
}

/**
 * Normal-approximation confidence interval around a point forecast.
 * z defaults to 1.96 (95%).
 */
function confidenceInterval(point, residualStdDev, z = 1.96) {
  const margin = z * (Number.isFinite(residualStdDev) ? residualStdDev : 0);
  return {
    lower: Math.max(0, point - margin),
    point,
    upper: point + margin,
    margin
  };
}

/** Root mean squared error between actual and predicted series. */
function rmse(actual, predicted) {
  const a = clean(actual);
  const p = clean(predicted);
  const n = Math.min(a.length, p.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (a[i] - p[i]) ** 2;
  return Math.sqrt(sum / n);
}

/** Mean absolute percentage error, as a fraction (0.1 = 10%). */
function mape(actual, predicted) {
  const a = clean(actual);
  const p = clean(predicted);
  const n = Math.min(a.length, p.length);
  if (n === 0) return 0;
  let sum = 0;
  let counted = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === 0) continue;
    sum += Math.abs((a[i] - p[i]) / a[i]);
    counted++;
  }
  return counted === 0 ? 0 : sum / counted;
}

/** Scale a value into 0..1 using min-max, guarding divide-by-zero. */
function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Weighted score from named components.
 * components: { name: { value: 0..1, weight: n } }
 * Returns the 0..1 score plus each component's contribution, which is what
 * makes downstream decisions explainable (real XAI, not a claimed one).
 */
function weightedScore(components) {
  const entries = Object.entries(components || {});
  if (entries.length === 0) return { score: 0, contributions: {} };

  let totalWeight = 0;
  let sum = 0;
  const contributions = {};

  for (const [name, { value = 0, weight = 1 }] of entries) {
    const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    sum += v * weight;
    totalWeight += weight;
    contributions[name] = { value: v, weight, contribution: v * weight };
  }

  const score = totalWeight === 0 ? 0 : sum / totalWeight;

  for (const name of Object.keys(contributions)) {
    contributions[name].share =
      sum === 0 ? 0 : contributions[name].contribution / sum;
  }

  return { score, contributions };
}

module.exports = {
  mean,
  median,
  stdDev,
  variance,
  percentile,
  coefficientOfVariation,
  linearRegression,
  correlation,
  movingAverage,
  exponentialSmoothing,
  holtLinearForecast,
  seasonalIndices,
  zScoreOutliers,
  iqrOutliers,
  confidenceInterval,
  rmse,
  mape,
  normalize,
  weightedScore
};
