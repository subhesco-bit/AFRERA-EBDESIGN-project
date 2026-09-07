/**
 * Regional Variety Directory Service.
 *
 * Backs migration 9999_zzz_regional_variety_directory_schema.sql /
 * 9999_zzzz_regional_variety_directory_seed.sql — 142 real, citation-backed
 * NE India crop/livestock/fisheries varieties from a user-provided
 * reference document. See the schema migration header for why this is
 * separate from `products` (real seller SKUs) rather than merged into it.
 */

'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');
const productMediaAIService = require('./productMediaAIService');
const cropValueResearchService = require('./cropValueResearchService');

class RegionalVarietyService {
  async list({ category, giStatus, state, search } = {}) {
    const conditions = [];
    const params = [];
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (giStatus) { params.push(giStatus); conditions.push(`gi_status = $${params.length}`); }
    if (state) { params.push(`%${state}%`); conditions.push(`primary_states ILIKE $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`product_name ILIKE $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM regional_variety_directory ${where} ORDER BY category, product_name`,
      params
    );
    return result.rows;
  }

  async getById(id) {
    const result = await pool.query('SELECT * FROM regional_variety_directory WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new Error('Variety not found');
    return result.rows[0];
  }

  async listCategories() {
    const result = await pool.query(
      `SELECT category, COUNT(*) AS variety_count FROM regional_variety_directory GROUP BY category ORDER BY category`
    );
    return result.rows;
  }

  /**
   * Requests AI reference imagery for a variety using the same honest
   * provider adapter as productMediaAIService.js — IMAGE_PROVIDER_ENV. No
   * provider is configured in this environment, so this records the
   * request status honestly (not_configured) rather than fabricating an
   * image URL.
   */
  async requestVarietyImage(id) {
    const variety = await this.getById(id);
    const prompt = `Professional product photography of ${variety.product_name}` +
      (variety.scientific_name ? ` (${variety.scientific_name})` : '') +
      `, a regional variety from ${variety.primary_states}, Northeast India. Natural lighting, clean background, realistic.`;

    const result = await productMediaAIService.callImageProvider('openai_images', prompt);
    const status = result.ok ? 'completed' : (result.status === 'not_configured' ? 'not_configured' : 'failed');
    await pool.query(
      `UPDATE regional_variety_directory
         SET image_generation_status = $1, image_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, result.imageUrl || null, id]
    );
    return { varietyId: id, status, provider: 'openai_images', ...result };
  }

  /**
   * Creates a REAL product listing pre-filled from a variety's reference
   * data. The farmer still supplies real, required seller-specific fields
   * (base_price, unit, images) — this never invents a price, matching the
   * rule that regional_variety_directory holds no commercial/inventory
   * data of its own.
   */
  async createListingFromVariety(varietyId, sellerFields) {
    const variety = await this.getById(varietyId);
    const { basePrice, unitId, stateId, description, sellerId } = sellerFields || {};
    if (!(Number(basePrice) > 0)) throw new Error('basePrice is required and must be > 0');
    if (!sellerId) throw new Error('sellerId is required');

    // createProduct()'s INSERT does not list variety_directory_id as a
    // column (it's a new FK added by this migration, after that INSERT was
    // written) — set separately below rather than passing it through and
    // having it silently dropped.
    const productService = require('./productService');
    const product = await productService.createProduct({
      name: variety.product_name,
      description: description || [variety.specialty_usp, variety.commercial_potential].filter(Boolean).join(' '),
      base_price: basePrice,
      unit_id: unitId,
      state_id: stateId,
      seller_id: sellerId,
      gi_status: variety.gi_status === 'registered',
      gi_certificate_number: variety.gi_application_no || null,
    });
    await pool.query('UPDATE products SET variety_directory_id = $1 WHERE id = $2', [varietyId, product.id]);

    // Best-effort, non-blocking: "when a product is added, AI searches and
    // adds/updates" the published value-compound reference data for this
    // variety (see cropValueResearchService.js — writes land unverified,
    // pending human review, and this never fails/delays listing creation).
    cropValueResearchService
      .researchOnProductAdded(variety.product_name, [
        'CURCUMIN_PCT', 'CAPSAICIN_SHU', 'ASTA_COLOR', 'PIPERINE_PCT', 'GINGEROL_PCT', 'CATECHIN_PCT',
      ])
      .catch(() => {});

    logger.info('Product created from regional variety directory', { varietyId, productId: product.id });
    return { ...product, variety_directory_id: varietyId };
  }
}

module.exports = new RegionalVarietyService();
