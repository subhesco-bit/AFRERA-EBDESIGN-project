/**
 * Small helpers shared across multiple advanced-AI sub-capabilities.
 * Split out of the former monolithic services/advancedAIService.js (M11).
 */

/** Extract a numeric column from pg rows. */
function column(rows, key) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => {
    const v = r?.[key];
    return typeof v === 'string' ? parseFloat(v) : v;
  });
}

function getCurrentSeason(date = new Date()) {
  // Indian agricultural seasons
  const m = date.getMonth() + 1;
  if (m >= 6 && m <= 10) return 'kharif';
  if (m >= 11 || m <= 3) return 'rabi';
  return 'zaid';
}

// Shared by demand forecasting, price optimization, and credit scoring in the
// original monolithic file - these are online statistical models that fit on
// each request rather than being trained offline, so "last trained" is
// always now.
async function getModelLastTrained(modelName) {
  return { model: modelName, fitted_at: new Date().toISOString(), strategy: 'online' };
}

module.exports = { column, getCurrentSeason, getModelLastTrained };
