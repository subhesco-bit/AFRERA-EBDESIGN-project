// Economic layer seed helpers

async function seedEconomic(pool, logger) {
  try {
    logger.info('Seeding economic layer reference data...');

    await pool.query(`
      INSERT INTO village_profiles (name, state, district, population, avg_income, assets)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (name) DO NOTHING
    `, [
      'Demo Village', 'Demo State', 'Demo District', 1200, 45000, JSON.stringify({ wells:1, storage:1 })
    ]);

    await pool.query(`
      INSERT INTO demand_forecasts (product_id, region_id, forecast_date, forecast_qty, confidence)
      VALUES ($1,$2,$3,$4,$5)
    `, [1, 1, new Date().toISOString().slice(0,10), 1000, 0.8]);

    logger.info('Economic layer seed completed');
  } catch (error) {
    logger.error('Economic seed failed', { error: error.message });
    throw error;
  }
}

module.exports = { seedEconomic };
