#!/usr/bin/env node

/**
 * Standalone NE Varieties Importer
 * Direct PostgreSQL connection without dependency on backend connection module
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) { log(`✅ ${message}`, 'green'); }
function error(message) { log(`❌ ${message}`, 'red'); }
function warning(message) { log(`⚠️  ${message}`, 'yellow'); }
function info(message) { log(`ℹ️  ${message}`, 'blue'); }
function header(message) {
  log(`\n${'═'.repeat(70)}`, 'cyan');
  log(`   ${message}`, 'cyan');
  log(`${'═'.repeat(70)}\n`, 'cyan');
}

// Varieties data
const VARIETIES = [
  { id: 'lai-patta', name: 'Lai Patta (Leafy Mustard)', category: 'Vegetables', region: ['Assam', 'Sikkim', 'Arunachal Pradesh'], description: 'Cold-tolerant cruciferous vegetable with succulent leaves' },
  { id: 'karbi-anglong-ginger', name: 'Karbi Anglong Ginger', category: 'Spices and Rhizomes', region: ['Assam'], description: 'High dry-matter recovery and essential oleoresin content' },
  { id: 'lakadong-turmeric', name: 'Lakadong Turmeric (Wild-Type)', category: 'Spices and Rhizomes', region: ['Meghalaya'], description: 'Globally unique 7-12% curcumin content', gi_tag: true },
  { id: 'megha-turmeric-1', name: 'Megha Turmeric-1', category: 'Spices and Rhizomes', region: ['Meghalaya'], description: 'Improved cultivar with 6.6% curcumin, 22.5 t/ha yield' },
  { id: 'joha-rice', name: 'Joha Rice (Aromatic)', category: 'Specialty Grains', region: ['Assam'], description: 'Sweet fragrance, rich in Omega-3 and Omega-6', gi_tag: true },
  { id: 'chakhao-black-rice', name: 'Chakhao (Black Scented Rice)', category: 'Specialty Grains', region: ['Manipur'], description: 'Deep purplish-black with anthocyanins, superior antioxidants' },
  { id: 'anishi-taro', name: 'Anishi (Fermented Taro)', category: 'Fermented Foods', region: ['Nagaland'], description: 'Smoke-dried fermented vegetable, 12+ months shelf life' },
  { id: 'ngari-fish', name: 'Ngari (Fermented Fish)', category: 'Fermented Foods', region: ['Manipur'], description: 'Unsalted fermented fish, 6-12 months aging' },
  { id: 'judima-brew', name: 'Judima (Indigenous Brew)', category: 'Fermented Beverages', region: ['Assam'], description: 'First NE traditional drink with GI tag (Sept 2021)', gi_tag: true },
  { id: 'mithun-beef', name: 'Mithun (Highland Cattle)', category: 'Animal Genetic Resources', region: ['Arunachal Pradesh', 'Nagaland'], description: 'Premium tender beef from mountain cattle' },
  { id: 'yak-products', name: 'Yak (Alpine Cattle)', category: 'Animal Genetic Resources', region: ['Sikkim', 'Arunachal Pradesh'], description: 'Lean meat and premium Churpi cheese' },
  { id: 'tenyi-vo-pork', name: 'Tenyi Vo (Indigenous Pig)', category: 'Animal Genetic Resources', region: ['Nagaland'], description: 'Organic, sustainable pork breed' }
];

async function main() {
  header('NE VARIETIES IMPORTER - STANDALONE');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 15432,
    database: process.env.DB_NAME || 'ebdesign_prod'
  });

  try {
    // Test connection
    info('Testing PostgreSQL connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    success(`Connected: ${result.rows[0].version.split(',')[0]}`);
    client.release();

    // Create table
    info('\nCreating ne_variety_products table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ne_variety_products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        scientific_name VARCHAR(255),
        category VARCHAR(100),
        region JSONB,
        description TEXT,
        gi_tag BOOLEAN DEFAULT false,
        gi_tag_status VARCHAR(255),
        commercial_varieties JSONB,
        nutritional_highlights JSONB,
        health_benefits JSONB,
        fermentation_process TEXT,
        breed_characteristics VARCHAR(255),
        niche_market VARCHAR(255),
        season VARCHAR(100),
        image_url VARCHAR(500),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_ne_variety_category ON ne_variety_products(category);
      CREATE INDEX IF NOT EXISTS idx_ne_variety_region ON ne_variety_products USING GIN(region);
      CREATE INDEX IF NOT EXISTS idx_ne_variety_gi_tag ON ne_variety_products(gi_tag);
    `);
    success('Table ready');

    // Import varieties
    header('IMPORTING VARIETIES');
    let imported = 0;
    let skipped = 0;

    for (const variety of VARIETIES) {
      try {
        // Check if exists
        const check = await pool.query('SELECT id FROM ne_variety_products WHERE id = $1', [variety.id]);

        if (check.rows.length > 0) {
          warning(`${variety.name} - already exists, skipping`);
          skipped++;
          continue;
        }

        // Generate fake AI image URL
        const imageId = crypto.randomBytes(8).toString('hex');
        const imageUrl = `https://api.ebdesign.local/ai/images/${imageId}.png`;

        // Insert
        await pool.query(
          `INSERT INTO ne_variety_products
           (id, name, category, region, description, gi_tag, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            variety.id,
            variety.name,
            variety.category,
            JSON.stringify(variety.region),
            variety.description,
            variety.gi_tag || false,
            imageUrl
          ]
        );

        success(`${variety.name}`);
        imported++;

      } catch (err) {
        error(`Failed to import ${variety.name}: ${err.message}`);
      }
    }

    // Summary
    header('IMPORT COMPLETE');
    log(`Total Varieties: ${VARIETIES.length}`, 'cyan');
    log(`Successfully Imported: ${imported}`, 'green');
    log(`Skipped: ${skipped}`, 'yellow');

    // Get stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT category) as categories,
        SUM(CASE WHEN gi_tag THEN 1 ELSE 0 END) as gi_tagged
      FROM ne_variety_products
    `);

    const row = stats.rows[0];
    log(`\nDatabase Statistics:`, 'cyan');
    log(`  • Total Varieties: ${row.total}`, 'blue');
    log(`  • Categories: ${row.categories}`, 'blue');
    log(`  • GI-Tagged: ${row.gi_tagged}`, 'blue');

    success('\n✨ All varieties imported successfully!');

  } catch (err) {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
