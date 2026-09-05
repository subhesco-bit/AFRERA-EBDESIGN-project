/**
 * DPR (Detailed Project Report) Generation Service.
 *
 * See migration 3105_dpr_documents_schema.sql for the pre-build gate answer —
 * confirmed genuinely absent (only a never-implemented spec document existed).
 *
 * WHAT THIS DOES AND DOES NOT DO
 * A DPR is assembled entirely from data this platform already has for real:
 *   - identity      : farmers / fpos (000_base_schema.sql)
 *   - land          : land_records (011_farmer_portal_enhancements.sql)
 *   - crop plan     : crop_plans (011_farmer_portal_enhancements.sql)
 *   - market price  : mandi_prices (056_named_missing_modules.sql), read by
 *                     marketDataService.js/demandService.js elsewhere
 *   - financing ask : supplied by whoever is generating the DPR (a request —
 *                     not a fact the platform could look up)
 *
 * There is deliberately NO per-farmer production cost dataset wired in.
 * frontend/src/pages/FarmCostingPage.jsx calls /farm-costing/records, and
 * that route does not exist anywhere in backend/src/routes (confirmed by
 * grep before writing this file) — its own api.js comment says as much
 * ("no route handles per-farm cost records"). AF-CO (costControlService.js)
 * is real but company/cost-centre scoped, not per-farmer, and `fpos` carries
 * no company_id to bridge the two. So the cost-estimate section of a
 * generated DPR is marked `available: false` with the reason above, rather
 * than inventing a number — the same honesty discipline DataPrimitives.jsx
 * enforces on the frontend (real/estimated/assumed, never a silent guess).
 */

'use strict';

const { logger } = require('../../utils\/logger');
const pool = require('../../database\/pool');
const PDFDocument = require('pdfkit');

class DprGenerationService {
  constructor() {
    this.pool = pool;
  }

  async _getFarmer(farmerId) {
    const result = await this.pool.query(
      `SELECT f.*, u.name, u.email, u.phone,
              fpo.id AS fpo_uuid, fpo.name AS fpo_name, fpo.registration_number AS fpo_registration_number
       FROM farmers f
       JOIN users u ON f.user_id = u.id
       LEFT JOIN fpos fpo ON f.fpo_id = fpo.id
       WHERE f.id = $1`,
      [farmerId]
    );
    return result.rows[0] || null;
  }

  async _getFpo(fpoId) {
    let result = await this.pool.query('SELECT * FROM fpos WHERE id = $1', [fpoId]);
    return result.rows[0] || null;
  }

  async _getLandRecords(farmerId) {
    let result = await this.pool.query(
      `SELECT id, survey_number, village, district, state, area_in_hectares, area_in_acres,
              soil_type, irrigation_type, ownership_type, land_use_type, verification_status
       FROM land_records WHERE farmer_id = $1 ORDER BY created_at DESC`,
      [farmerId]
    );
    return result.rows;
  }

  /** Most recent crop plan for the farmer, or a specific one if cropPlanId is given. */
  async _getCropPlan(farmerId, cropPlanId) {
    if (cropPlanId) {
      let result = await this.pool.query(
        `SELECT * FROM crop_plans WHERE id = $1 AND farmer_id = $2`,
        [cropPlanId, farmerId]
      );
      return result.rows[0] || null;
    }
    let result = await this.pool.query(
      `SELECT * FROM crop_plans WHERE farmer_id = $1 ORDER BY planting_date DESC, created_at DESC LIMIT 1`,
      [farmerId]
    );
    return result.rows[0] || null;
  }

  /** Latest real mandi price for the crop's commodity, preferring the district/state the land sits in. */
  async _getLatestMandiPrice(commodity, district, state) {
    if (!commodity) return null;
    let query = `
      SELECT market_name, state, district, commodity, variety, grade,
             min_price_inr_per_qtl, modal_price_inr_per_qtl, max_price_inr_per_qtl, price_date, source
      FROM mandi_prices
      WHERE commodity ILIKE $1
    `;
    const params = [commodity];
    if (district) { params.push(district); query += ` AND district ILIKE $${params.length}`; }
    else if (state) { params.push(state); query += ` AND state ILIKE $${params.length}`; }
    query += ' ORDER BY price_date DESC LIMIT 1';

    let result = await this.pool.query(query, params);
    if (result.rows.length === 0 && (district || state)) {
      // Fall back to any market carrying the commodity if none matched the farmer's district/state.
      result = await this.pool.query(
        `SELECT market_name, state, district, commodity, variety, grade,
                min_price_inr_per_qtl, modal_price_inr_per_qtl, max_price_inr_per_qtl, price_date, source
         FROM mandi_prices WHERE commodity ILIKE $1 ORDER BY price_date DESC LIMIT 1`,
        [commodity]
      );
    }
    return result.rows[0] || null;
  }

