/**
 * GST Service - Goods and Services Tax Calculation
 * Handles GST calculation for AFRERA platform orders
 *
 * BRANDED / UNBRANDED STAPLE RULE (2026-08-08)
 * A flat HSN -> gst_rate mapping (047_gst_tables.sql) cannot represent a
 * real and well-known CBIC rule: several agricultural staples — cereals
 * under HSN Chapter 10 among them — are NIL-rated when sold loose/unbranded
 * but become taxable when "put up in unit container and bearing a
 * registered brand name" (the operative test used in the CBIC goods
 * exemption/rate notification structure for these categories). Migration
 * 064_gst_branding_classification.sql adds branding_dependent /
 * rate_loose_unbranded / rate_branded_packaged to hsn_gst_mapping, and
 * is_branded_packaged / registered_brand_name / unit_container_size to
 * products. This file is the only place that reads those columns to decide
 * a rate — see resolveGSTRate() below.
 *
 * HONESTY ON RATES: this file does not assert a specific notification
 * number/date beyond what was already given as project context (the
 * branded-goods carve-out inside the Chapter 1-21 exemption notification,
 * paired with the branded entry in the goods-rate notification). The 5%
 * rate_branded_packaged seeded for Chapter 10 cereals in the migration is
 * the commonly-cited rate for this class of staple but has not been
 * independently verified from data inside this codebase — treat it as
 * structurally correct (branding changes the rate, here is how it is
 * looked up) rather than as a confirmed current number for a filing.
 *
 * PACKET SIZE: unit_container_size is stored for display/audit only.
 * No verified CBIC threshold ties a specific pack size to a rate change
 * for any category this platform sells, so no such rule is implemented —
 * see the migration's comment on that column.
 */

const { logger } = require('../../utils/logger');
const { withTransaction } = require('../../core/withTransaction');

/** Round to 2 decimal places — matches this schema's DECIMAL(12,2)/(4,2) money columns. */
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Home/supplier state for CGST+SGST (intra-state) vs IGST (inter-state)
// determination. Matches the seller_state default ('AS' = Assam) already
// established in 047_gst_tables.sql's gst_invoices table — not a new guess,
// the same assumption the schema already encodes.
const HOME_STATE_NAME = 'Assam';

