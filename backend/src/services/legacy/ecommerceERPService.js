/**
 * AFRERA E-Commerce ERP Integration Service
 * 
 * Deep integration with ERP modules:
 * - Financial ERP (General Ledger, Accounting, Invoicing, GST)
 * - Supply Chain ERP (Inventory, Warehouse, Logistics, Procurement)
 * - Production ERP (Manufacturing, Quality, Maintenance)
 * - Human Resources ERP (Payroll, Time, Performance)
 * - Customer ERP (CRM, Sales, Marketing, Support)
 * 
 * This service enables:
 * - Automatic financial posting for marketplace transactions
 * - Inventory synchronization across ERP and marketplace
 * - Order processing through ERP workflow
 * - Invoice generation and GST compliance
 * - Supply chain tracking for marketplace products
 * - Production planning based on marketplace demand
 * - HR integration for seller management
 * - CRM integration for customer relationship management
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');
const { signalBus } = require('..\/core\/signalBus');

// ============================================================================
// FINANCIAL ERP INTEGRATION
// ============================================================================

/**
 * Post marketplace transaction to general ledger
 */
async function postToGeneralLedger(transactionData) {
  const pg = getPostgreSQL();
  
  try {
    const {
      transaction_type,
      amount,
      currency,
      account_code,
      description,
      reference_id,
      reference_type,
      user_id
    } = transactionData;
    
    // Generate journal entry
    const journalEntryId = `JE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Debit and credit entries
    const debitEntry = {
      journal_entry_id: journalEntryId,
      account_code: account_code,
      entry_type: 'DEBIT',
      amount: amount,
      currency: currency,
      description: description,
      reference_id: reference_id,
      reference_type: reference_type,
      posted_by: user_id,
      posted_at: new Date().toISOString()
    };
    
    const creditEntry = {
      journal_entry_id: journalEntryId,
      account_code: getCreditAccount(transaction_type),
      entry_type: 'CREDIT',
      amount: amount,
      currency: currency,
      description: description,
      reference_id: reference_id,
      reference_type: reference_type,
      posted_by: user_id,
      posted_at: new Date().toISOString()
    };
    
    // Insert journal entries
    await pg.query(`
      INSERT INTO journal_entries 
      (journal_entry_id, account_code, entry_type, amount, currency, description, reference_id, reference_type, posted_by, posted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [debitEntry.journal_entry_id, debitEntry.account_code, debitEntry.entry_type, debitEntry.amount, 
        debitEntry.currency, debitEntry.description, debitEntry.reference_id, debitEntry.reference_type, 
        debitEntry.posted_by, debitEntry.posted_at]);
    
    await pg.query(`
      INSERT INTO journal_entries 
      (journal_entry_id, account_code, entry_type, amount, currency, description, reference_id, reference_type, posted_by, posted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [creditEntry.journal_entry_id, creditEntry.account_code, creditEntry.entry_type, creditEntry.amount, 
        creditEntry.currency, creditEntry.description, creditEntry.reference_id, creditEntry.reference_type, 
        creditEntry.posted_by, creditEntry.posted_at]);
    
    // Emit signal bus event
    await signalBus.emit('erp.gl.posted', {
      journal_entry_id: journalEntryId,
      transaction_type,
      amount,
      reference_id,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Posted to general ledger', { journalEntryId, transaction_type, amount });
    
    return {
      success: true,
      journal_entry_id: journalEntryId,
      debit_entry: debitEntry,
      credit_entry: creditEntry
    };
  } catch (error) {
    logger.error('Error posting to general ledger', { error: error.message });
    throw error;
  }
}

/**
 * Get credit account based on transaction type
 */
function getCreditAccount(transactionType) {
  const creditAccounts = {
    'sale': '4000-REVENUE',
    'purchase': '1000-CASH',
    'refund': '4000-REVENUE',
    'discount': '4200-SALES_DISCOUNTS',
    'commission': '5000-COMMISSIONS'
  };
  
  return creditAccounts[transactionType] || '1000-CASH';
}

/**
 * Generate GST invoice for marketplace order
 */
async function generateGSTInvoice(orderId) {
  let pg = getPostgreSQL();
  
  try {
    // Get order details
    const order = await pg.query(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.gst_number as customer_gst,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.pincode,
        a.country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.billing_address_id = a.id
      WHERE o.id = $1
    `, [orderId]);
    
    if (order.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const orderData = order.rows[0];
    
    // Get order items
    const items = await pg.query(`
      SELECT 
        oi.*,
        pl.product_name,
        pl.gi_tagged,
        pl.organic,
        pl.unit,
        pl.hsn_code
      FROM order_items oi
      JOIN product_listings pl ON oi.product_id = pl.id
      WHERE oi.order_id = $1
    `, [orderId]);
    
    // Calculate GST for each item
    const itemsWithGST = items.rows.map(item => {
      const hsnCode = item.hsn_code || 'DEFAULT';
      const gstRate = getGSTRate(hsnCode);
      const taxableValue = item.quantity * item.unit_price;
      const gstAmount = taxableValue * (gstRate / 100);
      const totalValue = taxableValue + gstAmount;
      
      return {
        ...item,
        hsn_code: hsnCode,
        gst_rate: gstRate,
        taxable_value: Math.round(taxableValue * 100) / 100,
        gst_amount: Math.round(gstAmount * 100) / 100,
        total_value: Math.round(totalValue * 100) / 100
      };
    });
    
    // Calculate totals
    const totalTaxableValue = itemsWithGST.reduce((sum, item) => sum + item.taxable_value, 0);
    const totalGST = itemsWithGST.reduce((sum, item) => sum + item.gst_amount, 0);
    const totalInvoiceValue = totalTaxableValue + totalGST;
    
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Create invoice record
    const invoiceData = {
      invoice_number: invoiceNumber,
      order_id: orderId,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer_name: orderData.customer_name,
      customer_gst: orderData.customer_gst,
      billing_address: {
        address_line1: orderData.address_line1,
        address_line2: orderData.address_line2,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        country: orderData.country
      },
      items: itemsWithGST,
      totals: {
        taxable_value: Math.round(totalTaxableValue * 100) / 100,
        gst_amount: Math.round(totalGST * 100) / 100,
        total_value: Math.round(totalInvoiceValue * 100) / 100
      },
      invoice_status: 'generated',
      generated_at: new Date().toISOString()
    };
    
    // Store invoice
    await pg.query(`
      INSERT INTO gst_invoices 
      (invoice_number, order_id, invoice_data, invoice_status, generated_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [invoiceNumber, orderId, JSON.stringify(invoiceData), 'generated']);
    
    // Post to general ledger
    await postToGeneralLedger({
      transaction_type: 'sale',
      amount: totalTaxableValue,
      currency: 'INR',
      account_code: '1000-CASH',
      description: `Marketplace sale - Order ${orderId}`,
      reference_id: orderId,
      reference_type: 'order',
      user_id: orderData.user_id
    });
    
    // Emit signal bus event
    await signalBus.emit('erp.gst_invoice.generated', {
      invoice_number: invoiceNumber,
      order_id: orderId,
      total_value: totalInvoiceValue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('GST invoice generated', { invoiceNumber, orderId });
    
    return {
      success: true,
      invoice: invoiceData
    };
  } catch (error) {
    logger.error('Error generating GST invoice', { error: error.message, orderId });
    throw error;
  }
}

/**
 * Get GST rate based on HSN code
 */
function getGSTRate(hsnCode) {
  // Simplified GST rates (should be from comprehensive database)
  const gstRates = {
    'DEFAULT': 18,
    'AGRICULTURE': 0,
    'PROCESSED_FOOD': 5,
    'FOOD_GRAINS': 5,
    'SPICES': 12,
    'TEA': 12,
    'HONEY': 18
  };
  
  return gstRates[hsnCode] || 18;
}

// ============================================================================
// SUPPLY CHAIN ERP INTEGRATION
// ============================================================================

/**
 * Sync marketplace inventory with ERP warehouse
 */
async function syncInventoryWithERP(productId) {
  let pg = getPostgreSQL();
  
  try {
    // Get marketplace inventory
    const marketplaceInventory = await pg.query(`
      SELECT id, product_name, quantity, unit, location_id
      FROM product_listings
      WHERE id = $1
    `, [productId]);
    
    if (marketplaceInventory.rows.length === 0) {
      throw new Error('Product not found in marketplace');
    }
    
    const product = marketplaceInventory.rows[0];
    
    // Get ERP warehouse inventory
    const erpInventory = await pg.query(`
      SELECT quantity, warehouse_id, bin_location
      FROM warehouse_inventory
      WHERE product_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [productId]);
    
    const syncResult = {
      product_id: productId,
      marketplace_quantity: parseFloat(product.quantity),
      erp_quantity: erpInventory.rows.length > 0 ? parseFloat(erpInventory.rows[0].quantity) : 0,
      sync_status: 'matched',
      discrepancy: 0,
      adjustment_required: false
    };
    
    // Check for discrepancy
    if (erpInventory.rows.length > 0) {
      const discrepancy = syncResult.marketplace_quantity - syncResult.erp_quantity;
      syncResult.discrepancy = discrepancy;
      
      if (Math.abs(discrepancy) > 5) {
        syncResult.sync_status = 'discrepancy_detected';
        syncResult.adjustment_required = true;
        
        // Create inventory adjustment record
        await pg.query(`
          INSERT INTO inventory_adjustments 
          (product_id, marketplace_quantity, erp_quantity, discrepancy, adjustment_type, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [productId, syncResult.marketplace_quantity, syncResult.erp_quantity, discrepancy, 
            discrepancy > 0 ? 'ERP_TO_MARKETPLACE' : 'MARKETPLACE_TO_ERP']);
      }
    } else {
      // No ERP inventory record, create one
      await pg.query(`
        INSERT INTO warehouse_inventory 
        (product_id, quantity, warehouse_id, bin_location, created_at)
        VALUES ($1, $2, 'WH-DEFAULT', 'BIN-DEFAULT', NOW())
      `, [productId, syncResult.marketplace_quantity]);
      
      syncResult.sync_status = 'erp_record_created';
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.inventory.synced', {
      product_id: productId,
      sync_status: syncResult.sync_status,
      discrepancy: syncResult.discrepancy,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Inventory synced with ERP', { productId, syncResult });
    
    return {
      success: true,
      sync_result: syncResult
    };
  } catch (error) {
    logger.error('Error syncing inventory with ERP', { error: error.message, productId });
    throw error;
  }
}

/**
 * Create purchase order for marketplace listing
 */
async function createPurchaseOrder(listingId, quantity) {
  let pg = getPostgreSQL();
  
  try {
    // Get listing details
    const listing = await pg.query(`
      SELECT 
        pl.*,
        u.full_name as seller_name,
        u.id as seller_id
      FROM product_listings pl
      JOIN users u ON pl.seller_id = u.id
      WHERE pl.id = $1
    `, [listingId]);
    
    if (listing.rows.length === 0) {
      throw new Error('Listing not found');
    }
    
    let product = listing.rows[0];
    
    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Create purchase order
    const purchaseOrder = {
      po_number: poNumber,
      product_id: listingId,
      product_name: product.product_name,
      seller_id: product.seller_id,
      seller_name: product.seller_name,
      requested_quantity: quantity,
      unit: product.unit,
      unit_price: product.base_price,
      total_value: quantity * product.base_price,
      delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      po_status: 'created',
      created_at: new Date().toISOString()
    };
    
    // Store purchase order
    await pg.query(`
      INSERT INTO purchase_orders 
      (po_number, product_id, seller_id, requested_quantity, unit, unit_price, total_value, delivery_date, po_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    `, [poNumber, listingId, product.seller_id, quantity, product.unit, product.base_price, 
        quantity * product.base_price, purchaseOrder.delivery_date, 'created']);
    
    // Emit signal bus event
    await signalBus.emit('erp.purchase_order.created', {
      po_number: poNumber,
      product_id: listingId,
      seller_id: product.seller_id,
      total_value: purchaseOrder.total_value,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Purchase order created', { poNumber, listingId });
    
    return {
      success: true,
      purchase_order: purchaseOrder
    };
  } catch (error) {
    logger.error('Error creating purchase order', { error: error.message, listingId });
    throw error;
  }
}

// ============================================================================
// CUSTOMER ERP (CRM) INTEGRATION
// ============================================================================

/**
 * Sync marketplace customer with CRM
 */
async function syncCustomerWithCRM(userId) {
  let pg = getPostgreSQL();
  
  try {
    // Get user details
    const user = await pg.query(`
      SELECT id, full_name, email, phone, created_at
      FROM users
      WHERE id = $1
    `, [userId]);
    
    if (user.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userData = user.rows[0];
    
    // Get customer's marketplace activity
    const activity = await pg.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.unit_price) as total_spent,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT o.product_id) as unique_products_purchased
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
        AND o.status = 'completed'
      GROUP BY o.user_id
    `, [userId]);
    
    const customerData = {
      user_id: userId,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      customer_since: userData.created_at,
      marketplace_activity: activity.rows[0] || {
        total_orders: 0,
        total_spent: 0,
        last_order_date: null,
        unique_products_purchased: 0
      },
      customer_tier: calculateCustomerTier(activity.rows[0]),
      synced_at: new Date().toISOString()
    };
    
    // Sync to CRM
    await pg.query(`
      INSERT INTO crm_customers 
      (user_id, customer_data, synced_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET customer_data = $2, synced_at = NOW()
    `, [userId, JSON.stringify(customerData)]);
    
    // Emit signal bus event
    await signalBus.emit('erp.crm.customer_synced', {
      user_id: userId,
      customer_tier: customerData.customer_tier,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Customer synced with CRM', { userId, customer_tier: customerData.customer_tier });
    
    return {
      success: true,
      customer_data: customerData
    };
  } catch (error) {
    logger.error('Error syncing customer with CRM', { error: error.message, userId });
    throw error;
  }
}

/**
 * Calculate customer tier based on activity
 */
function calculateCustomerTier(activity) {
  if (!activity) return 'bronze';
  
  const totalSpent = parseFloat(activity.total_spent) || 0;
  const totalOrders = activity.total_orders || 0;
  
  if (totalSpent > 50000 && totalOrders > 20) return 'platinum';
  if (totalSpent > 20000 && totalOrders > 10) return 'gold';
  if (totalSpent > 5000 && totalOrders > 5) return 'silver';
  return 'bronze';
}

// ============================================================================
// PRODUCTION ERP INTEGRATION
// ============================================================================

/**
 * Create production order based on marketplace demand
 */
async function createProductionOrder(productId, demandQuantity) {
  let pg = getPostgreSQL();
  
  try {
    // Get product details
    let product = await pg.query(`
      SELECT id, product_name, category_id, seller_id
      FROM product_listings
      WHERE id = $1
    `, [productId]);
    
    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    // Generate production order number
    let poNumber = `PRD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
    // Calculate production requirements
    const productionOrder = {
      production_order_number: poNumber,
      product_id: productId,
      product_name: product.rows[0].product_name,
      category_id: product.rows[0].category_id,
      seller_id: product.rows[0].seller_id,
      requested_quantity: demandQuantity,
      production_quantity: Math.round(demandQuantity * 1.1), // 10% buffer
      start_date: new Date().toISOString().split('T')[0],
      target_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order_status: 'planned',
      created_at: new Date().toISOString()
    };
    
    // Store production order
    await pg.query(`
      INSERT INTO production_orders 
      (production_order_number, product_id, seller_id, requested_quantity, production_quantity, start_date, target_completion_date, order_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [poNumber, productId, product.rows[0].seller_id, demandQuantity, productionOrder.production_quantity, 
        productionOrder.start_date, productionOrder.target_completion_date, 'planned']);
    
    // Emit signal bus event
    await signalBus.emit('erp.production_order.created', {
      production_order_number: poNumber,
      product_id: productId,
      seller_id: product.rows[0].seller_id,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Production order created', { poNumber, productId });
    
    return {
      success: true,
      production_order: productionOrder
    };
  } catch (error) {
    logger.error('Error creating production order', { error: error.message, productId });
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Financial ERP
  postToGeneralLedger,
  generateGSTInvoice,
  
  // Supply Chain ERP
  syncInventoryWithERP,
  createPurchaseOrder,
  
  // Customer ERP (CRM)
  syncCustomerWithCRM,
  
  // Production ERP
  createProductionOrder
};


