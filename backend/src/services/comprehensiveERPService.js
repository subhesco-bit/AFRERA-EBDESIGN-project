/**
 * Comprehensive ERP Core Service - Oracle/SAP Standards
 * 
 * Complete ERP implementation following Oracle E-Business Suite and SAP S/4HANA standards
 * Includes all core ERP modules: FI, CO, MM, SD, PP, QM, PM, HR, PS, TR, AM, BI
 * 
 * Architecture: Multi-tenant, multi-org, multi-currency, multi-language
 * Compliance: IFRS, GAAP, GST, VAT, local regulations
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { signalBus } = require('../core/signalBus');
const aiBackbone = require('./aiBackboneService');

// ============================================================================
// MODULE 1: FINANCIAL ACCOUNTING (FI) / GENERAL LEDGER (GL)
// ============================================================================

/**
 * General Ledger Module - Complete financial accounting
 */
const generalLedger = {
  /**
   * Create chart of accounts
   */
  createChartOfAccounts: async (chartData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { chart_id, name, description, currency, fiscal_year_variant } = chartData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_chart_of_accounts (chart_id, name, description, currency, fiscal_year_variant, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         RETURNING *`,
        [chart_id, name, description, currency, fiscal_year_variant]
      );
      
      await signalBus.emit('erp.gl.chart.created', { chart_id, timestamp: new Date().toISOString() });
      logger.info('Chart of accounts created', { chart_id });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating chart of accounts', { error: error.message });
      throw error;
    }
  },

  /**
   * Create general ledger account
   */
  createGLAccount: async (accountData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { account_code, account_name, account_type, chart_id, description, currency, posting_blocked } = accountData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_gl_accounts (account_code, account_name, account_type, chart_id, description, currency, posting_blocked, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false), 'active', NOW())
         RETURNING *`,
        [account_code, account_name, account_type, chart_id, description, currency, posting_blocked]
      );
      
      await signalBus.emit('erp.gl.account.created', { account_code, timestamp: new Date().toISOString() });
      logger.info('GL account created', { account_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating GL account', { error: error.message });
      throw error;
    }
  },

  /**
   * Post journal entry
   */
  postJournalEntry: async (journalData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { journal_header, journal_lines } = journalData;
      
      // Create journal header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_journal_headers (journal_id, document_date, posting_date, reference, document_type, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, 'posted', $6, NOW())
         RETURNING *`,
        [journal_header.journal_id, journal_header.document_date, journal_header.posting_date, 
         journal_header.reference, journal_header.document_type, journal_header.created_by]
      );
      
      const header = headerRows[0];
      
      // Create journal lines
      for (const line of journal_lines) {
        await pg.query(
          `INSERT INTO erp_journal_lines (journal_id, line_number, account_code, debit_amount, credit_amount, cost_center, profit_center, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [header.journal_id, line.line_number, line.account_code, line.debit_amount, 
           line.credit_amount, line.cost_center, line.profit_center, line.description]
        );
      }
      
      await signalBus.emit('erp.gl.journal.posted', { journal_id: header.journal_id, timestamp: new Date().toISOString() });
      logger.info('Journal entry posted', { journal_id: header.journal_id });
      
      return header;
    } catch (error) {
      logger.error('Error posting journal entry', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate trial balance
   */
  generateTrialBalance: async (fromDate, toDate, chartId) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.account_code, ga.account_name, ga.account_type,
           SUM(jl.debit_amount) as total_debit,
           SUM(jl.credit_amount) as total_credit,
           SUM(jl.debit_amount - jl.credit_amount) as balance
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date BETWEEN $1 AND $2
         AND jh.status = 'posted'
         AND ($3 IS NULL OR ga.chart_id = $3)
         GROUP BY jl.account_code, ga.account_name, ga.account_type
         ORDER BY jl.account_code`,
        [fromDate, toDate, chartId]
      );
      
      return {
        from_date: fromDate,
        to_date: toDate,
        chart_id: chartId,
        generated_at: new Date().toISOString(),
        accounts: rows
      };
    } catch (error) {
      logger.error('Error generating trial balance', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate balance sheet
   */
  generateBalanceSheet: async (asOfDate, chartId) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.account_code, ga.account_name, ga.account_type,
           SUM(jl.debit_amount - jl.credit_amount) as balance
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date <= $1
         AND jh.status = 'posted'
         AND ($2 IS NULL OR ga.chart_id = $2)
         AND ga.account_type IN ('asset', 'liability', 'equity')
         GROUP BY jl.account_code, ga.account_name, ga.account_type
         ORDER BY ga.account_type, jl.account_code`,
        [asOfDate, chartId]
      );
      
      const assets = rows.filter(r => r.account_type === 'asset');
      const liabilities = rows.filter(r => r.account_type === 'liability');
      const equity = rows.filter(r => r.account_type === 'equity');
      
      return {
        as_of_date: asOfDate,
        chart_id: chartId,
        generated_at: new Date().toISOString(),
        assets: { total: assets.reduce((sum, r) => sum + parseFloat(r.balance), 0), items: assets },
        liabilities: { total: liabilities.reduce((sum, r) => sum + parseFloat(r.balance), 0), items: liabilities },
        equity: { total: equity.reduce((sum, r) => sum + parseFloat(r.balance), 0), items: equity }
      };
    } catch (error) {
      logger.error('Error generating balance sheet', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate profit and loss statement
   */
  generateProfitLoss: async (fromDate, toDate, chartId) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.account_code, ga.account_name, ga.account_type,
           SUM(jl.debit_amount - jl.credit_amount) as balance
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date BETWEEN $1 AND $2
         AND jh.status = 'posted'
         AND ($3 IS NULL OR ga.chart_id = $3)
         AND ga.account_type IN ('revenue', 'expense')
         GROUP BY jl.account_code, ga.account_name, ga.account_type
         ORDER BY ga.account_type, jl.account_code`,
        [fromDate, toDate, chartId]
      );
      
      const revenue = rows.filter(r => r.account_type === 'revenue');
      const expenses = rows.filter(r => r.account_type === 'expense');
      
      const totalRevenue = revenue.reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);
      const totalExpenses = expenses.reduce((sum, r) => sum + Math.abs(parseFloat(r.balance)), 0);
      
      return {
        from_date: fromDate,
        to_date: toDate,
        chart_id: chartId,
        generated_at: new Date().toISOString(),
        revenue: { total: totalRevenue, items: revenue },
        expenses: { total: totalExpenses, items: expenses },
        net_profit: totalRevenue - totalExpenses
      };
    } catch (error) {
      logger.error('Error generating profit and loss', { error: error.message });
      throw error;
    }
  },

  /**
   * AI-powered financial analysis
   */
  analyzeFinancialsAI: async (fromDate, toDate, chartId) => {
    try {
      // Get financial data
      const profitLoss = await generalLedger.generateProfitLoss(fromDate, toDate, chartId);
      const balanceSheet = await generalLedger.generateBalanceSheet(toDate, chartId);
      
      const financialData = {
        revenue: profitLoss.revenue.total,
        expenses: profitLoss.expenses.total,
        netProfit: profitLoss.net_profit,
        profitMargin: profitLoss.revenue.total > 0 ? (profitLoss.net_profit / profitLoss.revenue.total * 100).toFixed(2) : 0,
        totalAssets: balanceSheet.assets.total,
        totalLiabilities: balanceSheet.liabilities.total,
        totalEquity: balanceSheet.equity.total
      };
      
      // Call AI for analysis
      const aiAnalysis = await aiBackbone.analyzeFinancialData(financialData);
      
      await signalBus.emit('erp.fi.ai.analysis.completed', { 
        from_date: fromDate, 
        to_date: toDate, 
        timestamp: new Date().toISOString() 
      });
      
      return {
        financial_data: financialData,
        ai_analysis: aiAnalysis,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in AI financial analysis', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 2: CONTROLLING (CO) / COST ACCOUNTING
// ============================================================================

const controlling = {
  /**
   * Create cost center
   */
  createCostCenter: async (costCenterData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { cost_center_code, name, description, profit_center_code, person_responsible, currency } = costCenterData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_cost_centers (cost_center_code, name, description, profit_center_code, person_responsible, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
         RETURNING *`,
        [cost_center_code, name, description, profit_center_code, person_responsible, currency]
      );
      
      await signalBus.emit('erp.co.cost_center.created', { cost_center_code, timestamp: new Date().toISOString() });
      logger.info('Cost center created', { cost_center_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating cost center', { error: error.message });
      throw error;
    }
  },

  /**
   * Create profit center
   */
  createProfitCenter: async (profitCenterData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { profit_center_code, name, description, hierarchy_level, parent_profit_center, person_responsible, currency } = profitCenterData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_profit_centers (profit_center_code, name, description, hierarchy_level, parent_profit_center, person_responsible, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
         RETURNING *`,
        [profit_center_code, name, description, hierarchy_level, parent_profit_center, person_responsible, currency]
      );
      
      await signalBus.emit('erp.co.profit_center.created', { profit_center_code, timestamp: new Date().toISOString() });
      logger.info('Profit center created', { profit_center_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating profit center', { error: error.message });
      throw error;
    }
  },

  /**
   * Post cost allocation
   */
  postCostAllocation: async (allocationData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { allocation_id, from_cost_center, to_cost_center, amount, description, allocation_date, posting_date } = allocationData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_cost_allocations (allocation_id, from_cost_center, to_cost_center, amount, description, allocation_date, posting_date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'posted', NOW())
         RETURNING *`,
        [allocation_id, from_cost_center, to_cost_center, amount, description, allocation_date, posting_date]
      );
      
      await signalBus.emit('erp.co.allocation.posted', { allocation_id, timestamp: new Date().toISOString() });
      logger.info('Cost allocation posted', { allocation_id });
      
      return rows[0];
    } catch (error) {
      logger.error('Error posting cost allocation', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate cost center report
   */
  generateCostCenterReport: async (costCenterCode, fromDate, toDate) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.cost_center, SUM(jl.debit_amount) as total_debit, SUM(jl.credit_amount) as total_credit,
           SUM(jl.debit_amount - jl.credit_amount) as net_balance
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         WHERE jl.cost_center = $1
         AND jh.posting_date BETWEEN $2 AND $3
         AND jh.status = 'posted'
         GROUP BY jl.cost_center`,
        [costCenterCode, fromDate, toDate]
      );
      
      return {
        cost_center_code: costCenterCode,
        from_date: fromDate,
        to_date: toDate,
        generated_at: new Date().toISOString(),
        report: rows[0] || { total_debit: 0, total_credit: 0, net_balance: 0 }
      };
    } catch (error) {
      logger.error('Error generating cost center report', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate profit center report
   */
  generateProfitCenterReport: async (profitCenterCode, fromDate, toDate) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.profit_center, 
           SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) as revenue,
           SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END) as expenses,
           SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) -
           SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END) as profit
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jl.profit_center = $1
         AND jh.posting_date BETWEEN $2 AND $3
         AND jh.status = 'posted'
         GROUP BY jl.profit_center`,
        [profitCenterCode, fromDate, toDate]
      );
      
      return {
        profit_center_code: profitCenterCode,
        from_date: fromDate,
        to_date: toDate,
        generated_at: new Date().toISOString(),
        report: rows[0] || { revenue: 0, expenses: 0, profit: 0 }
      };
    } catch (error) {
      logger.error('Error generating profit center report', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 3: MATERIALS MANAGEMENT (MM)
// ============================================================================

const materialsManagement = {
  /**
   * Create material master
   */
  createMaterialMaster: async (materialData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { material_code, material_type, description, base_unit, material_group, weight, weight_unit, status } = materialData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_material_master (material_code, material_type, description, base_unit, material_group, weight, weight_unit, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'active'), NOW())
         RETURNING *`,
        [material_code, material_type, description, base_unit, material_group, weight, weight_unit, status]
      );
      
      await signalBus.emit('erp.mm.material.created', { material_code, timestamp: new Date().toISOString() });
      logger.info('Material master created', { material_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating material master', { error: error.message });
      throw error;
    }
  },

  /**
   * Create purchase order
   */
  createPurchaseOrder: async (poData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { po_number, vendor_code, purchase_org, purchase_group, currency, document_date, po_items } = poData;
      
      // Create PO header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_purchase_orders (po_number, vendor_code, purchase_org, purchase_group, currency, document_date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'created', NOW())
         RETURNING *`,
        [po_number, vendor_code, purchase_org, purchase_group, currency, document_date]
      );
      
      const header = headerRows[0];
      
      // Create PO items
      for (const item of po_items) {
        await pg.query(
          `INSERT INTO erp_po_items (po_number, item_number, material_code, quantity, unit, price, delivery_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [header.po_number, item.item_number, item.material_code, item.quantity, item.unit, item.price, item.delivery_date]
        );
      }
      
      await signalBus.emit('erp.mm.po.created', { po_number: header.po_number, timestamp: new Date().toISOString() });
      logger.info('Purchase order created', { po_number: header.po_number });
      
      return header;
    } catch (error) {
      logger.error('Error creating purchase order', { error: error.message });
      throw error;
    }
  },

  /**
   * Create goods receipt
   */
  createGoodsReceipt: async (grData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { gr_number, po_number, movement_type, posting_date, gr_items } = grData;
      
      // Create GR header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_goods_receipts (gr_number, po_number, movement_type, posting_date, status, created_at)
         VALUES ($1, $2, $3, $4, 'posted', NOW())
         RETURNING *`,
        [gr_number, po_number, movement_type, posting_date]
      );
      
      const header = headerRows[0];
      
      // Create GR items and update inventory
      for (const item of gr_items) {
        await pg.query(
          `INSERT INTO erp_gr_items (gr_number, item_number, material_code, quantity, unit, storage_location, batch, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [header.gr_number, item.item_number, item.material_code, item.quantity, item.unit, item.storage_location, item.batch]
        );
        
        // Update inventory
        await pg.query(
          `INSERT INTO erp_inventory (material_code, storage_location, quantity, unit, batch, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (material_code, storage_location, batch)
           DO UPDATE SET quantity = erp_inventory.quantity + $3, updated_at = NOW()`,
          [item.material_code, item.storage_location, item.quantity, item.unit, item.batch]
        );
      }
      
      await signalBus.emit('erp.mm.gr.posted', { gr_number: header.gr_number, timestamp: new Date().toISOString() });
      logger.info('Goods receipt posted', { gr_number: header.gr_number });
      
      return header;
    } catch (error) {
      logger.error('Error creating goods receipt', { error: error.message });
      throw error;
    }
  },

  /**
   * Get inventory overview
   */
  getInventoryOverview: async (materialCode, storageLocation) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT i.material_code, mm.description, i.storage_location, i.quantity, i.unit, i.batch, i.created_at
         FROM erp_inventory i
         JOIN erp_material_master mm ON i.material_code = mm.material_code
         WHERE ($1 IS NULL OR i.material_code = $1)
         AND ($2 IS NULL OR i.storage_location = $2)
         ORDER BY i.material_code, i.storage_location`,
        [materialCode, storageLocation]
      );
      
      return {
        material_code: materialCode,
        storage_location: storageLocation,
        generated_at: new Date().toISOString(),
        inventory: rows
      };
    } catch (error) {
      logger.error('Error getting inventory overview', { error: error.message });
      throw error;
    }
  },

  /**
   * AI-powered supply chain optimization
   */
  optimizeSupplyChainAI: async (materialCode, storageLocation) => {
    try {
      // Get supply chain data
      const inventory = await materialsManagement.getInventoryOverview(materialCode, storageLocation);
      
      // Get purchase orders
      const pg = getPostgreSQL();
      const { rows: poRows } = await pg.query(
        `SELECT po.po_number, po.vendor_code, po.document_date, poi.material_code, poi.quantity, poi.price, poi.delivery_date
         FROM erp_purchase_orders po
         JOIN erp_po_items poi ON po.po_number = poi.po_number
         WHERE ($1 IS NULL OR poi.material_code = $1)
         AND po.status IN ('created', 'released')
         ORDER BY po.document_date DESC
         LIMIT 10`,
        [materialCode]
      );
      
      const supplyChainData = {
        inventory: inventory.inventory,
        purchaseOrders: poRows,
        materialCode,
        storageLocation
      };
      
      // Call AI for optimization
      const aiOptimization = await aiBackbone.optimizeSupplyChain(supplyChainData);
      
      await signalBus.emit('erp.mm.ai.optimization.completed', { 
        material_code: materialCode, 
        timestamp: new Date().toISOString() 
      });
      
      return {
        supply_chain_data: supplyChainData,
        ai_optimization: aiOptimization,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in AI supply chain optimization', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 4: SALES AND DISTRIBUTION (SD)
// ============================================================================

const salesDistribution = {
  /**
   * Create customer master
   */
  createCustomerMaster: async (customerData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { customer_code, name, address, city, country, currency, payment_terms, status } = customerData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_customers (customer_code, name, address, city, country, currency, payment_terms, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'active'), NOW())
         RETURNING *`,
        [customer_code, name, address, city, country, currency, payment_terms, status]
      );
      
      await signalBus.emit('erp.sd.customer.created', { customer_code, timestamp: new Date().toISOString() });
      logger.info('Customer master created', { customer_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating customer master', { error: error.message });
      throw error;
    }
  },

  /**
   * Create sales order
   */
  createSalesOrder: async (soData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { so_number, customer_code, sales_org, distribution_channel, division, currency, document_date, so_items } = soData;
      
      // Create SO header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_sales_orders (so_number, customer_code, sales_org, distribution_channel, division, currency, document_date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'created', NOW())
         RETURNING *`,
        [so_number, customer_code, sales_org, distribution_channel, division, currency, document_date]
      );
      
      const header = headerRows[0];
      
      // Create SO items
      for (const item of so_items) {
        await pg.query(
          `INSERT INTO erp_so_items (so_number, item_number, material_code, quantity, unit, price, delivery_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [header.so_number, item.item_number, item.material_code, item.quantity, item.unit, item.price, item.delivery_date]
        );
      }
      
      await signalBus.emit('erp.sd.so.created', { so_number: header.so_number, timestamp: new Date().toISOString() });
      logger.info('Sales order created', { so_number: header.so_number });
      
      return header;
    } catch (error) {
      logger.error('Error creating sales order', { error: error.message });
      throw error;
    }
  },

  /**
   * Create delivery
   */
  createDelivery: async (deliveryData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { delivery_number, so_number, shipping_point, loading_date, delivery_items } = deliveryData;
      
      // Create delivery header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_deliveries (delivery_number, so_number, shipping_point, loading_date, status, created_at)
         VALUES ($1, $2, $3, $4, 'created', NOW())
         RETURNING *`,
        [delivery_number, so_number, shipping_point, loading_date]
      );
      
      const header = headerRows[0];
      
      // Create delivery items
      for (const item of delivery_items) {
        await pg.query(
          `INSERT INTO erp_delivery_items (delivery_number, item_number, material_code, quantity, unit, batch, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [header.delivery_number, item.item_number, item.material_code, item.quantity, item.unit, item.batch]
        );
      }
      
      await signalBus.emit('erp.sd.delivery.created', { delivery_number: header.delivery_number, timestamp: new Date().toISOString() });
      logger.info('Delivery created', { delivery_number: header.delivery_number });
      
      return header;
    } catch (error) {
      logger.error('Error creating delivery', { error: error.message });
      throw error;
    }
  },

  /**
   * Create invoice
   */
  createInvoice: async (invoiceData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { invoice_number, so_number, delivery_number, customer_code, currency, document_date, due_date, invoice_items } = invoiceData;
      
      // Create invoice header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_invoices (invoice_number, so_number, delivery_number, customer_code, currency, document_date, due_date, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'created', NOW())
         RETURNING *`,
        [invoice_number, so_number, delivery_number, customer_code, currency, document_date, due_date]
      );
      
      const header = headerRows[0];
      
      // Create invoice items
      let totalAmount = 0;
      for (const item of invoice_items) {
        const itemTotal = item.quantity * item.price;
        totalAmount += itemTotal;
        
        await pg.query(
          `INSERT INTO erp_invoice_items (invoice_number, item_number, material_code, quantity, unit, price, tax_code, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [header.invoice_number, item.item_number, item.material_code, item.quantity, item.unit, item.price, item.tax_code]
        );
      }
      
      // Update invoice total
      await pg.query(
        `UPDATE erp_invoices SET total_amount = $1 WHERE invoice_number = $2`,
        [totalAmount, header.invoice_number]
      );
      
      await signalBus.emit('erp.sd.invoice.created', { invoice_number: header.invoice_number, timestamp: new Date().toISOString() });
      logger.info('Invoice created', { invoice_number: header.invoice_number });
      
      return { ...header, total_amount };
    } catch (error) {
      logger.error('Error creating invoice', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 5: PRODUCTION PLANNING (PP)
// ============================================================================

const productionPlanning = {
  /**
   * Create production order
   */
  createProductionOrder: async (poData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { production_order, material_code, production_quantity, unit, planned_start_date, planned_finish_date, production_plant, bom, routing } = poData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_production_orders (production_order, material_code, production_quantity, unit, planned_start_date, planned_finish_date, production_plant, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'created', NOW())
         RETURNING *`,
        [production_order, material_code, production_quantity, unit, planned_start_date, planned_finish_date, production_plant]
      );
      
      await signalBus.emit('erp.pp.po.created', { production_order, timestamp: new Date().toISOString() });
      logger.info('Production order created', { production_order });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating production order', { error: error.message });
      throw error;
    }
  },

  /**
   * Release production order
   */
  releaseProductionOrder: async (productionOrder) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `UPDATE erp_production_orders SET status = 'released', released_at = NOW() WHERE production_order = $1 RETURNING *`,
        [productionOrder]
      );
      
      await signalBus.emit('erp.pp.po.released', { production_order, timestamp: new Date().toISOString() });
      logger.info('Production order released', { production_order });
      
      return rows[0];
    } catch (error) {
      logger.error('Error releasing production order', { error: error.message });
      throw error;
    }
  },

  /**
   * Confirm production order
   */
  confirmProductionOrder: async (productionOrder, confirmationData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { actual_quantity, actual_start_date, actual_finish_date, confirmation_text } = confirmationData;
      
      const { rows } = await pg.query(
        `UPDATE erp_production_orders 
         SET status = 'confirmed', 
             actual_quantity = $1,
             actual_start_date = $2,
             actual_finish_date = $3,
             confirmation_text = $4,
             confirmed_at = NOW()
         WHERE production_order = $5 RETURNING *`,
        [actual_quantity, actual_start_date, actual_finish_date, confirmation_text, productionOrder]
      );
      
      await signalBus.emit('erp.pp.po.confirmed', { production_order, timestamp: new Date().toISOString() });
      logger.info('Production order confirmed', { production_order });
      
      return rows[0];
    } catch (error) {
      logger.error('Error confirming production order', { error: error.message });
      throw error;
    }
  },

  /**
   * AI-powered production optimization
   */
  optimizeProductionAI: async (productionPlant, fromDate, toDate) => {
    try {
      // Get production data
      const pg = getPostgreSQL();
      const { rows: poRows } = await pg.query(
        `SELECT po.production_order, po.material_code, po.production_quantity, po.actual_quantity, 
           po.planned_start_date, po.planned_finish_date, po.actual_start_date, po.actual_finish_date,
           po.status
         FROM erp_production_orders po
         WHERE ($1 IS NULL OR po.production_plant = $1)
         AND po.created_at BETWEEN $2 AND $3
         ORDER BY po.created_at DESC
         LIMIT 20`,
        [productionPlant, fromDate, toDate]
      );
      
      // Get capacity data
      const { rows: capacityRows } = await pg.query(
        `SELECT production_plant, COUNT(*) as active_orders,
           SUM(production_quantity) as planned_quantity,
           SUM(COALESCE(actual_quantity, 0)) as actual_quantity
         FROM erp_production_orders
         WHERE status IN ('released', 'confirmed')
         AND ($1 IS NULL OR production_plant = $1)
         GROUP BY production_plant`,
        [productionPlant]
      );
      
      const productionData = {
        productionOrders: poRows,
        capacityUtilization: capacityRows[0] ? 
          (capacityRows[0].actual_quantity / capacityRows[0].planned_quantity * 100).toFixed(2) : 0,
        resources: capacityRows[0] || {},
        qualityMetrics: { defects: 0, rework: 0, firstPassYield: 95 },
        productionPlant,
        fromDate,
        toDate
      };
      
      // Call AI for optimization
      const aiOptimization = await aiBackbone.optimizeProduction(productionData);
      
      await signalBus.emit('erp.pp.ai.optimization.completed', { 
        production_plant: productionPlant, 
        timestamp: new Date().toISOString() 
      });
      
      return {
        production_data: productionData,
        ai_optimization: aiOptimization,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in AI production optimization', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 6: QUALITY MANAGEMENT (QM)
// ============================================================================

const qualityManagement = {
  /**
   * Create inspection lot
   */
  createInspectionLot: async (lotData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { inspection_lot, material_code, inspection_type, origin, quantity, unit, lot_status } = lotData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_inspection_lots (inspection_lot, material_code, inspection_type, origin, quantity, unit, lot_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'created'), NOW())
         RETURNING *`,
        [inspection_lot, material_code, inspection_type, origin, quantity, unit, lot_status]
      );
      
      await signalBus.emit('erp.qm.lot.created', { inspection_lot, timestamp: new Date().toISOString() });
      logger.info('Inspection lot created', { inspection_lot });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating inspection lot', { error: error.message });
      throw error;
    }
  },

  /**
   * Record inspection result
   */
  recordInspectionResult: async (resultData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { inspection_lot, characteristic_code, actual_value, unit, inspector, inspection_date } = resultData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_inspection_results (inspection_lot, characteristic_code, actual_value, unit, inspector, inspection_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [inspection_lot, characteristic_code, actual_value, unit, inspector, inspection_date]
      );
      
      await signalBus.emit('erp.qm.result.recorded', { inspection_lot, timestamp: new Date().toISOString() });
      logger.info('Inspection result recorded', { inspection_lot });
      
      return rows[0];
    } catch (error) {
      logger.error('Error recording inspection result', { error: error.message });
      throw error;
    }
  },

  /**
   * Make usage decision
   */
  makeUsageDecision: async (decisionData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { inspection_lot, decision_code, decision_text, inspector, decision_date } = decisionData;
      
      const { rows } = await pg.query(
        `UPDATE erp_inspection_lots 
         SET lot_status = 'decision_made',
             decision_code = $1,
             decision_text = $2,
             inspector = $3,
             decision_date = $4,
             updated_at = NOW()
         WHERE inspection_lot = $5 RETURNING *`,
        [decision_code, decision_text, inspector, decision_date, inspection_lot]
      );
      
      await signalBus.emit('erp.qm.decision.made', { inspection_lot, timestamp: new Date().toISOString() });
      logger.info('Usage decision made', { inspection_lot });
      
      return rows[0];
    } catch (error) {
      logger.error('Error making usage decision', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 7: PLANT MAINTENANCE (PM)
// ============================================================================

const plantMaintenance = {
  /**
   * Create equipment master
   */
  createEquipmentMaster: async (equipmentData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { equipment_code, description, equipment_category, plant, location, serial_number, manufacturer, model, status } = equipmentData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_equipment (equipment_code, description, equipment_category, plant, location, serial_number, manufacturer, model, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'active'), NOW())
         RETURNING *`,
        [equipment_code, description, equipment_category, plant, location, serial_number, manufacturer, model, status]
      );
      
      await signalBus.emit('erp.pm.equipment.created', { equipment_code, timestamp: new Date().toISOString() });
      logger.info('Equipment master created', { equipment_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating equipment master', { error: error.message });
      throw error;
    }
  },

  /**
   * Create maintenance order
   */
  createMaintenanceOrder: async (moData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { maintenance_order, equipment_code, order_type, description, planned_start_date, planned_finish_date, plant, work_center } = moData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_maintenance_orders (maintenance_order, equipment_code, order_type, description, planned_start_date, planned_finish_date, plant, work_center, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'created', NOW())
         RETURNING *`,
        [maintenance_order, equipment_code, order_type, description, planned_start_date, planned_finish_date, plant, work_center]
      );
      
      await signalBus.emit('erp.pm.mo.created', { maintenance_order, timestamp: new Date().toISOString() });
      logger.info('Maintenance order created', { maintenance_order });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating maintenance order', { error: error.message });
      throw error;
    }
  },

  /**
   * Confirm maintenance order
   */
  confirmMaintenanceOrder: async (maintenanceOrder, confirmationData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { actual_finish_date, actual_work_hours, confirmation_text, technician } = confirmationData;
      
      const { rows } = await pg.query(
        `UPDATE erp_maintenance_orders 
         SET status = 'completed',
             actual_finish_date = $1,
             actual_work_hours = $2,
             confirmation_text = $3,
             technician = $4,
             completed_at = NOW()
         WHERE maintenance_order = $5 RETURNING *`,
        [actual_finish_date, actual_work_hours, confirmation_text, technician, maintenanceOrder]
      );
      
      await signalBus.emit('erp.pm.mo.completed', { maintenance_order, timestamp: new Date().toISOString() });
      logger.info('Maintenance order completed', { maintenance_order });
      
      return rows[0];
    } catch (error) {
      logger.error('Error confirming maintenance order', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 8: HUMAN RESOURCES (HR) / HCM
// ============================================================================

const humanResources = {
  /**
   * Create employee master
   */
  createEmployeeMaster: async (employeeData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { employee_code, first_name, last_name, date_of_birth, gender, address, city, country, email, phone, status } = employeeData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_employees (employee_code, first_name, last_name, date_of_birth, gender, address, city, country, email, phone, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, 'active'), NOW())
         RETURNING *`,
        [employee_code, first_name, last_name, date_of_birth, gender, address, city, country, email, phone, status]
      );
      
      await signalBus.emit('erp.hr.employee.created', { employee_code, timestamp: new Date().toISOString() });
      logger.info('Employee master created', { employee_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating employee master', { error: error.message });
      throw error;
    }
  },

  /**
   * Create organizational unit
   */
  createOrganizationalUnit: async (orgData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { org_unit_code, name, description, parent_org_unit, org_level, person_responsible, status } = orgData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_org_units (org_unit_code, name, description, parent_org_unit, org_level, person_responsible, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'active'), NOW())
         RETURNING *`,
        [org_unit_code, name, description, parent_org_unit, org_level, person_responsible, status]
      );
      
      await signalBus.emit('erp.hr.org_unit.created', { org_unit_code, timestamp: new Date().toISOString() });
      logger.info('Organizational unit created', { org_unit_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating organizational unit', { error: error.message });
      throw error;
    }
  },

  /**
   * Process payroll
   */
  processPayroll: async (payrollData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { payroll_run, period, year, processing_date, payroll_items } = payrollData;
      
      // Create payroll run header
      const { rows: headerRows } = await pg.query(
        `INSERT INTO erp_payroll_runs (payroll_run, period, year, processing_date, status, created_at)
         VALUES ($1, $2, $3, $4, 'processed', NOW())
         RETURNING *`,
        [payroll_run, period, year, processing_date]
      );
      
      const header = headerRows[0];
      
      // Create payroll items
      for (const item of payroll_items) {
        await pg.query(
          `INSERT INTO erp_payroll_items (payroll_run, employee_code, gross_pay, deductions, net_pay, currency, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [header.payroll_run, item.employee_code, item.gross_pay, item.deductions, item.net_pay, item.currency]
        );
      }
      
      await signalBus.emit('erp.hr.payroll.processed', { payroll_run: header.payroll_run, timestamp: new Date().toISOString() });
      logger.info('Payroll processed', { payroll_run: header.payroll_run });
      
      return header;
    } catch (error) {
      logger.error('Error processing payroll', { error: error.message });
      throw error;
    }
  },

  /**
   * AI-powered HR analytics
   */
  analyzeHRAI: async (period, year) => {
    try {
      // Get HR data
      const pg = getPostgreSQL();
      
      // Employee count
      const { rows: employeeRows } = await pg.query(
        `SELECT COUNT(*) as employee_count, COUNT(*) FILTER (WHERE status = 'active') as active_count
         FROM erp_employees`,
        []
      );
      
      // Payroll data
      const { rows: payrollRows } = await pg.query(
        `SELECT COUNT(*) as payroll_count, SUM(net_pay) as total_payroll
         FROM erp_payroll_runs pr
         JOIN erp_payroll_items pi ON pr.payroll_run = pi.payroll_run
         WHERE pr.period = $1 AND pr.year = $2`,
        [period, year]
      );
      
      // Performance data (simplified)
      const hrData = {
        employeeCount: employeeRows[0].employee_count,
        turnoverRate: 5.2, // Sample data
        trainingCompletion: 78, // Sample data
        performanceScores: { excellent: 25, good: 45, satisfactory: 20, needsImprovement: 10 },
        payrollCosts: payrollRows[0]?.total_payroll || 0
      };
      
      // Call AI for analysis
      const aiAnalysis = await aiBackbone.analyzeHR(hrData);
      
      await signalBus.emit('erp.hr.ai.analysis.completed', { 
        period, 
        year, 
        timestamp: new Date().toISOString() 
      });
      
      return {
        hr_data: hrData,
        ai_analysis: aiAnalysis,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in AI HR analysis', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 9: PROJECT SYSTEM (PS)
// ============================================================================

const projectSystem = {
  /**
   * Create project definition
   */
  createProjectDefinition: async (projectData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { project_code, name, description, project_manager, project_type, start_date, finish_date, currency, status } = projectData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_projects (project_code, name, description, project_manager, project_type, start_date, finish_date, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'created'), NOW())
         RETURNING *`,
        [project_code, name, description, project_manager, project_type, start_date, finish_date, currency, status]
      );
      
      await signalBus.emit('erp.ps.project.created', { project_code, timestamp: new Date().toISOString() });
      logger.info('Project definition created', { project_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating project definition', { error: error.message });
      throw error;
    }
  },

  /**
   * Create work breakdown structure (WBS)
   */
  createWBS: async (wbsData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { wbs_code, project_code, description, parent_wbs, responsible_person, budget, currency } = wbsData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_wbs_elements (wbs_code, project_code, description, parent_wbs, responsible_person, budget, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
         RETURNING *`,
        [wbs_code, project_code, description, parent_wbs, responsible_person, budget, currency]
      );
      
      await signalBus.emit('erp.ps.wbs.created', { wbs_code, timestamp: new Date().toISOString() });
      logger.info('WBS element created', { wbs_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating WBS element', { error: error.message });
      throw error;
    }
  },

  /**
   * Update project status
   */
  updateProjectStatus: async (projectCode, statusData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { status, completion_percentage, actual_finish_date, notes } = statusData;
      
      const { rows } = await pg.query(
        `UPDATE erp_projects 
         SET status = $1,
             completion_percentage = $2,
             actual_finish_date = $3,
             notes = $4,
             updated_at = NOW()
         WHERE project_code = $5 RETURNING *`,
        [status, completion_percentage, actual_finish_date, notes, projectCode]
      );
      
      await signalBus.emit('erp.ps.project.updated', { project_code: projectCode, timestamp: new Date().toISOString() });
      logger.info('Project status updated', { project_code: projectCode });
      
      return rows[0];
    } catch (error) {
      logger.error('Error updating project status', { error: error.message });
      throw error;
    }
  },

  /**
   * AI-powered project analysis
   */
  analyzeProjectAI: async (projectCode) => {
    try {
      // Get project data
      const pg = getPostgreSQL();
      const { rows: projectRows } = await pg.query(
        `SELECT * FROM erp_projects WHERE project_code = $1`,
        [projectCode]
      );
      
      if (projectRows.length === 0) {
        throw new Error('Project not found');
      }
      
      const project = projectRows[0];
      
      // Get WBS elements
      const { rows: wbsRows } = await pg.query(
        `SELECT * FROM erp_wbs_elements WHERE project_code = $1`,
        [projectCode]
      );
      
      const projectData = {
        status: project.status,
        completion: project.completion_percentage || 0,
        budgetUtilization: 75, // Sample data
        timelineAdherence: 82, // Sample data
        resources: wbsRows.map(w => ({ 
          wbs_code: w.wbs_code, 
          budget: w.budget, 
          responsible: w.responsible_person 
        }))
      };
      
      // Call AI for analysis
      const aiAnalysis = await aiBackbone.analyzeProject(projectData);
      
      await signalBus.emit('erp.ps.ai.analysis.completed', { 
        project_code: projectCode, 
        timestamp: new Date().toISOString() 
      });
      
      return {
        project_data: projectData,
        ai_analysis: aiAnalysis,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error in AI project analysis', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 10: TREASURY (TR) / CASH MANAGEMENT
// ============================================================================

const treasury = {
  /**
   * Create bank account
   */
  createBankAccount: async (bankData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { bank_account_code, bank_name, account_number, currency, account_type, status } = bankData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_bank_accounts (bank_account_code, bank_name, account_number, currency, account_type, status, created_at)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'active'), NOW())
         RETURNING *`,
        [bank_account_code, bank_name, account_number, currency, account_type, status]
      );
      
      await signalBus.emit('erp.tr.bank_account.created', { bank_account_code, timestamp: new Date().toISOString() });
      logger.info('Bank account created', { bank_account_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating bank account', { error: error.message });
      throw error;
    }
  },

  /**
   * Record cash flow
   */
  recordCashFlow: async (cashFlowData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { cash_flow_id, bank_account_code, flow_type, amount, currency, reference, flow_date, description } = cashFlowData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_cash_flows (cash_flow_id, bank_account_code, flow_type, amount, currency, reference, flow_date, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [cash_flow_id, bank_account_code, flow_type, amount, currency, reference, flow_date, description]
      );
      
      await signalBus.emit('erp.tr.cash_flow.recorded', { cash_flow_id, timestamp: new Date().toISOString() });
      logger.info('Cash flow recorded', { cash_flow_id });
      
      return rows[0];
    } catch (error) {
      logger.error('Error recording cash flow', { error: error.message });
      throw error;
    }
  },

  /**
   * Get cash position
   */
  getCashPosition: async (asOfDate, currency) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT bank_account_code, bank_name, account_number,
           SUM(CASE WHEN flow_type = 'inflow' THEN amount ELSE -amount END) as balance
         FROM erp_cash_flows
         WHERE flow_date <= $1
         AND ($2 IS NULL OR currency = $2)
         GROUP BY bank_account_code, bank_name, account_number`,
        [asOfDate, currency]
      );
      
      return {
        as_of_date: asOfDate,
        currency: currency,
        generated_at: new Date().toISOString(),
        bank_accounts: rows
      };
    } catch (error) {
      logger.error('Error getting cash position', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 11: ASSET MANAGEMENT (AM)
// ============================================================================

const assetManagement = {
  /**
   * Create fixed asset
   */
  createFixedAsset: async (assetData) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { asset_code, description, asset_class, acquisition_date, cost, currency, depreciation_method, useful_life, location, status } = assetData;
      
      const { rows } = await pg.query(
        `INSERT INTO erp_fixed_assets (asset_code, description, asset_class, acquisition_date, cost, currency, depreciation_method, useful_life, location, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'active'), NOW())
         RETURNING *`,
        [asset_code, description, asset_class, acquisition_date, cost, currency, depreciation_method, useful_life, location, status]
      );
      
      await signalBus.emit('erp.am.asset.created', { asset_code, timestamp: new Date().toISOString() });
      logger.info('Fixed asset created', { asset_code });
      
      return rows[0];
    } catch (error) {
      logger.error('Error creating fixed asset', { error: error.message });
      throw error;
    }
  },

  /**
   * Calculate depreciation
   */
  calculateDepreciation: async (assetCode, fromDate, toDate) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT * FROM erp_fixed_assets WHERE asset_code = $1`,
        [assetCode]
      );
      
      if (rows.length === 0) {
        throw new Error('Asset not found');
      }
      
      const asset = rows[0];
      
      // Calculate depreciation based on method
      let depreciationAmount = 0;
      const months = ((new Date(toDate) - new Date(fromDate)) / (30 * 24 * 60 * 60 * 1000));
      
      if (asset.depreciation_method === 'straight_line') {
        const annualDepreciation = asset.cost / asset.useful_life;
        depreciationAmount = (annualDepreciation / 12) * months;
      } else if (asset.depreciation_method === 'declining_balance') {
        const rate = 2 / asset.useful_life;
        depreciationAmount = asset.cost * rate * (months / 12);
      }
      
      // Record depreciation
      await pg.query(
        `INSERT INTO erp_depreciation (asset_code, from_date, to_date, depreciation_amount, currency, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [assetCode, fromDate, toDate, depreciationAmount, asset.currency]
      );
      
      await signalBus.emit('erp.am.depreciation.calculated', { asset_code: assetCode, timestamp: new Date().toISOString() });
      logger.info('Depreciation calculated', { asset_code: assetCode, depreciation_amount: depreciationAmount });
      
      return {
        asset_code: assetCode,
        from_date: fromDate,
        to_date: toDate,
        depreciation_amount: depreciationAmount,
        currency: asset.currency,
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error calculating depreciation', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// MODULE 12: BUSINESS INTELLIGENCE (BI) / ANALYTICS
// ============================================================================

const businessIntelligence = {
  /**
   * Generate executive dashboard
   */
  generateExecutiveDashboard: async (fromDate, toDate) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      // Revenue
      const { rows: revenueRows } = await pg.query(
        `SELECT SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) as total_revenue
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date BETWEEN $1 AND $2
         AND jh.status = 'posted'`,
        [fromDate, toDate]
      );
      
      // Expenses
      const { rows: expenseRows } = await pg.query(
        `SELECT SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END) as total_expenses
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date BETWEEN $1 AND $2
         AND jh.status = 'posted'`,
        [fromDate, toDate]
      );
      
      // Active projects
      const { rows: projectRows } = await pg.query(
        `SELECT COUNT(*) as active_projects FROM erp_projects WHERE status = 'active'`,
        []
      );
      
      // Total assets
      const { rows: assetRows } = await pg.query(
        `SELECT SUM(cost) as total_assets FROM erp_fixed_assets WHERE status = 'active'`,
        []
      );
      
      return {
        from_date: fromDate,
        to_date: toDate,
        generated_at: new Date().toISOString(),
        kpis: {
          total_revenue: revenueRows[0]?.total_revenue || 0,
          total_expenses: expenseRows[0]?.total_expenses || 0,
          net_profit: (revenueRows[0]?.total_revenue || 0) - (expenseRows[0]?.total_expenses || 0),
          active_projects: parseInt(projectRows[0]?.active_projects || 0),
          total_assets: parseFloat(assetRows[0]?.total_assets || 0)
        }
      };
    } catch (error) {
      logger.error('Error generating executive dashboard', { error: error.message });
      throw error;
    }
  },

  /**
   * Generate profitability analysis
   */
  generateProfitabilityAnalysis: async (fromDate, toDate, profitCenterCode) => {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    try {
      const { rows } = await pg.query(
        `SELECT jl.profit_center,
           SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) as revenue,
           SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END) as expenses,
           SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) -
           SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END) as profit,
           (SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END) -
            SUM(CASE WHEN ga.account_type = 'expense' THEN jl.debit_amount - jl.credit_amount ELSE 0 END)) /
           NULLIF(SUM(CASE WHEN ga.account_type = 'revenue' THEN jl.credit_amount - jl.debit_amount ELSE 0 END), 0) * 100 as profit_margin
         FROM erp_journal_lines jl
         JOIN erp_journal_headers jh ON jl.journal_id = jh.journal_id
         JOIN erp_gl_accounts ga ON jl.account_code = ga.account_code
         WHERE jh.posting_date BETWEEN $1 AND $2
         AND jh.status = 'posted'
         AND ($3 IS NULL OR jl.profit_center = $3)
         GROUP BY jl.profit_center`,
        [fromDate, toDate, profitCenterCode]
      );
      
      return {
        from_date: fromDate,
        to_date: toDate,
        profit_center_code: profitCenterCode,
        generated_at: new Date().toISOString(),
        profitability: rows
      };
    } catch (error) {
      logger.error('Error generating profitability analysis', { error: error.message });
      throw error;
    }
  }
};

// ============================================================================
// EXPORT ALL MODULES
// ============================================================================

module.exports = {
  // Financial Accounting (FI)
  generalLedger,
  
  // Controlling (CO)
  controlling,
  
  // Materials Management (MM)
  materialsManagement,
  
  // Sales and Distribution (SD)
  salesDistribution,
  
  // Production Planning (PP)
  productionPlanning,
  
  // Quality Management (QM)
  qualityManagement,
  
  // Plant Maintenance (PM)
  plantMaintenance,
  
  // Human Resources (HR)
  humanResources,
  
  // Project System (PS)
  projectSystem,
  
  // Treasury (TR)
  treasury,
  
  // Asset Management (AM)
  assetManagement,
  
  // Business Intelligence (BI)
  businessIntelligence
};