class GSTService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database/pool');
  }

  /**
   * GST Rates based on product categories.
   * Last-resort fallback only — see resolveGSTRate() for the real,
   * HSN-driven classification. Kept for callers with no HSN/product row at
   * all (e.g. an ad-hoc category string) and for backward compatibility
   * with the existing /rate/:category route.
   */
  getGSTRate(productCategory) {
    const gstRates = {
      'fruits': 0,           // 0% - Fresh fruits
      'vegetables': 0,       // 0% - Fresh vegetables
      'cereals': 0,          // 0% - Cereals
      'pulses': 0,           // 0% - Pulses
      'milk': 0,             // 0% - Milk
      'flour': 0,            // 0% - Flour
      'processed_food': 5,   // 5% - Processed food
      'spices': 5,           // 5% - Spices
      'honey': 5,            // 5% - Honey
      'tea': 5,              // 5% - Tea
      'coffee': 5,           // 5% - Coffee
      'dairy_products': 12, // 12% - Dairy products
      'oil': 12,             // 12% - Edible oil
      'sugar': 12,           // 12% - Sugar
      'value_added': 18,    // 18% - Value added products
      'packaged_food': 18,   // 18% - Packaged food
      'beverages': 18,      // 18% - Beverages
      'snacks': 18,          // 18% - Snacks
      'services': 18        // 18% - Services
    };

    return gstRates[productCategory] || 18; // Default 18%
  }

  /**
   * TRUE only when BOTH conditions the notification actually tests are met:
   * put up in a unit container AND bearing a registered brand name. Either
   * one alone (packaged-but-unbranded, or branded-but-loose) does not
   * qualify — this is the most common real-world mistake with this rule.
   * Accepts either the DB's snake_case product row or a camelCase request
   * body (the /calculate/product route passes req.body directly).
   */
  isBrandedPackaged(product = {}) {
    const isPackaged = product.is_branded_packaged !== undefined
      ? product.is_branded_packaged
      : product.isBrandedPackaged;
    const brandName = product.registered_brand_name !== undefined
      ? product.registered_brand_name
      : product.registeredBrandName;
    return Boolean(
      isPackaged === true &&
      typeof brandName === 'string' &&
      brandName.trim().length > 0
    );
  }

  /**
   * Pure resolver: given an hsn_gst_mapping row (or null) and a product,
   * return the applicable rate and where it came from. No DB access here —
   * calculateOrderGST supplies hsnRow via a LEFT JOIN (no N+1 queries);
   * classifyProductGST supplies it via a single lookup query.
   *
   * Precedence:
   *   1. hsnRow.branding_dependent = TRUE  -> rate_branded_packaged or
   *      rate_loose_unbranded, chosen by isBrandedPackaged()
   *   2. hsnRow.branding_dependent = FALSE -> hsnRow's flat gst_rate
   *   3. product.gst_rate (already stored per-product by 009's category
   *      backfill), if the HSN code has no mapping row at all
   *   4. category-name fallback via getGSTRate()
   */
  resolveGSTRate({ hsnRow, product = {}, categoryName }) {
    const branded = this.isBrandedPackaged(product);

    if (hsnRow) {
      if (hsnRow.branding_dependent) {
        const rate = branded ? hsnRow.rate_branded_packaged : hsnRow.rate_loose_unbranded;
        if (rate !== null && rate !== undefined) {
          return {
            rate: Number(rate),
            source: branded ? 'hsn_branded_packaged' : 'hsn_loose_unbranded',
            hsnCode: hsnRow.hsn_code || null
          };
        }
      } else if (hsnRow.gst_rate !== null && hsnRow.gst_rate !== undefined) {
        return { rate: Number(hsnRow.gst_rate), source: 'hsn_flat', hsnCode: hsnRow.hsn_code || null };
      }
    }

    const productRate = product.gst_rate !== undefined ? product.gst_rate : product.gstRate;
    if (productRate !== null && productRate !== undefined) {
      const hsnCode = product.hsn_code || product.hsnCode || null;
      return { rate: Number(productRate), source: 'product_stored_rate', hsnCode };
    }

    return { rate: this.getGSTRate(categoryName), source: 'category_fallback', hsnCode: null };
  }

  /**
   * Real classification entry point for a single product/lot: looks up its
   * HSN code in hsn_gst_mapping (one query) and resolves the rate,
   * including the branding-dependent case. Use this at listing/pricing time
   * for a single item; calculateOrderGST does the equivalent in bulk via a
   * LEFT JOIN for a whole order.
   */
  async classifyProductGST(product = {}) {
    const hsnCode = product.hsn_code || product.hsnCode || null;
    let hsnRow = null;

    if (hsnCode) {
      const { rows } = await this.pool.query(
        `SELECT hsn_code, gst_rate, branding_dependent, rate_loose_unbranded, rate_branded_packaged
         FROM hsn_gst_mapping WHERE hsn_code = $1`,
        [hsnCode]
      );
      hsnRow = rows[0] || null;
    }

    const categoryName = product.category_name || product.category || null;
    return this.resolveGSTRate({ hsnRow, product, categoryName });
  }

  /**
   * Calculate GST for an order — now HSN- and branding-aware.
   *
   * FIX 2026-08-08: the previous query selected p.category, which does not
   * exist on products (products carries category_id, a FK to categories —
   * see 009_marketplace_enhancements.sql's own fix comment for the same
   * bug in its UPDATE statement). Every call to this method against a real
   * order would have failed with "column p.category does not exist". Now
   * joins categories for the display name and hsn_gst_mapping for the real
   * rate lookup, in one query (no N+1).
   */
  async calculateOrderGST(orderId) {
    try {
      const query = `
        SELECT
          oi.product_id,
          oi.quantity,
          oi.unit_price,
          p.name AS product_name,
          p.hsn_code,
          p.gst_rate AS product_gst_rate,
          p.gst_applicable,
          p.is_branded_packaged,
          p.registered_brand_name,
          c.name AS category_name,
          h.gst_rate AS hsn_flat_rate,
          h.branding_dependent,
          h.rate_loose_unbranded,
          h.rate_branded_packaged
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN hsn_gst_mapping h ON h.hsn_code = p.hsn_code
        WHERE oi.order_id = $1
      `;

      const result = await this.pool.query(query, [orderId]);
      const items = result.rows;

      let totalGST = 0;
      const gstBreakdown = [];

      for (const item of items) {
        if (!item.gst_applicable) {
          continue;
        }

        // A matched hsn_gst_mapping row always has a real boolean in
        // branding_dependent (NOT NULL DEFAULT FALSE); a LEFT JOIN miss
        // leaves it NULL. That is the reliable signal a row was found,
        // rather than assuming presence from p.hsn_code alone.
        const hsnMatched = item.branding_dependent !== null && item.branding_dependent !== undefined;
        const hsnRow = hsnMatched ? {
          hsn_code: item.hsn_code,
          gst_rate: item.hsn_flat_rate,
          branding_dependent: item.branding_dependent,
          rate_loose_unbranded: item.rate_loose_unbranded,
          rate_branded_packaged: item.rate_branded_packaged
        } : null;

        const classification = this.resolveGSTRate({
          hsnRow,
          product: {
            gst_rate: item.product_gst_rate,
            hsn_code: item.hsn_code,
            is_branded_packaged: item.is_branded_packaged,
            registered_brand_name: item.registered_brand_name
          },
          categoryName: item.category_name
        });

        const gstRate = classification.rate;
        const itemValue = Number(item.quantity) * Number(item.unit_price);
        const gstAmount = r2((itemValue * gstRate) / 100);

        totalGST = r2(totalGST + gstAmount);

        gstBreakdown.push({
          productId: item.product_id,
          productName: item.product_name,
          hsnCode: item.hsn_code || null,
          category: item.category_name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          gstRate,
          rateSource: classification.source,
          isBrandedPackaged: this.isBrandedPackaged({
            is_branded_packaged: item.is_branded_packaged,
            registered_brand_name: item.registered_brand_name
          }),
          itemValue: r2(itemValue),
          gstAmount
        });
      }

      return {
        orderId,
        totalGST: totalGST.toFixed(2),
        gstBreakdown,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error calculating order GST', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Calculate GST for a single product (e.g. from a request body). Uses the
   * real HSN/branding classification via classifyProductGST when an HSN
   * code is present, falling back to the category map otherwise.
   */
  async calculateProductGST(product) {
    const classification = await this.classifyProductGST(product);
    const gstRate = classification.rate;
    const price = Number(product.price);
    const gstAmount = r2((price * gstRate) / 100);

    return {
      productId: product.id,
      productName: product.name,
      category: product.category || product.category_name || null,
      hsnCode: classification.hsnCode,
      basePrice: price,
      gstRate,
      rateSource: classification.source,
      isBrandedPackaged: this.isBrandedPackaged(product),
      gstAmount: gstAmount.toFixed(2),
      totalPrice: (price + gstAmount).toFixed(2)
    };
  }

  /**
   * Get GST summary for a period.
   *
   * FIX 2026-08-08: same p.category bug as calculateOrderGST (products has
   * no category text column) — this query would also have failed on any
   * real data. Resolves the name through categories, matching the fix
   * pattern 009_marketplace_enhancements.sql already used for its UPDATE.
   */
  async getGSTSummary(startDate, endDate) {
    try {
      const query = `
        SELECT
          DATE_TRUNC('month', o.created_at) as month,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_amount) as total_sales,
          SUM(o.gst_amount) as total_gst_collected,
          c.name as category,
          COUNT(oi.id) as item_count,
          SUM(oi.quantity * oi.unit_price) as category_sales
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.created_at >= $1 AND o.created_at <= $2
          AND o.status = 'completed'
        GROUP BY month, c.name
        ORDER BY month DESC, category_sales DESC
      `;

      const result = await this.pool.query(query, [startDate, endDate]);

      return {
        period: { startDate, endDate },
        summary: result.rows
      };
    } catch (error) {
      logger.error('Error getting GST summary', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Ledger posting (AF-FI integration)
  // -------------------------------------------------------------------

  /**
   * Best-effort resolution of "the" company to post GST liability against,
   * for callers that do not pass one explicitly. Mirrors
   * assetAccountingService/costControlService's convention of requiring a
   * companyId rather than inventing one — this only picks among companies
   * that already exist; it never creates one. Returns null (not a throw)
   * when none exists, so invoice generation can still proceed without
   * ledger posting rather than hard-failing.
   */
  async resolveDefaultCompanyId() {
    const { rows } = await this.pool.query(
      'SELECT id FROM companies WHERE is_active = TRUE ORDER BY id ASC LIMIT 1'
    );
    return rows[0] ? rows[0].id : null;
  }

  /**
   * Idempotent find-or-create for a chart_of_accounts row, scoped to a
   * company. GST liability/receivable accounts are not seeded by any
   * migration (no company is seeded either — see 996_enterprise_foundation),
   * so they are created lazily the first time a company actually posts a
   * GST invoice, matching the UNIQUE (company_id, account_code) constraint.
   */
  async findOrCreateAccount(client, companyId, accountCode, accountName, accountType, normalBalance) {
    const existing = await client.query(
      'SELECT id FROM chart_of_accounts WHERE company_id = $1 AND account_code = $2',
      [companyId, accountCode]
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const inserted = await client.query(
      `INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, normal_balance, is_postable)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (company_id, account_code) DO NOTHING
       RETURNING id`,
      [companyId, accountCode, accountName, accountType, normalBalance]
    );
    if (inserted.rows[0]) return inserted.rows[0].id;

    // Lost a race with a concurrent create — the row exists now, read it back.
    const reread = await client.query(
      'SELECT id FROM chart_of_accounts WHERE company_id = $1 AND account_code = $2',
      [companyId, accountCode]
    );
    return reread.rows[0].id;
  }

  /**
   * Posts the output-GST liability for one GST invoice into the real
   * double-entry ledger (journal_entries/journal_lines from
   * 996_enterprise_foundation), the same tables costControlService and
   * assetAccountingService post/read against.
   *
   * Entry posted (when there is a liability at all):
   *   Dr  GST-AR-TAX      (Accounts Receivable — GST Component)  total GST
   *     Cr  GST-OUT-CGST  (Output CGST Payable)                  cgstAmount
   *     Cr  GST-OUT-SGST  (Output SGST Payable)                  sgstAmount
   *     Cr  GST-OUT-IGST  (Output IGST Payable)                  igstAmount
   *
   * SCOPE: this posts only the GST/tax component, not the full sale
   * (taxable value / revenue recognition is not this service's to invent —
   * it belongs to whichever service owns order revenue posting, which is
   * out of scope here). The debit side represents the tax portion of what
   * the customer owes; the credit side is what is owed to the government —
   * exactly the "output GST payable" liability the task asked to make
   * provable from the books.
   *
   * Must run inside the same transaction as the gst_invoices/
   * gst_invoice_items writes (see generateGSTInvoice) — `client` is the
   * withTransaction-provided connection, never this.pool.
   */
  async postGSTInvoiceToLedger(client, { companyId, invoiceId, invoiceNumber, invoiceDate, cgstAmount = 0, sgstAmount = 0, igstAmount = 0 }) {
    const totalGST = r2(Number(cgstAmount) + Number(sgstAmount) + Number(igstAmount));
    if (totalGST <= 0) {
      return { posted: false, reason: 'no GST liability (NIL-rated or zero-value invoice)' };
    }

    const arAccountId = await this.findOrCreateAccount(
      client, companyId, 'GST-AR-TAX', 'Accounts Receivable - GST Component', 'asset', 'DR'
    );

    const creditLines = [];
    if (Number(cgstAmount) > 0) {
      const id = await this.findOrCreateAccount(client, companyId, 'GST-OUT-CGST', 'Output CGST Payable', 'liability', 'CR');
      creditLines.push({ accountId: id, amount: r2(cgstAmount), label: 'CGST' });
    }
    if (Number(sgstAmount) > 0) {
      const id = await this.findOrCreateAccount(client, companyId, 'GST-OUT-SGST', 'Output SGST Payable', 'liability', 'CR');
      creditLines.push({ accountId: id, amount: r2(sgstAmount), label: 'SGST' });
    }
    if (Number(igstAmount) > 0) {
      const id = await this.findOrCreateAccount(client, companyId, 'GST-OUT-IGST', 'Output IGST Payable', 'liability', 'CR');
      creditLines.push({ accountId: id, amount: r2(igstAmount), label: 'IGST' });
    }

    const entryNumber = `GST-${invoiceNumber}`;
    const entryResult = await client.query(
      `INSERT INTO journal_entries
         (company_id, entry_number, entry_date, journal_type, description, reference_type, reference_id, status, posted_at)
       VALUES ($1, $2, $3, 'sales', $4, 'gst_invoice', $5, 'posted', NOW())
       RETURNING id`,
      [companyId, entryNumber, invoiceDate, `Output GST on GST invoice ${invoiceNumber}`, String(invoiceId)]
    );
    const journalEntryId = entryResult.rows[0].id;

    let lineNumber = 1;
    await client.query(
      `INSERT INTO journal_lines (journal_entry_id, line_number, account_id, debit, credit, base_debit, base_credit, description)
       VALUES ($1, $2, $3, $4, 0, $4, 0, $5)`,
      [journalEntryId, lineNumber++, arAccountId, totalGST, `GST receivable component - invoice ${invoiceNumber}`]
    );
    for (const line of creditLines) {
      await client.query(
        `INSERT INTO journal_lines (journal_entry_id, line_number, account_id, debit, credit, base_debit, base_credit, description)
         VALUES ($1, $2, $3, 0, $4, 0, $4, $5)`,
        [journalEntryId, lineNumber++, line.accountId, line.amount, `Output ${line.label} payable - invoice ${invoiceNumber}`]
      );
    }

    return { posted: true, journalEntryId, entryNumber, totalGST };
  }

  /**
   * Generate (and now persist) a GST invoice for an order, then post its
   * output-GST liability to the general ledger.
   *
   * FIX 2026-08-08: previously this computed a GST breakdown and returned
   * it in an ad-hoc object with a generated invoice number, but never wrote
   * a gst_invoices/gst_invoice_items row — the "separate GST table" the
   * platform's own accounting comments refer to did not actually get
   * populated. That in turn meant there was never a durable invoice row to
   * post a ledger entry against. Both gaps are closed here in one
   * transaction: persist the invoice + items, then post the ledger entry,
   * so a rollback of one rolls back the other.
   *
   * `options.companyId` lets a caller that knows its company post
   * explicitly; when omitted this resolves the sole/first active company.
   * If no company exists yet, the invoice still persists — only ledger
   * posting is skipped (ledgerPosting.posted === false), so invoice
   * generation does not hard-fail on an accounting spine that has not been
   * provisioned yet.
   */
  async generateGSTInvoice(orderId, options = {}) {
    try {
      const gstCalculation = await this.calculateOrderGST(orderId);

      const orderQuery = `
        SELECT
          o.*,
          u.name as customer_name,
          u.gst_number as customer_gst
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `;
      const orderResult = await this.pool.query(orderQuery, [orderId]);
      const order = orderResult.rows[0];
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Buyer state (for CGST+SGST vs IGST) — best-effort from the
      // shipping address. Unresolvable state is treated as inter-state
      // (IGST) rather than guessing a 50/50 CGST/SGST split, since an
      // incorrect CGST/SGST posting is a state-vs-state filing error while
      // IGST is the conservative single-bucket default.
      let buyerState = null;
      if (order.shipping_address_id) {
        const addrResult = await this.pool.query(
          'SELECT state FROM addresses WHERE id = $1',
          [order.shipping_address_id]
        );
        buyerState = addrResult.rows[0] ? addrResult.rows[0].state : null;
      }
      const isIntraState = buyerState
        ? buyerState.trim().toLowerCase() === HOME_STATE_NAME.toLowerCase()
        : false;

      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      let taxableValue = 0;
      for (const item of gstCalculation.gstBreakdown) {
        const itemGST = Number(item.gstAmount);
        taxableValue = r2(taxableValue + item.itemValue);
        if (isIntraState) {
          const half = r2(itemGST / 2);
          cgstAmount = r2(cgstAmount + half);
          sgstAmount = r2(sgstAmount + r2(itemGST - half));
        } else {
          igstAmount = r2(igstAmount + itemGST);
        }
      }
      const totalGSTNum = r2(cgstAmount + sgstAmount + igstAmount);

      const invoiceNumber = `GSTINV-${Date.now()}-${String(orderId).slice(0, 8)}`;
      const companyId = options.companyId || await this.resolveDefaultCompanyId();

      const persisted = await withTransaction(async (client) => {
        const invoiceInsert = await client.query(
          `INSERT INTO gst_invoices
             (invoice_number, order_id, invoice_type, invoice_date, customer_name, customer_gst_number,
              customer_state, supplier_state, total_amount, total_gst, cgst_amount, sgst_amount, igst_amount,
              grand_total, invoice_status, gst_calculation)
           VALUES ($1, $2, 'tax_invoice', CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'generated', $13)
           RETURNING *`,
          [
            invoiceNumber, orderId, order.customer_name, order.customer_gst,
            buyerState, HOME_STATE_NAME, taxableValue, totalGSTNum,
            cgstAmount, sgstAmount, igstAmount, r2(taxableValue + totalGSTNum),
            JSON.stringify(gstCalculation)
          ]
        );
        const invoice = invoiceInsert.rows[0];

        for (const item of gstCalculation.gstBreakdown) {
          const itemGST = Number(item.gstAmount);
          let itemCgst = 0, itemSgst = 0, itemIgst = 0;
          if (isIntraState) {
            itemCgst = r2(itemGST / 2);
            itemSgst = r2(itemGST - itemCgst);
          } else {
            itemIgst = itemGST;
          }
          await client.query(
            `INSERT INTO gst_invoice_items
               (invoice_id, product_id, product_name, hsn_code, product_category, quantity, unit_price,
                total_amount, gst_rate, cgst_amount, sgst_amount, igst_amount, total_gst_amount, item_total, taxable_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              invoice.id, item.productId, item.productName, item.hsnCode, item.category,
              item.quantity, item.unitPrice, item.itemValue, item.gstRate,
              itemCgst, itemSgst, itemIgst, itemGST, r2(item.itemValue + itemGST), item.itemValue
            ]
          );
        }

        let ledgerPosting = { posted: false, reason: 'no company configured for ledger posting' };
        if (companyId) {
          ledgerPosting = await this.postGSTInvoiceToLedger(client, {
            companyId,
            invoiceId: invoice.id,
            invoiceNumber,
            invoiceDate: invoice.invoice_date,
            cgstAmount,
            sgstAmount,
            igstAmount
          });
        }

        return { invoice, ledgerPosting };
      }, { name: 'gstService.generateGSTInvoice' });

      return {
        invoiceNumber,
        invoiceId: persisted.invoice.id,
        orderDetails: order,
        gstCalculation,
        ledgerPosting: persisted.ledgerPosting,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating GST invoice', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Validate GST number format
   */
  validateGSTNumber(gstNumber) {
    // GSTIN format: 22AAAAA0000A1Z5 (15 characters)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  /**
   * Update order with GST details
   */
  async updateOrderGST(orderId, gstDetails) {
    try {
      const query = `
        UPDATE orders
        SET
          gst_amount = $1,
          gst_breakdown = $2,
          gst_invoice_number = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        gstDetails.totalGST,
        JSON.stringify(gstDetails.gstBreakdown),
        gstDetails.invoiceNumber,
        orderId
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating order GST', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new GSTService();
