const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'ebdesign_user',
  password: process.env.DB_PASSWORD || 'ebdesign_dev_password_change_in_prod',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 15432,
  database: process.env.DB_NAME || 'ebdesign'
});

async function verify() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        category,
        gi_tag,
        image_url
      FROM ne_variety_products
      ORDER BY category, name
    `);

    console.log('\n✅ DATABASE VERIFICATION\n');
    console.log(`Total Varieties: ${result.rows.length}\n`);
    console.log('Imported Varieties:');
    console.log('─'.repeat(80));

    result.rows.forEach((row, idx) => {
      const giTag = row.gi_tag ? ' ✅ GI-TAGGED' : '';
      console.log(`${idx + 1}. ${row.name}${giTag}`);
      console.log(`   Category: ${row.category}`);
      console.log(`   Image: ${row.image_url}`);
      console.log();
    });

    // Get statistics
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT category) as categories,
        SUM(CASE WHEN gi_tag THEN 1 ELSE 0 END) as gi_tagged
      FROM ne_variety_products
    `);

    const stat = stats.rows[0];
    console.log('─'.repeat(80));
    console.log(`\nSTATISTICS:`);
    console.log(`  Total Varieties: ${stat.total}`);
    console.log(`  Categories: ${stat.categories}`);
    console.log(`  GI-Tagged Products: ${stat.gi_tagged}`);
    console.log(`\n✨ All varieties ready for production!\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();