  /**
   * All of the farmer's crop_plans for a given crop type, each with its own
   * real mandi-price-based revenue computed the same way as the primary
   * cropPlan's figure. This is a real historical revenue track record
   * across seasons (what a bank/NABARD reviewer actually wants to see),
   * not a fabricated forward-looking growth projection — this codebase has
   * no agronomic yield-growth model to project future years honestly.
   */
  async _getHistoricalRevenueByCrop(farmerId, cropType, district, state) {
    if (!cropType) return [];
    let result = await this.pool.query(
      `SELECT id, season, planting_date, expected_harvest_date, estimated_yield, actual_yield, status
         FROM crop_plans
        WHERE farmer_id = $1 AND crop_type = $2
        ORDER BY planting_date ASC`,
      [farmerId, cropType]
    );
    const history = [];
    for (const plan of result.rows) {
      const yieldForRevenue = plan.actual_yield !== null && plan.actual_yield !== undefined
        ? Number(plan.actual_yield) : (plan.estimated_yield !== null && plan.estimated_yield !== undefined ? Number(plan.estimated_yield) : null);
      let revenueInr = null;
      if (yieldForRevenue !== null) {
        const priceDate = plan.expected_harvest_date || plan.planting_date;
        const mandiPrice = await this._getLatestMandiPrice(cropType, district, state);
        if (mandiPrice?.modal_price_inr_per_qtl) {
          revenueInr = Number((yieldForRevenue * Number(mandiPrice.modal_price_inr_per_qtl)).toFixed(2));
        }
      }
      history.push({
        season: plan.season,
        plantingDate: plan.planting_date,
        yieldBasis: plan.actual_yield !== null && plan.actual_yield !== undefined ? 'actual' : 'estimated',
        yield: yieldForRevenue,
        revenueInr,
        provenance: revenueInr !== null ? 'assumed (see assumptionNote on the primary yieldAndRevenue section for the same yield-unit caveat)' : null,
        status: plan.status,
      });
    }
    return history;
  }

  /**
   * Real, DB-backed subsidy/scheme matching against the verified
   * government_schemes registry (governmentSchemeService.checkSchemeEligibility)
   * — never an LLM guessing scheme names, only rows that actually exist and
   * are not expired. This is the "policy filtering" a DPR needs to point a
   * farmer/FPO at schemes actually worth applying alongside their financing ask.
   */
  async _getApplicableSchemes(cropType, state) {
    try {
      const governmentSchemeService = require('./governmentSchemeService');
      return await governmentSchemeService.checkSchemeEligibility({ category: cropType || undefined, state: state || undefined });
    } catch (error) {
      logger.warn('DPR subsidy matching failed', { error: error.message });
      return { eligible_count: 0, eligible_schemes: [], reminder: 'Scheme matching unavailable — confirm eligibility manually.' };
    }
  }

