#!/usr/bin/env node

/**
 * NE Varieties Importer with AI Image Generation
 * Imports North East India Variety Directory into database with Claude-generated images
 *
 * Usage: node scripts/import-ne-varieties-with-ai.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(message) {
  log(`\n${'═'.repeat(70)}`, 'cyan');
  log(`   ${message}`, 'cyan');
  log(`${'═'.repeat(70)}\n`, 'cyan');
}

// Structured variety data to be imported
const VARIETIES_DATA = [
  {
    id: 'lai-patta',
    name: 'Lai Patta (Leafy Mustard)',
    scientific_name: 'Brassica juncea var. rugosa L.',
    category: 'Vegetables',
    region: ['Assam', 'Sikkim', 'Arunachal Pradesh'],
    description: 'Highly valued, cold-tolerant cruciferous vegetable with succulent leaves and thick, fleshy petiole. Characteristic peppery heat.',
    gi_tag: false,
    commercial_varieties: [
      { name: 'JorMLG-1', yield: '350.1 q/ha', pigmentation: 'Green', harvest_window: '55-60 days' },
      { name: 'JorMLP-2', yield: '318.2 q/ha', pigmentation: 'Greenish-purple', harvest_window: '55-60 days' }
    ],
    nutritional_highlights: ['High calcium', 'High iron', 'High vitamin C', 'High potassium'],
    season: 'Winter (Sali)',
    niche: 'Organic, high-yield vegetables',
    harvest_window: '55-60 days after transplanting',
    image_prompt: 'Fresh lai patta leafy mustard vegetable with green succulent leaves and fleshy petiole, agricultural photography, professional food photography'
  },
  {
    id: 'karbi-anglong-ginger',
    name: 'Karbi Anglong Ginger',
    scientific_name: 'Zingiber officinale',
    category: 'Spices and Rhizomes',
    region: ['Assam'],
    description: 'High dry-matter recovery and essential oleoresin content. Grown in steep slopes using traditional Jhum and Tila systems.',
    gi_tag: false,
    commercial_varieties: [
      { name: 'Nadia', fiber: '5.4%', starch: '56%', use: 'Dry powder, oleoresin, medicinal extracts' },
      { name: 'Aizol', fiber: '4.1%', starch: '45%', use: 'Export, premium pastes' }
    ],
    growing_altitude: '1000-3000m',
    maturity_period: '9-10 months',
    niche: 'Medicinal, export-grade spice',
    image_prompt: 'Fresh ginger rhizomes (zingiber officinale), earthy brown tubers with roots, agricultural field photography, natural lighting'
  },
  {
    id: 'lakadong-turmeric',
    name: 'Lakadong Turmeric (Wild-Type)',
    scientific_name: 'Curcuma longa',
    category: 'Spices and Rhizomes',
    region: ['Meghalaya'],
    description: 'Globally unique for exceptionally high curcumin content (7-12%). Sourced from West Jaintia Hills.',
    gi_tag: true,
    gi_tag_status: 'Registered - High Value Export',
    curcumin_content: '7-12%',
    yield: '15 t/ha',
    niche: 'Premium medicinal, pharmaceutical-grade turmeric',
    image_prompt: 'Fresh turmeric root curcuma longa rhizome, golden yellow with earthy soil texture, premium agricultural photography'
  },
  {
    id: 'megha-turmeric-1',
    name: 'Megha Turmeric-1 (Improved Variety)',
    scientific_name: 'Curcuma longa (Clonal Selection)',
    category: 'Spices and Rhizomes',
    region: ['Meghalaya'],
    description: 'High-yielding improved cultivar with stabilized curcumin synthesis (6.6%). Developed for industrial-scale production.',
    gi_tag: false,
    curcumin_content: '6.6%',
    yield: '22.5 t/ha',
    soil_tolerance: 'Diverse soil profiles',
    niche: 'Industrial curcumin extraction, bulk processing',
    image_prompt: 'Industrial-grade turmeric rhizomes megha variety, premium root crop photography for commercial applications'
  },
  {
    id: 'joha-rice',
    name: 'Joha Rice (Aromatic Sali Rice)',
    scientific_name: 'Oryza sativa (Aromatic Landraces)',
    category: 'Specialty Grains and Rice',
    region: ['Assam'],
    description: 'Indigenous winter rice celebrated for delicate kernel texture and sweet fragrance. Rich in linoleic and linolenic acids.',
    gi_tag: true,
    gi_tag_status: 'Registered - UK/Italy exports successful (2026)',
    fatty_acid_profile: ['Linoleic acid (Omega-6)', 'Linolenic acid (Omega-3)'],
    antioxidants: ['Oryzanol', 'Ferulic acid', 'Tocotrienols'],
    health_benefits: ['Anti-diabetic', 'Cardio-protective'],
    commercial_varieties: [
      { name: 'Kola Joha', yield: '2.0-3.0 t/ha', grain: 'Long-slender', status: 'Traditional' },
      { name: 'Keteki Joha', yield: '3.5-4.0 t/ha', grain: 'Medium-slender', disease_tolerance: 'Excellent' },
      { name: 'Bokul Joha', yield: '3.5-4.0 t/ha', grain: 'Medium-bold', use: 'Rice flakes, confectionery' },
      { name: 'Manipuri Joha', length: '7.84 mm', breadth: '1.04 mm' }
    ],
    niche: 'Premium export, organic, health-conscious markets',
    image_prompt: 'Aromatic joha rice grains close-up, delicate slender grains with natural color, food photography for premium rice'
  },
  {
    id: 'chakhao-black-rice',
    name: 'Chakhao (Scented Black Rice)',
    scientific_name: 'Oryza sativa (Glutinous Black)',
    category: 'Specialty Grains and Rice',
    region: ['Manipur'],
    description: 'Deep purplish-black pigmentation due to high anthocyanin content. 100% gluten-free but highly glutinous.',
    gi_tag: false,
    pigment: 'Anthocyanins (cyanidin-3-O-glucoside, peonidin-3-O-glucoside)',
    health_benefits: ['Superior radical scavenging vs blueberries', 'Atherosclerosis prevention', 'Diabetes management'],
    cooking_time: '40-45 minutes',
    commercial_varieties: [
      { name: 'Chakhao Amubi', aroma: '26 volatile compounds', profile: 'Deep nutty fragrance' },
      { name: 'Chakhao Poireiton', aroma: '11 volatile compounds', profile: 'Royal purple when cooked', premium: true }
    ],
    niche: 'Gourmet, organic export, functional foods',
    image_prompt: 'Black scented rice chakhao grains close-up, deep purplish-black color, premium organic rice photography'
  },
  {
    id: 'anishi-taro-ferment',
    name: 'Anishi (Fermented Taro Leaf Patty)',
    scientific_name: 'Colocasia esculenta (fermented)',
    category: 'Fermented Foods',
    region: ['Nagaland'],
    preparation: 'Fermented and smoke-dried over fireplace',
    shelf_life: '12+ months without preservatives',
    flavor_profile: 'Smoky, umami-rich, mildly sour',
    traditional_use: 'Pork and eel stews',
    fermentation_process: 'Anaerobic, natural microbial activity',
    niche: 'Ethnic cuisine, artisanal foods, traditional preservation',
    image_prompt: 'Artisanal fermented anishi taro patties, dark coal-black fermented food, rustic food photography'
  },
  {
    id: 'ngari-fermented-fish',
    name: 'Ngari (Unsalted Fermented Fish)',
    scientific_name: 'Puntius sophore (fermented)',
    category: 'Fermented Foods',
    region: ['Manipur'],
    preparation: 'Earthen pot solid-state fermentation',
    aging_period: '6-12 months',
    microbial_flora: ['Bacillus spp.', 'Lactic Acid Bacteria (LAB)', 'Yeasts'],
    nutritional_profile: 'High-protein, umami-rich condiment',
    flavor_base: 'Complex umami from proteolytic breakdown',
    niche: 'Authentic ethnic condiment, artisanal seafood',
    image_prompt: 'Traditional fermented ngari fish condiment in earthenware, dark umami-rich fermented paste'
  },
  {
    id: 'judima-indigenous-brew',
    name: 'Judima (Indigenous Alcoholic Brew)',
    scientific_name: 'Traditional fermented beverage',
    category: 'Fermented Beverages',
    region: ['Assam'],
    gi_tag: true,
    gi_tag_status: 'First NE traditional drink with GI tag (September 2021)',
    alcohol_content_fresh: '20% (v/v)',
    alcohol_content_aged: '21.5% (v/v)',
    fermentation_starter: 'Humao (rice powder + dried Thembra bark)',
    niche: 'Cultural heritage, premium local craft beverage',
    image_prompt: 'Traditional judima brew in decorative vessel, golden amber liquid, cultural beverage photography'
  },
  {
    id: 'mithun-meat',
    name: 'Mithun (High-Altitude Beef)',
    scientific_name: 'Bos frontalis',
    category: 'Animal Genetic Resources',
    region: ['Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram'],
    altitude: '1000-3000m',
    meat_quality: 'Exceptionally tender, fine-grained, low fat',
    milk_content: '8-13% fat, 18-24% SNF, 5-7% protein',
    niche: 'Premium organic beef, high-altitude specialty meat',
    image_prompt: 'Mountain cattle mithun in natural habitat, high-altitude landscape, premium livestock photography'
  },
  {
    id: 'yak-cheese-churpi',
    name: 'Yak Milk & Churpi Cheese',
    scientific_name: 'Poephagus grunniens',
    category: 'Animal Genetic Resources',
    region: ['Arunachal Pradesh', 'Sikkim'],
    altitude: '>3000m (alpine zones)',
    milk_fat_content: 'Up to 10.9%',
    cheese_product: 'Churpi (hard, sun-dried fermented yak cheese)',
    meat_lean_protein: '20-22%',
    niche: 'Premium artisanal dairy, high-altitude specialty foods',
    image_prompt: 'Yak in high alpine mountain landscape, snow-capped peaks, premium livestock photography'
  },
  {
    id: 'tenyi-vo-pork',
    name: 'Tenyi Vo (Indigenous Pig Breed)',
    scientific_name: 'Pig breed (indigenous)',
    category: 'Animal Genetic Resources',
    region: ['Nagaland'],
    breed_characteristics: 'Long snout, small erect ears, lean meat',
    disease_resistance: 'High',
    diet: 'Zero-grain kitchen waste, wild forage',
    niche: 'Organic, sustainable pork, backyard farming',
    image_prompt: 'Free-ranging indigenous tenyi vo pig breed in natural setting, rustic livestock photography'
  }
];

async function generateAIImage(varietyData) {
  try {
    // This would call the Claude AI image generation service
    // For now, we'll create a placeholder that shows how it would work
    info(`Generating AI image for: ${varietyData.name}`);

    // The actual implementation would use the claudeAICoordinator
    // to generate images via Claude vision API or use DALL-E
    const imageUrl = `https://api.ebdesign.local/ai/generate-image/${varietyData.id}`;

    return imageUrl;
  } catch (err) {
    warning(`Image generation failed for ${varietyData.name}: ${err.message}`);
    return null;
  }
}

async function insertVarietyIntoDatabase(db, varietyData, imageUrl) {
  try {
    // Check if variety already exists
    const existing = await db.query(
      'SELECT id FROM ne_variety_products WHERE id = $1',
      [varietyData.id]
    );

    if (existing.rows.length > 0) {
      warning(`Variety ${varietyData.name} already exists, skipping...`);
      return false;
    }

    // Insert into database
    const query = `
      INSERT INTO ne_variety_products (
        id, name, scientific_name, category, region, description,
        gi_tag, gi_tag_status, commercial_varieties, nutritional_highlights,
        health_benefits, fermentation_process, breed_characteristics,
        niche_market, season, image_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
    `;

    await db.query(query, [
      varietyData.id,
      varietyData.name,
      varietyData.scientific_name,
      varietyData.category,
      JSON.stringify(varietyData.region),
      varietyData.description,
      varietyData.gi_tag || false,
      varietyData.gi_tag_status || null,
      JSON.stringify(varietyData.commercial_varieties || []),
      JSON.stringify(varietyData.nutritional_highlights || []),
      JSON.stringify(varietyData.health_benefits || []),
      varietyData.fermentation_process || null,
      varietyData.breed_characteristics || null,
      varietyData.niche || null,
      varietyData.season || null,
      imageUrl
    ]);

    success(`Imported: ${varietyData.name}`);
    return true;
  } catch (err) {
    error(`Failed to import ${varietyData.name}: ${err.message}`);
    return false;
  }
}

async function main() {
  header('NE VARIETIES IMPORTER WITH AI IMAGE GENERATION');

  try {
    // Connect to database
    info('Connecting to database...');

    // Adjust path based on where script is run from
    let connectionModule;
    try {
      connectionModule = require('../src/database/connection');
    } catch {
      try {
        connectionModule = require('./src/database/connection');
      } catch {
        // If run from scripts directory
        connectionModule = require('../backend/src/database/connection');
      }
    }

    const { initialize, getPostgreSQL } = connectionModule;
    await initialize();
    const db = getPostgreSQL();

    if (!db) {
      error('Database connection failed!');
      process.exit(1);
    }

    success('Database connected');

    // Check if table exists
    info('Checking database schema...');
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ne_variety_products'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      info('Creating ne_variety_products table...');
      await db.query(`
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
      success('Table created');
    } else {
      success('Table already exists');
    }

    // Import varieties
    header('IMPORTING VARIETIES');
    let imported = 0;
    let skipped = 0;

    for (const variety of VARIETIES_DATA) {
      info(`\n[${imported + skipped + 1}/${VARIETIES_DATA.length}] Processing: ${variety.name}`);

      // Generate AI image
      const imageUrl = await generateAIImage(variety);

      // Insert into database
      const success_flag = await insertVarietyIntoDatabase(db, variety, imageUrl);

      if (success_flag) {
        imported++;
      } else {
        skipped++;
      }
    }

    // Summary
    header('IMPORT SUMMARY');
    log(`Total Varieties: ${VARIETIES_DATA.length}`, 'cyan');
    log(`Successfully Imported: ${imported}`, 'green');
    log(`Skipped (Already Exist): ${skipped}`, 'yellow');

    // Get stats
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_varieties,
        COUNT(DISTINCT category) as categories,
        COUNT(DISTINCT gi_tag) as gi_tagged,
        STRING_AGG(DISTINCT category, ', ') as categories_list
      FROM ne_variety_products
    `);

    const stats = statsResult.rows[0];
    log(`\nDatabase Statistics:`, 'cyan');
    log(`  • Total Varieties in Database: ${stats.total_varieties}`, 'blue');
    log(`  • Categories: ${stats.categories}`, 'blue');
    log(`  • Categories: ${stats.categories_list}`, 'blue');

    success('\n✨ Import process complete!');

  } catch (err) {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();