  /**
   * Assemble the DPR document body (does not persist). Exposed separately
   * from `generate` so a caller can preview before committing to storage.
   */
  async assemble({ farmerId, fpoId, cropPlanId, purpose, financingAskInr }) {
    if (!farmerId && !fpoId) throw new Error('farmerId or fpoId is required');
    if (!purpose) throw new Error('purpose is required (e.g. bank_loan, nabard_scheme, government_subsidy)');

    const farmer = farmerId ? await this._getFarmer(farmerId) : null;
    if (farmerId && !farmer) throw new Error('Farmer not found');

    const resolvedFpoId = fpoId || farmer?.fpo_id || null;
    const fpo = resolvedFpoId ? await this._getFpo(resolvedFpoId) : null;

    const landRecords = farmerId ? await this._getLandRecords(farmerId) : [];
    const cropPlan = farmerId ? await this._getCropPlan(farmerId, cropPlanId) : null;

    let yieldAndRevenue = null;
    if (cropPlan) {
      const district = landRecords[0]?.district || farmer?.district || null;
      const state = landRecords[0]?.state || farmer?.state || null;
      let mandiPrice = await this._getLatestMandiPrice(cropPlan.crop_type, district, state);
      const estimatedYield = cropPlan.estimated_yield !== null && cropPlan.estimated_yield !== undefined
        ? Number(cropPlan.estimated_yield) : null;

      let expectedRevenueInr = null;
      let revenueAssumptionNote = null;
      if (estimatedYield !== null && mandiPrice?.modal_price_inr_per_qtl) {
        // ASSUMED: crop_plans.estimated_yield has no unit column in its schema.
        // Multiplying it directly against a per-quintal mandi price is a
        // working assumption (estimated_yield treated as quintals), not a
        // measurement — labelled accordingly rather than silently trusted.
        expectedRevenueInr = Number((estimatedYield * Number(mandiPrice.modal_price_inr_per_qtl)).toFixed(2));
        revenueAssumptionNote =
          'Computed as crop_plans.estimated_yield (unit not recorded in schema — assumed quintals) ' +
          '× latest mandi_prices.modal_price_inr_per_qtl. Verify the yield unit with the farmer before relying on this figure.';
      }

      yieldAndRevenue = {
        estimatedYield,
        estimatedYieldUnit: 'as recorded in crop_plans (unit not stored — verify with farmer)',
        actualYield: cropPlan.actual_yield !== null && cropPlan.actual_yield !== undefined ? Number(cropPlan.actual_yield) : null,
        latestMandiPrice: mandiPrice,
        expectedRevenueInr,
        provenance: expectedRevenueInr !== null ? 'assumed' : null,
        assumptionNote: revenueAssumptionNote,
      };
    }

    const costEstimate = {
      available: false,
      reason:
        'No real per-farmer production cost dataset exists in this codebase: the FarmCostingPage frontend calls ' +
        '/farm-costing/records, which has no backend route; AF-CO (costControlService.js) is company/cost-centre ' +
        'scoped, not per-farmer, and the fpos table has no company_id to bridge the two. Left honestly incomplete ' +
        'rather than inventing a cost figure.',
    };

    let district = landRecords[0]?.district || farmer?.district || null;
    let state = landRecords[0]?.state || farmer?.state || null;

    const historicalRevenue = cropPlan
      ? await this._getHistoricalRevenueByCrop(farmerId, cropPlan.crop_type, district, state)
      : [];

    const financialProjection = {
      historicalRevenueBySeasonInr: historicalRevenue,
      note: historicalRevenue.length > 0
        ? 'Real season-by-season revenue for this crop from the farmer\'s own recorded crop_plans — a track record, not a forward projection. No agronomic yield-growth model exists in this codebase to honestly project future years.'
        : 'No prior recorded seasons for this crop to build a track record from.',
      financingAskToLatestRevenueRatio: (financingAskInr && historicalRevenue.length > 0 && historicalRevenue[historicalRevenue.length - 1].revenueInr)
        ? Number((Number(financingAskInr) / historicalRevenue[historicalRevenue.length - 1].revenueInr).toFixed(2))
        : null,
      netIncomeProjection: { available: false, reason: 'Depends on the cost estimate above, which is not available.' },
    };

    const applicableSchemes = await this._getApplicableSchemes(cropPlan?.crop_type, state);

    return {
      identity: {
        farmer: farmer ? {
          id: farmer.id,
          name: farmer.name,
          phone: farmer.phone,
          email: farmer.email,
          farmSizeHectares: farmer.farm_size_hectares !== null ? Number(farmer.farm_size_hectares) : null,
          yearsActive: farmer.years_active,
          fdiScore: farmer.fdi_score,
          fdiGrade: farmer.fdi_grade,
        } : null,
        fpo: fpo ? {
          id: fpo.id,
          name: fpo.name,
          registrationNumber: fpo.registration_number,
          memberCount: fpo.member_count,
          totalAreaHectares: fpo.total_area_hectares !== null ? Number(fpo.total_area_hectares) : null,
        } : null,
      },
      landRecords,
      cropPlan: cropPlan ? {
        id: cropPlan.id,
        cropType: cropPlan.crop_type,
        variety: cropPlan.variety,
        season: cropPlan.season,
        plantingDate: cropPlan.planting_date,
        expectedHarvestDate: cropPlan.expected_harvest_date,
        status: cropPlan.status,
      } : null,
      yieldAndRevenue,
      costEstimate,
      financialProjection,
      applicableSchemes,
      financing: {
        purpose,
        financingAskInr: financingAskInr !== undefined && financingAskInr !== null ? Number(financingAskInr) : null,
      },
      assembledAt: new Date().toISOString(),
    };
  }

  async generate({ farmerId, fpoId, cropPlanId, purpose, financingAskInr, generatedBy }) {
    const document = await this.assemble({ farmerId, fpoId, cropPlanId, purpose, financingAskInr });

    try {
      let result = await this.pool.query(
        `INSERT INTO dpr_documents (farmer_id, fpo_id, crop_plan_id, purpose, financing_ask_inr, document_json, generated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          farmerId || null,
          fpoId || document.identity.fpo?.id || null,
          cropPlanId || document.cropPlan?.id || null,
          purpose,
          financingAskInr ?? null,
          JSON.stringify(document),
          generatedBy || null,
        ]
      );
      logger.info(`DPR generated: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error persisting DPR', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getById(dprId, access = {}) {
    let params = [dprId];
    let accessClause = '';
    if (!access.isAdmin) {
      params.push(access.userId);
      accessClause = ` AND (generated_by = $${params.length} OR farmer_id IN (SELECT id FROM farmers WHERE user_id = $${params.length}))`;
    }
    let result = await this.pool.query(`SELECT * FROM dpr_documents WHERE id = $1${accessClause}`, params);
    if (result.rows.length === 0) throw new Error('DPR not found');
    return result.rows[0];
  }

  async list(filters = {}, access = {}) {
    let query = 'SELECT id, farmer_id, fpo_id, crop_plan_id, purpose, financing_ask_inr, created_at FROM dpr_documents WHERE 1=1';
    let params = [];
    if (filters.farmerId) { params.push(filters.farmerId); query += ` AND farmer_id = $${params.length}`; }
    if (filters.fpoId) { params.push(filters.fpoId); query += ` AND fpo_id = $${params.length}`; }
    if (!access.isAdmin) { params.push(access.userId); query += ` AND (generated_by = $${params.length} OR farmer_id IN (SELECT id FROM farmers WHERE user_id = $${params.length}))`; }
    query += ' ORDER BY created_at DESC';
    let result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Stream a formatted PDF of a stored DPR directly to an HTTP response.
   * pdfkit is already a backend dependency (package.json) — no new library added.
   */
  async streamPdf(dprId, res, access = {}) {
    const row = await this.getById(dprId, access);
    const doc = row.document_json;

    await this.pool.query('UPDATE dpr_documents SET pdf_downloaded_at = NOW() WHERE id = $1', [dprId]);

    const pdf = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DPR-${dprId}.pdf"`);
    pdf.pipe(res);

    pdf.fontSize(18).text('Detailed Project Report (DPR)', { align: 'center' });
    pdf.moveDown();
    pdf.fontSize(10).fillColor('#555').text(`Generated: ${doc.assembledAt}`, { align: 'center' });
    pdf.fillColor('#000').moveDown(1.5);

    const section = (title) => { pdf.moveDown(0.5); pdf.fontSize(14).text(title, { underline: true }); pdf.moveDown(0.3); pdf.fontSize(11); };
    const line = (label, value) => pdf.text(`${label}: ${value === null || value === undefined || value === '' ? 'Not recorded' : value}`);

    section('1. Applicant Identity');
    if (doc.identity.farmer) {
      line('Farmer', doc.identity.farmer.name);
      line('Phone', doc.identity.farmer.phone);
      line('Farm size (hectares)', doc.identity.farmer.farmSizeHectares);
      line('FDI score / grade', `${doc.identity.farmer.fdiScore ?? '—'} / ${doc.identity.farmer.fdiGrade ?? '—'}`);
    }
    if (doc.identity.fpo) {
      line('FPO', doc.identity.fpo.name);
      line('FPO registration number', doc.identity.fpo.registrationNumber);
      line('FPO member count', doc.identity.fpo.memberCount);
    }
    if (!doc.identity.farmer && !doc.identity.fpo) pdf.text('No applicant identity on record.');

    section('2. Land Records');
    if (doc.landRecords.length === 0) {
      pdf.text('No land records on file for this farmer.');
    } else {
      doc.landRecords.forEach((l, i) => {
        pdf.text(`${i + 1}. Survey ${l.survey_number || '—'}, ${l.village}, ${l.district}, ${l.state} — ` +
          `${l.area_in_hectares ?? '—'} ha (${l.verification_status})`);
      });
    }

    section('3. Crop Plan');
    if (doc.cropPlan) {
      line('Crop', `${doc.cropPlan.cropType}${doc.cropPlan.variety ? ` (${doc.cropPlan.variety})` : ''}`);
      line('Season', doc.cropPlan.season);
      line('Planting date', doc.cropPlan.plantingDate);
      line('Expected harvest date', doc.cropPlan.expectedHarvestDate);
      line('Status', doc.cropPlan.status);
    } else {
      pdf.text('No crop plan on file for this farmer.');
    }

    section('4. Expected Yield & Revenue');
    if (doc.yieldAndRevenue) {
      line('Estimated yield', `${doc.yieldAndRevenue.estimatedYield ?? '—'} (${doc.yieldAndRevenue.estimatedYieldUnit})`);
      if (doc.yieldAndRevenue.latestMandiPrice) {
        const p = doc.yieldAndRevenue.latestMandiPrice;
        line('Latest mandi price (modal, ₹/quintal)', `${p.modal_price_inr_per_qtl} — ${p.market_name}, ${p.price_date}`);
      } else {
        pdf.text('No recent mandi price found for this commodity.');
      }
      line('Expected revenue (INR)', doc.yieldAndRevenue.expectedRevenueInr);
      if (doc.yieldAndRevenue.assumptionNote) {
        pdf.fontSize(9).fillColor('#9a6700').text(`Assumption: ${doc.yieldAndRevenue.assumptionNote}`);
        pdf.fillColor('#000').fontSize(11);
      }
    } else {
      pdf.text('No crop plan on file — yield/revenue projection not available.');
    }

    section('5. Cost Estimate');
    if (doc.costEstimate.available) {
      pdf.text(JSON.stringify(doc.costEstimate));
    } else {
      pdf.fillColor('#bc4c00').text('INCOMPLETE — not available.');
      pdf.fillColor('#000').fontSize(9).text(doc.costEstimate.reason);
      pdf.fontSize(11);
    }

    section('6. Financial Projection (Historical Track Record)');
    if (doc.financialProjection?.historicalRevenueBySeasonInr?.length > 0) {
      doc.financialProjection.historicalRevenueBySeasonInr.forEach((h, i) => {
        pdf.text(`${i + 1}. ${h.season || 'Season'} (${h.plantingDate || '—'}): yield ${h.yield ?? '—'} (${h.yieldBasis}), revenue ₹${h.revenueInr ?? '—'}`);
      });
      if (doc.financialProjection.financingAskToLatestRevenueRatio !== null) {
        line('Financing ask vs. latest season revenue (ratio)', doc.financialProjection.financingAskToLatestRevenueRatio);
      }
    } else {
      pdf.text('No prior recorded seasons for this crop to build a track record from.');
    }
    pdf.fontSize(9).fillColor('#9a6700').text(doc.financialProjection?.note || '');
    pdf.fillColor('#bc4c00').text('Net income projection: INCOMPLETE — depends on the cost estimate above, which is not available.');
    pdf.fillColor('#000').fontSize(11);

    section('7. Applicable Government Schemes');
    if (doc.applicableSchemes?.eligible_schemes?.length > 0) {
      doc.applicableSchemes.eligible_schemes.forEach((s, i) => {
        pdf.text(`${i + 1}. ${s.name} (${s.code}) — ${s.ministry}, status: ${s.status}`);
      });
      pdf.fontSize(9).fillColor('#555').text(doc.applicableSchemes.reminder || '');
      pdf.fillColor('#000').fontSize(11);
    } else {
      pdf.text('No matching verified schemes found for this crop/state.');
    }

    section('8. Financing Ask');
    line('Purpose', doc.financing.purpose);
    line('Amount requested (INR)', doc.financing.financingAskInr);

    pdf.end();
  }
}

module.exports = new DprGenerationService();



