/**
 * ERP Integration Service
 * Provides integration with SAP, Oracle, and custom ERP systems
 * Handles data synchronization, business process automation, and financial Reconciliation
 */

const express = require('express');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { authMiddleware } = require('../../middleware/auth');
const { AppError } = require('../../middleware/errorHandler');

const router = express.Router();

// ERP configuration
const ERP_CONFIG = {
  sap: {
    enabled: process.env.SAP_ENABLED === 'true',
    host: process.env.SAP_HOST || 'localhost',
    port: parseInt(process.env.SAP_PORT) || 8000,
    client: process.env.SAP_CLIENT || '800',
    username: process.env.SAP_USER,
    password: process.env.SAP_PASSWORD,
    systemId: process.env.SAP_SYSTEM_ID || 'A01'
  },
  oracle: {
    enabled: process.env.ORACLE_ENABLED === 'true',
    host: process.env.ORACLE_HOST || 'localhost',
    port: parseInt(process.env.ORACLE_PORT) || 1521,
    service: process.env.ORACLE_SERVICE || 'ORCL',
    username: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD
  },
  custom: {
    enabled: process.env.CUSTOM_ERP_ENABLED === 'true',
    apiUrl: process.env.CUSTOM_ERP_API_URL,
    apiKey: process.env.CUSTOM_ERP_API_KEY
  }
};

// Synchronization status tracking
const SYNC_STATUS = {
  lastSync: null,
  lastSyncStatus: 'idle',
  syncQueue: [],
  activeSyncs: new Map()
};

/**
 * Initialize ERP connections
 */
async function initializeERP() {
  try {
    if (ERP_CONFIG.sap.enabled) {
      await initializeSAP();
      logger.info('SAP ERP connection initialized');
    }
    if (ERP_CONFIG.oracle.enabled) {
      await initializeOracle();
      logger.info('Oracle ERP connection initialized');
    }
    if (ERP_CONFIG.custom.enabled) {
      await initializeCustomERP();
      logger.info('Custom ERP connection initialized');
    }
  } catch (error) {
    logger.error('ERP initialization failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Initialize SAP connection
 */
async function initializeSAP() {
  // In production, use SAP NW RFC SDK or SAP Cloud SDK
  logger.info('SAP connection configured for system', { systemId: ERP_CONFIG.sap.systemId });
  return { connected: true, system: ERP_CONFIG.sap.systemId };
}

/**
 * Initialize Oracle connection
 */
async function initializeOracle() {
  // In production, use oracledb or Oracle Cloud SDK
  logger.info('Oracle connection configured for service', { service: ERP_CONFIG.oracle.service });
  return { connected: true, service: ERP_CONFIG.oracle.service };
}

/**
 * Initialize Custom ERP connection
 */
async function initializeCustomERP() {
  // Test connection to custom ERP API
  if (ERP_CONFIG.custom.apiUrl) {
    const response = await fetch(`${ERP_CONFIG.custom.apiUrl}/health`, {
      headers: { 'Authorization': `Bearer ${ERP_CONFIG.custom.apiKey}` }
    });
    if (!response.ok) {
      throw new Error('Custom ERP health check failed');
    }
  }
  logger.info('Custom ERP connection configured');
  return { connected: true, apiUrl: ERP_CONFIG.custom.apiUrl };
}

/**
 * Sync product master data to ERP
 */
async function syncProductToERP(productId, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    // Get product data
    const productQuery = `
      SELECT p.*, c.name as category_name, s.name as state_name,
             u.name as unit_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN states s ON p.state_id = s.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.id = $1
    `;
    
    const productResult = await pg.query(productQuery, [productId]);
    const product = productResult.rows[0];
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Transform to ERP format
    const erpProduct = transformProductToERPFormat(product, erpType);
    
    // Send to ERP based on type
    let erpResponse;
    if (erpType === 'sap') {
      erpResponse = await syncToSAP('MATERIAL', erpProduct);
    } else if (erpType === 'oracle') {
      erpResponse = await syncToOracle('ITEM', erpProduct);
    } else {
      erpResponse = await syncToCustomERP('product', erpProduct);
    }
    
    // Log synchronization
    await logSyncOperation('product', productId, erpType, 'success', erpResponse);
    
    logger.info(`Product ${productId} synced to ${erpType} ERP: ${erpResponse.materialId || erpResponse.itemId}`);
    
    return {
      success: true,
      productId: productId,
      erpType: erpType,
      erpId: erpResponse.materialId || erpResponse.itemId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error syncing product ${productId} to ERP:`, error);
    await logSyncOperation('product', productId, erpType, 'failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync order to ERP for financial processing
 */
async function syncOrderToERP(orderId, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    // Get order data with items
    const orderQuery = `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             a.address_line1, a.city, a.state, a.pincode
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.shipping_address_id = a.id
      WHERE o.id = $1
    `;
    
    const orderResult = await pg.query(orderQuery, [orderId]);
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await pg.query(itemsQuery, [orderId]);
    const items = itemsResult.rows;
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Transform to ERP format
    const erpOrder = transformOrderToERPFormat(order, items, erpType);
    
    // Send to ERP based on type
    let erpResponse;
    if (erpType === 'sap') {
      erpResponse = await syncToSAP('SALES_ORDER', erpOrder);
    } else if (erpType === 'oracle') {
      erpResponse = await syncToOracle('ORDER', erpOrder);
    } else {
      erpResponse = await syncToCustomERP('order', erpOrder);
    }
    
    // Update order with ERP reference
    await pg.query(
      'UPDATE orders SET erp_reference = $1, erp_synced_at = NOW() WHERE id = $2',
      [erpResponse.orderId, orderId]
    );
    
    // Log synchronization
    await logSyncOperation('order', orderId, erpType, 'success', erpResponse);
    
    logger.info(`Order ${orderId} synced to ${erpType} ERP: ${erpResponse.orderId}`);
    
    return {
      success: true,
      orderId: orderId,
      erpType: erpType,
      erpOrderId: erpResponse.orderId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error syncing order ${orderId} to ERP:`, error);
    await logSyncOperation('order', orderId, erpType, 'failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync farmer data to ERP for financial services
 */
async function syncFarmerToERP(farmerId, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    // Get farmer data
    const farmerQuery = `
      SELECT f.*, u.name, u.email, u.phone,
             a.address_line1, a.city, a.state, a.pincode,
             fpo.name as fpo_name, fpo.registration_number as fpo_reg
      FROM farmers f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN addresses a ON u.address_id = a.id
      LEFT JOIN fpos fpo ON f.fpo_id = fpo.id
      WHERE f.id = $1
    `;
    
    const farmerResult = await pg.query(farmerQuery, [farmerId]);
    const farmer = farmerResult.rows[0];
    
    if (!farmer) {
      throw new Error('Farmer not found');
    }
    
    // Transform to ERP format (vendor/business partner)
    const erpFarmer = transformFarmerToERPFormat(farmer, erpType);
    
    // Send to ERP based on type
    let erpResponse;
    if (erpType === 'sap') {
      erpResponse = await syncToSAP('VENDOR', erpFarmer);
    } else if (erpType === 'oracle') {
      erpResponse = await syncToOracle('SUPPLIER', erpFarmer);
    } else {
      erpResponse = await syncToCustomERP('farmer', erpFarmer);
    }
    
    // Update farmer with ERP reference
    await pg.query(
      'UPDATE farmers SET erp_vendor_id = $1, erp_synced_at = NOW() WHERE id = $2',
      [erpResponse.vendorId, farmerId]
    );
    
    // Log synchronization
    await logSyncOperation('farmer', farmerId, erpType, 'success', erpResponse);
    
    logger.info(`Farmer ${farmerId} synced to ${erpType} ERP: ${erpResponse.vendorId}`);
    
    return {
      success: true,
      farmerId: farmerId,
      erpType: erpType,
      erpVendorId: erpResponse.vendorId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error syncing farmer ${farmerId} to ERP:`, error);
    await logSyncOperation('farmer', farmerId, erpType, 'failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync financial transaction to ERP
 */
async function syncFinancialTransaction(transactionId, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    // Get transaction data
    const transactionQuery = `
      SELECT ft.*, u.name as user_name,
             CASE 
               WHEN ft.type = 'payment' THEN 'receipt'
               WHEN ft.type = 'refund' THEN 'payment'
               ELSE ft.type
             END as erp_type
      FROM financial_transactions ft
      JOIN users u ON ft.user_id = u.id
      WHERE ft.id = $1
    `;
    
    const transactionResult = await pg.query(transactionQuery, [transactionId]);
    const transaction = transactionResult.rows[0];
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Transform to ERP format
    const erpTransaction = transformTransactionToERPFormat(transaction, erpType);
    
    // Send to ERP based on type
    let erpResponse;
    if (erpType === 'sap') {
      erpResponse = await syncToSAP('FINANCIAL_TRANSACTION', erpTransaction);
    } else if (erpType === 'oracle') {
      erpResponse = await syncToOracle('PAYMENT', erpTransaction);
    } else {
      erpResponse = await syncToCustomERP('transaction', erpTransaction);
    }
    
    // Update transaction with ERP reference
    await pg.query(
      'UPDATE financial_transactions SET erp_reference = $1, erp_synced_at = NOW() WHERE id = $2',
      [erpResponse.transactionId, transactionId]
    );
    
    // Log synchronization
    await logSyncOperation('transaction', transactionId, erpType, 'success', erpResponse);
    
    logger.info(`Transaction ${transactionId} synced to ${erpType} ERP: ${erpResponse.transactionId}`);
    
    return {
      success: true,
      transactionId: transactionId,
      erpType: erpType,
      erpTransactionId: erpResponse.transactionId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error syncing transaction ${transactionId} to ERP:`, error);
    await logSyncOperation('transaction', transactionId, erpType, 'failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync asset/equipment data to ERP
 */
async function syncAssetToERP(assetId, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    // Get asset data
    const assetQuery = `
      SELECT a.*, l.name as location_name,
             u.name as responsible_person
      FROM assets a
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN users u ON a.responsible_user_id = u.id
      WHERE a.id = $1
    `;
    
    const assetResult = await pg.query(assetQuery, [assetId]);
    const asset = assetResult.rows[0];
    
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    // Transform to ERP format (fixed asset)
    const erpAsset = transformAssetToERPFormat(asset, erpType);
    
    // Send to ERP based on type
    let erpResponse;
    if (erpType === 'sap') {
      erpResponse = await syncToSAP('ASSET', erpAsset);
    } else if (erpType === 'oracle') {
      erpResponse = await syncToOracle('FIXED_ASSET', erpAsset);
    } else {
      erpResponse = await syncToCustomERP('asset', erpAsset);
    }
    
    // Update asset with ERP reference
    await pg.query(
      'UPDATE assets SET erp_asset_id = $1, erp_synced_at = NOW() WHERE id = $2',
      [erpResponse.assetId, assetId]
    );
    
    // Log synchronization
    await logSyncOperation('asset', assetId, erpType, 'success', erpResponse);
    
    logger.info(`Asset ${assetId} synced to ${erpType} ERP: ${erpResponse.assetId}`);
    
    return {
      success: true,
      assetId: assetId,
      erpType: erpType,
      erpAssetId: erpResponse.assetId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Error syncing asset ${assetId} to ERP:`, error);
    await logSyncOperation('asset', assetId, erpType, 'failed', { error: error.message });
    throw error;
  }
}

/**
 * Get ERP synchronization status
 */
async function getSyncStatus() {
  const pg = getPostgreSQL();
  
  const statusQuery = `
    SELECT 
      entity_type,
      COUNT(*) as total,
      SUM(CASE WHEN erp_synced_at IS NOT NULL THEN 1 ELSE 0 END) as synced,
      MAX(erp_synced_at) as last_sync
    FROM (
      SELECT 'product' as entity_type, id, erp_synced_at FROM products
      UNION ALL
      SELECT 'order' as entity_type, id, erp_synced_at FROM orders
      UNION ALL
      SELECT 'farmer' as entity_type, id, erp_synced_at FROM farmers
      UNION ALL
      SELECT 'asset' as entity_type, id, erp_synced_at FROM assets
    ) combined
    GROUP BY entity_type
  `;
  
  const statusResult = await pg.query(statusQuery);
  
  return {
    overall: {
      lastSync: SYNC_STATUS.lastSync,
      status: SYNC_STATUS.lastSyncStatus,
      queueSize: SYNC_STATUS.syncQueue.length,
      activeSyncs: SYNC_STATUS.activeSyncs.size
    },
    byEntity: statusResult.rows.map(row => ({
      type: row.entity_type,
      total: parseInt(row.total),
      synced: parseInt(row.synced),
      pending: parseInt(row.total) - parseInt(row.synced),
      syncRate: row.total > 0 ? (row.synced / row.total * 100).toFixed(1) : 0,
      lastSync: row.last_sync
    })),
    erpConnections: {
      sap: { enabled: ERP_CONFIG.sap.enabled, connected: ERP_CONFIG.sap.enabled },
      oracle: { enabled: ERP_CONFIG.oracle.enabled, connected: ERP_CONFIG.oracle.enabled },
      custom: { enabled: ERP_CONFIG.custom.enabled, connected: ERP_CONFIG.custom.enabled }
    }
  };
}

/**
 * Trigger bulk synchronization
 */
async function triggerBulkSync(entityType, erpType = 'sap') {
  try {
    const pg = getPostgreSQL();
    
    let query;
    if (entityType === 'product') {
      query = 'SELECT id FROM products WHERE erp_synced_at IS NULL LIMIT 100';
    } else if (entityType === 'order') {
      query = 'SELECT id FROM orders WHERE erp_synced_at IS NULL AND status = $1 LIMIT 50';
    } else if (entityType === 'farmer') {
      query = 'SELECT id FROM farmers WHERE erp_synced_at IS NULL LIMIT 50';
    } else if (entityType === 'asset') {
      query = 'SELECT id FROM assets WHERE erp_synced_at IS NULL LIMIT 50';
    } else {
      throw new Error('Invalid entity type');
    }
    
    const params = entityType === 'order' ? ['completed'] : [];
    const result = await pg.query(query, params);
    
    const syncPromises = result.rows.map(row => {
      if (entityType === 'product') return syncProductToERP(row.id, erpType);
      if (entityType === 'order') return syncOrderToERP(row.id, erpType);
      if (entityType === 'farmer') return syncFarmerToERP(row.id, erpType);
      if (entityType === 'asset') return syncAssetToERP(row.id, erpType);
    });
    
    const results = await Promise.allSettled(syncPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Bulk sync completed for ${entityType}: ${successful} successful, ${failed} failed`);
    
    return {
      entityType,
      erpType,
      total: result.rows.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        id: result.rows[i].id,
        status: r.status,
        error: r.status === 'rejected' ? r.reason.message : null
      }))
    };
  } catch (error) {
    logger.error('Error in bulk sync', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Transform functions for ERP data mapping
 */
function transformProductToERPFormat(product, erpType) {
  if (erpType === 'sap') {
    return {
      materialType: 'HAWA', // Trading goods
      industrySector: 'A', // Agriculture
      materialGroup: mapCategoryToMaterialGroup(product.category_name),
      baseUnit: product.unit_name || 'KG',
      grossWeight: product.weight_per_unit || 1,
      netWeight: product.weight_per_unit || 1,
      description: product.name,
      taxClassification: mapStateToTaxCode(product.state_name),
      origin: product.state_name,
      giCertified: product.gi_status
    };
  } else if (erpType === 'oracle') {
    return {
      itemNumber: product.sku || `AFR-${product.id}`,
      description: product.name,
      itemType: 'STOCK',
      primaryUnit: product.unit_name || 'KG',
      category: product.category_name,
      taxCode: mapStateToTaxCode(product.state_name),
      origin: product.state_name
    };
  } else {
    return {
      external_id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category_name,
      unit: product.unit_name || 'KG',
      price: product.base_price,
      origin: product.state_name,
      gi_certified: product.gi_status
    };
  }
}

function transformOrderToERPFormat(order, items, erpType) {
  if (erpType === 'sap') {
    return {
      salesOrganization: '1000',
      distributionChannel: '10',
      division: '00',
      soldToParty: order.erp_customer_id || 'CUST001',
      shipToParty: order.erp_customer_id || 'CUST001',
      requestedDeliveryDate: order.expected_delivery_date,
      paymentTerms: 'Z001',
      currency: 'INR',
      items: items.map(item => ({
        material: item.sku || `AFR-${item.product_id}`,
        quantity: item.quantity,
        unit: 'KG',
        price: item.price
      }))
    };
  } else if (erpType === 'oracle') {
    return {
      orderNumber: order.order_number,
      customer: order.erp_customer_id || 'CUST001',
      orderType: 'SALES',
      currency: 'INR',
      paymentTerms: 'NET30',
      shipToAddress: {
        address1: order.address_line1,
        city: order.city,
        state: order.state,
        postalCode: order.pincode
      },
      lines: items.map(item => ({
        itemNumber: item.sku || `AFR-${item.product_id}`,
        quantity: item.quantity,
        unitOfMeasure: 'KG',
        unitPrice: item.price
      }))
    };
  } else {
    return {
      external_id: order.id,
      order_number: order.order_number,
      customer: {
        name: order.customer_name,
        email: order.customer_email
      },
      total_amount: order.total_amount,
      currency: 'INR',
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      }))
    };
  }
}

function transformFarmerToERPFormat(farmer, erpType) {
  if (erpType === 'sap') {
    return {
      accountGroup: 'KRED', // Vendor
      name: farmer.name,
      searchTerm: farmer.name.substring(0, 10),
      street: farmer.address_line1,
      city: farmer.city,
      region: farmer.state,
      postalCode: farmer.pincode,
      country: 'IN',
      language: 'EN',
      taxNumber: farmer.fpo_reg || farmer.gst_number,
      paymentTerms: 'Z001',
      currency: 'INR'
    };
  } else if (erpType === 'oracle') {
    return {
      supplierNumber: `VEND-${farmer.id}`,
      supplierName: farmer.name,
      supplierType: 'INDIVIDUAL',
      taxRegistration: farmer.gst_number,
      address: {
        addressLine1: farmer.address_line1,
        city: farmer.city,
        state: farmer.state,
        postalCode: farmer.pincode,
        country: 'IN'
      },
      paymentTerms: 'NET30',
      currency: 'INR'
    };
  } else {
    return {
      external_id: farmer.id,
      name: farmer.name,
      email: farmer?.email,
      phone: farmer?.phone,
      fpo_name: farmer.fpo_name,
      fpo_registration: farmer.fpo_reg,
      address: {
        street: farmer.address_line1,
        city: farmer.city,
        state: farmer.state,
        pincode: farmer.pincode
      }
    };
  }
}

function transformTransactionToERPFormat(transaction, erpType) {
  if (erpType === 'sap') {
    return {
      documentDate: transaction.created_at,
      postingDate: transaction.created_at,
      documentType: transaction.erp_type === 'receipt' ? 'DZ' : 'KZ',
      amount: transaction.amount,
      currency: 'INR',
      customerAccount: transaction.erp_customer_id || 'CUST001',
      paymentMethod: transaction.payment_method
    };
  } else if (erpType === 'oracle') {
    return {
      paymentNumber: `PAY-${transaction.id}`,
      paymentType: transaction.type,
      amount: transaction.amount,
      currency: 'INR',
      paymentDate: transaction.created_at,
      paymentMethod: transaction.payment_method,
      reference: transaction.reference_number
    };
  } else {
    return {
      external_id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      currency: 'INR',
      payment_method: transaction.payment_method,
      reference: transaction.reference_number,
      created_at: transaction.created_at
    };
  }
}

function transformAssetToERPFormat(asset, erpType) {
  if (erpType === 'sap') {
    return {
      assetClass: mapAssetTypeToClass(asset.type),
      description: asset.name,
      quantity: 1,
      baseUnit: 'EA',
      capitalizationDate: asset.purchase_date,
      location: asset.location_name,
      costCenter: asset.cost_center || '1000',
      usefulLife: asset.useful_life_years || 5
    };
  } else if (erpType === 'oracle') {
    return {
      assetNumber: `AST-${asset.id}`,
      assetCategory: mapAssetTypeToClass(asset.type),
      description: asset.name,
      location: asset.location_name,
      placedInServiceDate: asset.purchase_date,
      cost: asset.purchase_cost,
      currency: 'INR'
    };
  } else {
    return {
      external_id: asset.id,
      name: asset.name,
      type: asset.type,
      location: asset.location_name,
      purchase_date: asset.purchase_date,
      purchase_cost: asset.purchase_cost,
      useful_life_years: asset.useful_life_years
    };
  }
}

/**
 * Helper mapping functions
 */
function mapCategoryToMaterialGroup(category) {
  const mapping = {
    'Grains & Millets': '001',
    'Spices': '002',
    'Fruits': '003',
    'Vegetables & Greens': '004',
    'Tea & Beverages': '005',
    'Honey & Sweeteners': '006'
  };
  return mapping[category] || '999';
}

function mapStateToTaxCode(state) {
  const mapping = {
    'Assam': 'AS',
    'Nagaland': 'NL',
    'Manipur': 'MN',
    'Meghalaya': 'ML',
    'Arunachal Pradesh': 'AR',
    'Mizoram': 'MZ',
    'Tripura': 'TR',
    'Sikkim': 'SK'
  };
  return mapping[state] || 'OT';
}

function mapAssetTypeToClass(type) {
  const mapping = {
    'mobile_mill': 'MACH',
    'reefer_truck': 'VEH',
    'cold_storage': 'BUILD',
    'solar_dryer': 'MACH',
    'pack_house': 'BUILD'
  };
  return mapping[type] || 'GEN';
}

/**
 * ERP-specific sync functions
 *
 * No SAP or Oracle connector is installed in this project (verified against
 * package.json: no node-rfc / SAP Cloud SDK / oracledb dependency exists),
 * and initializeSAP()/initializeOracle() above never open a real connection
 * — they only log. These two functions used to return a fabricated
 * mockResponses[objectType] (e.g. `MAT-<timestamp>`) as if the sync had
 * actually succeeded, and callers (syncProductToERP, syncOrderToERP, etc.)
 * persisted that fake id into erp_reference / erp_synced_at columns,
 * making a never-attempted sync indistinguishable from a real one.
 *
 * Fail closed instead: until a real connector is wired up, every call
 * throws a typed, caught error so callers — and their `erp_sync_logs`
 * entries — see an honest 'failed' / ERP_INTEGRATION_NOT_CONFIGURED rather
 * than a fake success.
 */
async function syncToSAP(objectType, data) {
  logger.warn(`syncToSAP(${objectType}) called but no SAP connector (RFC SDK / SAP Cloud SDK) is configured in this deployment; refusing to fabricate a success response`, { objectType });
  throw new AppError(
    `SAP integration is not configured: no SAP connector is installed, so "${objectType}" was never sent to SAP`,
    501,
    'ERP_INTEGRATION_NOT_CONFIGURED'
  );
}

async function syncToOracle(objectType, data) {
  logger.warn(`syncToOracle(${objectType}) called but no Oracle connector (Oracle E-Business Suite API / oracledb) is configured in this deployment; refusing to fabricate a success response`, { objectType });
  throw new AppError(
    `Oracle integration is not configured: no Oracle connector is installed, so "${objectType}" was never sent to Oracle`,
    501,
    'ERP_INTEGRATION_NOT_CONFIGURED'
  );
}

async function syncToCustomERP(objectType, data) {
  // In production, call custom ERP API
  if (!ERP_CONFIG.custom.apiUrl) {
    throw new Error('Custom ERP API URL not configured');
  }
  
  logger.info(`Syncing ${objectType} to Custom ERP`);
  
  const response = await fetch(`${ERP_CONFIG.custom.apiUrl}/${objectType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ERP_CONFIG.custom.apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Custom ERP API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Log synchronization operation
 */
async function logSyncOperation(entityType, entityId, erpType, status, details) {
  const pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_sync_logs (entity_type, entity_id, erp_type, status, details, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [entityType, entityId, erpType, status, JSON.stringify(details)]);
}

/**
 * Express router for ERP service
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/product', authMiddleware, async (req, res) => {
  try {
    const { product_id, erp_type } = req.body;
    const result = await syncProductToERP(product_id, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/order', authMiddleware, async (req, res) => {
  try {
    const { order_id, erp_type } = req.body;
    const result = await syncOrderToERP(order_id, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/farmer', authMiddleware, async (req, res) => {
  try {
    const { farmer_id, erp_type } = req.body;
    const result = await syncFarmerToERP(farmer_id, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/transaction', authMiddleware, async (req, res) => {
  try {
    const { transaction_id, erp_type } = req.body;
    const result = await syncFinancialTransaction(transaction_id, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/asset', authMiddleware, async (req, res) => {
  try {
    const { asset_id, erp_type } = req.body;
    const result = await syncAssetToERP(asset_id, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ERP dashboard data
 */
async function getDashboardData() {
  try {
    const pg = getPostgreSQL();
    
    // Get financial summary
    const financialQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as net_profit,
        COUNT(*) as transaction_count
      FROM journal_entries
      WHERE entry_date >= NOW() - INTERVAL '30 days'
    `;
    
    const financialResult = await pg.query(financialQuery);
    const financial = financialResult.rows[0];
    
    // Get sync status
    const syncStatus = await getSyncStatus();
    
    // Get budget utilization
    const budgetQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_budget,
        COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as active_budget,
        COALESCE(SUM(CASE WHEN status = 'active' THEN utilized_amount ELSE 0 END), 0) as utilized_amount
      FROM budgets
      WHERE fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    
    const budgetResult = await pg.query(budgetQuery);
    const budget = budgetResult.rows[0];
    
    const budgetUtilization = budget.total_budget > 0 
      ? ((budget.utilized_amount / budget.total_budget) * 100).toFixed(1)
      : 0;
    
    return {
      financials: {
        revenue: parseFloat(financial.total_revenue) || 0,
        expenses: parseFloat(financial.total_expenses) || 0,
        profit: parseFloat(financial.net_profit) || 0,
        transactions: parseInt(financial.transaction_count) || 0
      },
      sync_status: syncStatus,
      budget_utilization: parseFloat(budgetUtilization),
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error getting ERP dashboard data', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get GL entries
 */
async function getGLEntries(limit = 50) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT 
        je.*,
        c.name as category_name,
        a.account_name
      FROM journal_entries je
      LEFT JOIN categories c ON je.category_id = c.id
      LEFT JOIN accounts a ON je.account_id = a.id
      ORDER BY je.entry_date DESC
      LIMIT $1
    `;
    
    const result = await pg.query(query, [limit]);
    return result.rows;
  } catch (error) {
    logger.error('Error getting GL entries', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get reconciliation data
 */
async function getReconciliation(limit = 50) {
  try {
    const pg = getPostgreSQL();
    
    // Get pending reconciliations
    const pendingQuery = `
      SELECT COUNT(*) as pending
      FROM financial_reconciliations
      WHERE status = 'pending'
    `;
    
    const conflictsQuery = `
      SELECT COUNT(*) as conflicts
      FROM financial_reconciliations
      WHERE status = 'conflict'
    `;
    
    const resolvedQuery = `
      SELECT COUNT(*) as resolved
      FROM financial_reconciliations
      WHERE status = 'resolved'
      AND resolved_at >= NOW() - INTERVAL '1 day'
    `;
    
    const [pendingResult, conflictsResult, resolvedResult] = await Promise.all([
      pg.query(pendingQuery),
      pg.query(conflictsQuery),
      pg.query(resolvedQuery)
    ]);
    
    // Get recent reconciliation items
    const itemsQuery = `
      SELECT 
        fr.*,
        je.entry_date,
        je.amount as system_amount,
        erp_data->>'amount' as erp_amount
      FROM financial_reconciliations fr
      LEFT JOIN journal_entries je ON fr.journal_entry_id = je.id
      ORDER BY fr.created_at DESC
      LIMIT $1
    `;
    
    const itemsResult = await pg.query(itemsQuery, [limit]);
    
    return {
      pending: parseInt(pendingResult.rows[0].pending) || 0,
      conflicts: parseInt(conflictsResult.rows[0].conflicts) || 0,
      resolved: parseInt(resolvedResult.rows[0].resolved) || 0,
      items: itemsResult.rows
    };
  } catch (error) {
    logger.error('Error getting reconciliation data', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get financial reports
 */
async function getFinancialReports(limit = 20) {
  try {
    const pg = getPostgreSQL();
    
    const query = `
      SELECT 
        fr.*,
        u.name as generated_by
      FROM financial_reports fr
      LEFT JOIN users u ON fr.generated_by_id = u.id
      ORDER BY fr.generated_at DESC
      LIMIT $1
    `;
    
    const result = await pg.query(query, [limit]);
    return result.rows;
  } catch (error) {
    logger.error('Error getting financial reports', { error: error.message, stack: error.stack });
    throw error;
  }
}

router.post('/sync/bulk', authMiddleware, async (req, res) => {
  try {
    const { entity_type, erp_type } = req.body;
    const result = await triggerBulkSync(entity_type, erp_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ERP health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'erp-service',
    configuration: {
      sap: {
        enabled: ERP_CONFIG.sap.enabled,
        configured: !!ERP_CONFIG.sap.username && !!ERP_CONFIG.sap.password
      },
      oracle: {
        enabled: ERP_CONFIG.oracle.enabled,
        configured: !!ERP_CONFIG.oracle.username && !!ERP_CONFIG.oracle.password
      },
      custom: {
        enabled: ERP_CONFIG.custom.enabled,
        configured: !!ERP_CONFIG.custom.apiUrl && !!ERP_CONFIG.custom.apiKey
      }
    },
    sync_status: SYNC_STATUS,
    active_syncs: SYNC_STATUS.activeSyncs.size,
    sync_queue_length: SYNC_STATUS.syncQueue.length
  });
});

// Dashboard data endpoint
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const dashboard = await getDashboardData();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync status endpoint
router.get('/sync-status', authMiddleware, async (req, res) => {
  try {
    const status = await getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GL entries endpoint
router.get('/gl-entries', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const entries = await getGLEntries(parseInt(limit));
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reconciliation endpoint
router.get('/reconciliation', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const reconciliation = await getReconciliation(parseInt(limit));
    res.json(reconciliation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Financial reports endpoint
router.get('/financial-reports', authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const reports = await getFinancialReports(parseInt(limit));
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  initializeERP,
  syncProductToERP,
  syncOrderToERP,
  syncFarmerToERP,
  syncFinancialTransaction,
  syncAssetToERP,
  getSyncStatus,
  triggerBulkSync,
  getDashboardData,
  getGLEntries,
  getReconciliation,
  getFinancialReports
};

// Merged from erpService.js
/**
 * AFRERA Complete ERP Integration Service
 * 
 * Comprehensive ERP integration with all agricultural modules:
 * - Farmer Module (crop planning, harvesting, field management)
 * - Crop Module (crop lifecycle, yield management, quality control)
 * - Livestock Module (animal health, breeding, production)
 * - All Inbuilt Modules (Dairy, Poultry, Goat, Sheep, Pig, etc.)
 * 
 * This service ensures that all agricultural operations are synchronized with:
 * - Financial ERP (GL posting, revenue tracking, cost allocation)
 * - Supply Chain ERP (inventory sync, procurement, logistics)
 * - Production ERP (production planning, resource allocation)
 * - Customer ERP (CRM integration, customer data sync)
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

// ============================================================================
// FARMER MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync farmer crop planning with ERP production planning
 */
async function syncFarmerCropPlanningWithERP(farmerId, cropPlanData) {
  const pg = getPostgreSQL();
  
  try {
    // Get farmer's crop plan
    const cropPlan = await pg.query(`
      SELECT * FROM farmer_crop_plans
      WHERE farmer_id = $1 AND status = 'active'
    `, [farmerId]);
    
    if (cropPlan.rows.length === 0) {
      return { success: true, message: 'No active crop plans found' };
    }
    
    // Create ERP production orders for each crop plan
    for (const plan of cropPlan.rows) {
      const productionOrder = {
        farmer_id: farmerId,
        crop_type: plan.crop_type,
        planned_area: plan.planned_area,
        expected_yield: plan.expected_yield,
        planting_date: plan.planting_date,
        harvest_date: plan.harvest_date,
        resource_requirements: {
          seeds: plan.seed_quantity,
          fertilizers: plan.fertilizer_requirements,
          labor: plan.labor_requirements,
          equipment: plan.equipment_requirements
        },
        cost_allocations: {
          seed_cost: plan.seed_cost,
          fertilizer_cost: plan.fertilizer_cost,
          labor_cost: plan.labor_cost,
          equipment_cost: plan.equipment_cost,
          other_costs: plan.other_costs
        }
      };
      
      // Create production order in ERP
      await pg.query(`
        INSERT INTO erp_production_orders 
        (farmer_id, crop_type, planned_area, expected_yield, planting_date, harvest_date, 
         resource_requirements, cost_allocations, order_status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'planned', NOW())
      `, [farmerId, plan.crop_type, plan.planned_area, plan.expected_yield, 
          plan.planting_date, plan.harvest_date, JSON.stringify(productionOrder.resource_requirements),
          JSON.stringify(productionOrder.cost_allocations)]);
      
      // Post initial cost allocation to financial ERP
      await postCostAllocationToGL(farmerId, plan.crop_type, productionOrder.cost_allocations);
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.crop_plan.synced', {
      farmer_id: farmerId,
      crop_plans_synced: cropPlan.rows.length,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer crop planning synced with ERP', { farmerId, plansSynced: cropPlan.rows.length });
    
    return { success: true, plans_synced: cropPlan.rows.length };
  } catch (error) {
    logger.error('Error syncing farmer crop planning with ERP', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * Sync farmer harvest data with ERP inventory and financial ERP
 */
async function syncFarmerHarvestWithERP(farmerId, harvestData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with harvest data
    await pg.query(`
      INSERT INTO erp_inventory 
      (farmer_id, product_type, quantity, quality_grade, harvest_date, location, source_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'harvest', NOW())
      ON CONFLICT (farmer_id, product_type, harvest_date) 
      DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
    `, [farmerId, harvestData.crop_type, harvestData.quantity, harvestData.quality_grade,
        harvestData.harvest_date, harvestData.location]);
    
    // Calculate revenue based on quality grade and market price
    const revenue = await calculateHarvestRevenue(harvestData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(farmerId, harvestData.crop_type, revenue, 'harvest');
    
    // Update farmer's financial records
    await pg.query(`
      INSERT INTO farmer_financial_records 
      (farmer_id, transaction_type, amount, description, related_crop, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Harvest revenue', $3, $4, NOW())
    `, [farmerId, revenue.total_value, harvestData.crop_type, harvestData.harvest_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.harvest.synced', {
      farmer_id: farmerId,
      harvest_data: harvestData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer harvest synced with ERP', { farmerId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing farmer harvest with ERP', { error: error.message, farmerId });
    throw error;
  }
}

/**
 * Sync farmer field data with ERP asset management
 */
async function syncFarmerFieldWithERP(farmerId, fieldData) {
  const pg = getPostgreSQL();
  
  try {
    // Register field as asset in ERP
    await pg.query(`
      INSERT INTO erp_assets 
      (asset_type, owner_id, asset_name, location, area_size, soil_type, irrigation_type, 
       current_value, acquisition_date, asset_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', NOW())
      ON CONFLICT (owner_id, asset_name, location) 
      DO UPDATE SET area_size = $5, current_value = $8, asset_status = 'active'
    `, ['land', farmerId, fieldData.field_name, fieldData.location, fieldData.area_size,
        fieldData.soil_type, fieldData.irrigation_type, fieldData.estimated_value,
        fieldData.acquisition_date]);
    
    // Calculate depreciation and post to financial ERP
    const depreciation = calculateLandDepreciation(fieldData.estimated_value, fieldData.acquisition_date);
    await postDepreciationToGL(farmerId, fieldData.field_name, depreciation);
    
    // Emit signal bus event
    await signalBus.emit('erp.farmer.field.synced', {
      farmer_id: farmerId,
      field_data: fieldData,
      asset_registered: true,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Farmer field synced with ERP', { farmerId, fieldName: fieldData.field_name });
    
    return { success: true, asset_registered: true };
  } catch (error) {
    logger.error('Error syncing farmer field with ERP', { error: error.message, farmerId });
    throw error;
  }
}

// ============================================================================
// CROP MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync crop lifecycle stages with ERP production tracking
 */
async function syncCropLifecycleWithERP(cropId, lifecycleData) {
  const pg = getPostgreSQL();
  
  try {
    // Get crop information
    const crop = await pg.query(`
      SELECT * FROM crop_lifecycle
      WHERE crop_id = $1
    `, [cropId]);
    
    if (crop.rows.length === 0) {
      return { success: true, message: 'Crop not found' };
    }
    
    const cropData = crop.rows[0];
    
    // Update ERP production tracking based on lifecycle stage
    await pg.query(`
      INSERT INTO erp_production_tracking 
      (crop_id, stage, stage_start_date, stage_end_date, resources_used, 
       costs_incurred, outputs_produced, quality_metrics, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (crop_id, stage) 
      DO UPDATE SET stage_end_date = $4, resources_used = $5, costs_incurred = $6, 
                   outputs_produced = $7, quality_metrics = $8
    `, [cropId, lifecycleData.stage, lifecycleData.start_date, lifecycleData.end_date,
        JSON.stringify(lifecycleData.resources_used), JSON.stringify(lifecycleData.costs_incurred),
        JSON.stringify(lifecycleData.outputs_produced), JSON.stringify(lifecycleData.quality_metrics)]);
    
    // Post stage costs to financial ERP
    if (lifecycleData.costs_incurred) {
      await postStageCostsToGL(cropId, lifecycleData.stage, lifecycleData.costs_incurred);
    }
    
    // Update inventory if stage produces outputs
    if (lifecycleData.outputs_produced) {
      for (const output of lifecycleData.outputs_produced) {
        await pg.query(`
          INSERT INTO erp_inventory 
          (crop_id, product_type, quantity, quality_grade, production_date, source_type, created_at)
          VALUES ($1, $2, $3, $4, $5, 'production', NOW())
          ON CONFLICT (crop_id, product_type, production_date) 
          DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
        `, [cropId, output.product_type, output.quantity, output.quality_grade, output.production_date]);
      }
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.crop.lifecycle.synced', {
      crop_id: cropId,
      stage: lifecycleData.stage,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Crop lifecycle synced with ERP', { cropId, stage: lifecycleData.stage });
    
    return { success: true };
  } catch (error) {
    logger.error('Error syncing crop lifecycle with ERP', { error: error.message, cropId });
    throw error;
  }
}

/**
 * Sync crop yield data with ERP inventory and financial ERP
 */
async function syncCropYieldWithERP(cropId, yieldData) {
  const pg = getPostgreSQL();
  
  try {
    // Calculate yield metrics
    const yieldMetrics = {
      total_yield: yieldData.total_quantity,
      yield_per_hectare: yieldData.total_quantity / yieldData.area_hectares,
      quality_distribution: yieldData.quality_distribution,
      moisture_content: yieldData.moisture_content,
      protein_content: yieldData.protein_content
    };
    
    // Update ERP inventory with yield data
    for (const qualityGrade of Object.keys(yieldData.quality_distribution)) {
      const quantity = yieldData.quality_distribution[qualityGrade];
      
      await pg.query(`
        INSERT INTO erp_inventory 
        (crop_id, product_type, quantity, quality_grade, harvest_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'yield', NOW())
        ON CONFLICT (crop_id, product_type, harvest_date, quality_grade) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3
      `, [cropId, yieldData.crop_type, quantity, qualityGrade, yieldData.harvest_date, yieldData.location]);
    }
    
    // Calculate revenue based on quality and market prices
    const revenue = await calculateYieldRevenue(yieldData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(null, yieldData.crop_type, revenue, 'crop_yield');
    
    // Update crop financial records
    await pg.query(`
      INSERT INTO crop_financial_records 
      (crop_id, transaction_type, amount, description, quality_metrics, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Crop yield revenue', $3, $4, NOW())
    `, [cropId, revenue.total_value, JSON.stringify(yieldMetrics), yieldData.harvest_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.crop.yield.synced', {
      crop_id: cropId,
      yield_data: yieldData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Crop yield synced with ERP', { cropId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing crop yield with ERP', { error: error.message, cropId });
    throw error;
  }
}

// ============================================================================
// LIVESTOCK MODULE ERP INTEGRATION
// ============================================================================

/**
 * Sync livestock data with ERP asset management
 */
async function syncLivestockWithERP(livestockId, livestockData) {
  const pg = getPostgreSQL();
  
  try {
    // Register livestock as asset in ERP
    await pg.query(`
      INSERT INTO erp_assets 
      (asset_type, owner_id, asset_name, breed, age, location, current_value, 
       acquisition_date, asset_status, health_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW())
      ON CONFLICT (owner_id, asset_name, breed) 
      DO UPDATE SET current_value = $7, health_status = $9, asset_status = 'active'
    `, ['livestock', livestockData.owner_id, livestockData.name, livestockData.breed,
        livestockData.age, livestockData.location, livestockData.current_value,
        livestockData.acquisition_date, livestockData.health_status]);
    
    // Calculate depreciation and post to financial ERP
    const depreciation = calculateLivestockDepreciation(livestockData.current_value, livestockData.age);
    await postDepreciationToGL(livestockData.owner_id, livestockData.name, depreciation);
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.synced', {
      livestock_id: livestockId,
      livestock_data: livestockData,
      asset_registered: true,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock synced with ERP', { livestockId, livestockName: livestockData.name });
    
    return { success: true, asset_registered: true };
  } catch (error) {
    logger.error('Error syncing livestock with ERP', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * Sync livestock production with ERP inventory and financial ERP
 */
async function syncLivestockProductionWithERP(livestockId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with production data
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (livestock_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'livestock_production', NOW())
        ON CONFLICT (livestock_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [livestockId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue based on production
    const revenue = await calculateLivestockProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, productionData.livestock_type, revenue, 'livestock_production');
    
    // Update livestock financial records
    await pg.query(`
      INSERT INTO livestock_financial_records 
      (livestock_id, transaction_type, amount, description, production_metrics, transaction_date, created_at)
      VALUES ($1, 'revenue', $2, 'Livestock production revenue', $3, $4, NOW())
    `, [livestockId, revenue.total_value, JSON.stringify(productionData.production_metrics), productionData.production_date]);
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.production.synced', {
      livestock_id: livestockId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock production synced with ERP', { livestockId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing livestock production with ERP', { error: error.message, livestockId });
    throw error;
  }
}

/**
 * Sync livestock health events with ERP asset management and financial ERP
 */
async function syncLivestockHealthWithERP(livestockId, healthData) {
  const pg = getPostgreSQL();
  
  try {
    // Update asset health status in ERP
    await pg.query(`
      UPDATE erp_assets 
      SET health_status = $1, last_health_check = NOW()
      WHERE asset_type = 'livestock' AND asset_id = $2
    `, [healthData.health_status, livestockId]);
    
    // If health issue, calculate potential loss and post to financial ERP
    if (healthData.health_status === 'sick' || healthData.health_status === 'critical') {
      const potentialLoss = await calculateHealthEventCost(livestockId, healthData);
      await postProvisionToGL(healthData.owner_id, livestockId, potentialLoss, 'health_event');
    }
    
    // Emit signal bus event
    await signalBus.emit('erp.livestock.health.synced', {
      livestock_id: livestockId,
      health_data: healthData,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Livestock health synced with ERP', { livestockId, healthStatus: healthData.health_status });
    
    return { success: true };
  } catch (error) {
    logger.error('Error syncing livestock health with ERP', { error: error.message, livestockId });
    throw error;
  }
}

// ============================================================================
// INBUILT MODULES ERP INTEGRATION
// ============================================================================

/**
 * Sync dairy production with ERP
 */
async function syncDairyProductionWithERP(dairyId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with dairy production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (dairy_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'dairy_production', NOW())
        ON CONFLICT (dairy_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [dairyId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    const revenue = await calculateDairyProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'dairy', revenue, 'dairy_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.dairy.production.synced', {
      dairy_id: dairyId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Dairy production synced with ERP', { dairyId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing dairy production with ERP', { error: error.message, dairyId });
    throw error;
  }
}

/**
 * Sync poultry production with ERP
 */
async function syncPoultryProductionWithERP(poultryId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with poultry production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (poultry_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'poultry_production', NOW())
        ON CONFLICT (poultry_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [poultryId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    const revenue = await calculatePoultryProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'poultry', revenue, 'poultry_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.poultry.production.synced', {
      poultry_id: poultryId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Poultry production synced with ERP', { poultryId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing poultry production with ERP', { error: error.message, poultryId });
    throw error;
  }
}

/**
 * Sync goat production with ERP
 */
async function syncGoatProductionWithERP(goatId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with goat production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (goat_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'goat_production', NOW())
        ON CONFLICT (goat_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [goatId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    const revenue = await calculateGoatProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'goat', revenue, 'goat_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.goat.production.synced', {
      goat_id: goatId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Goat production synced with ERP', { goatId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing goat production with ERP', { error: error.message, goatId });
    throw error;
  }
}

/**
 * Sync sheep production with ERP
 */
async function syncSheepProductionWithERP(sheepId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with sheep production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (sheep_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'sheep_production', NOW())
        ON CONFLICT (sheep_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [sheepId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    const revenue = await calculateSheepProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'sheep', revenue, 'sheep_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.sheep.production.synced', {
      sheep_id: sheepId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Sheep production synced with ERP', { sheepId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing sheep production with ERP', { error: error.message, sheepId });
    throw error;
  }
}

/**
 * Sync pig production with ERP
 */
async function syncPigProductionWithERP(pigId, productionData) {
  const pg = getPostgreSQL();
  
  try {
    // Update ERP inventory with pig production
    for (const product of productionData.products) {
      await pg.query(`
        INSERT INTO erp_inventory 
        (pig_id, product_type, quantity, quality_grade, production_date, location, source_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'pig_production', NOW())
        ON CONFLICT (pig_id, product_type, production_date) 
        DO UPDATE SET quantity = erp_inventory.quantity + $3, quality_grade = $4
      `, [pigId, product.product_type, product.quantity, product.quality_grade,
          productionData.production_date, productionData.location]);
    }
    
    // Calculate revenue
    const revenue = await calculatePigProductionRevenue(productionData);
    
    // Post revenue to financial ERP
    await postRevenueToGL(productionData.owner_id, 'pig', revenue, 'pig_production');
    
    // Emit signal bus event
    await signalBus.emit('erp.pig.production.synced', {
      pig_id: pigId,
      production_data: productionData,
      revenue: revenue,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Pig production synced with ERP', { pigId, revenue: revenue.total_value });
    
    return { success: true, revenue };
  } catch (error) {
    logger.error('Error syncing pig production with ERP', { error: error.message, pigId });
    throw error;
  }
}

// ============================================================================
// FINANCIAL ERP HELPER FUNCTIONS
// ============================================================================

async function postCostAllocationToGL(ownerId, cropType, costAllocations) {
  const pg = getPostgreSQL();
  
  const totalCost = Object.values(costAllocations).reduce((sum, cost) => sum + (cost || 0), 0);
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['expense', totalCost, `Cost allocation for ${cropType}`, ownerId, 'cost_allocation']);
}

async function postRevenueToGL(ownerId, productType, revenue, source) {
  const pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['revenue', revenue.total_value, `Revenue from ${source} - ${productType}`, ownerId, source]);
}

async function postDepreciationToGL(ownerId, assetName, depreciation) {
  const pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['depreciation', depreciation.amount, `Depreciation for ${assetName}`, ownerId, 'depreciation']);
}

async function postProvisionToGL(ownerId, assetId, provision, source) {
  const pg = getPostgreSQL();
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['provision', provision.amount, `Provision for ${source}`, assetId, source]);
}

async function postStageCostsToGL(cropId, stage, costs) {
  const pg = getPostgreSQL();
  
  const totalCost = Object.values(costs).reduce((sum, cost) => sum + (cost || 0), 0);
  
  await pg.query(`
    INSERT INTO erp_gl_entries 
    (account_type, amount, description, reference_id, reference_type, transaction_date, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, ['expense', totalCost, `Stage costs for ${stage}`, cropId, 'crop_stage']);
}

// ============================================================================
// CALCULATION HELPER FUNCTIONS
// ============================================================================

async function calculateHarvestRevenue(harvestData) {
  // Calculate revenue based on quality grade and market price
  const marketPrices = {
    'premium': 50,
    'grade_a': 40,
    'grade_b': 30,
    'grade_c': 20
  };
  
  const pricePerKg = marketPrices[harvestData.quality_grade] || 30;
  const totalValue = harvestData.quantity * pricePerKg;
  
  return {
    total_value: totalValue,
    price_per_kg: pricePerKg,
    quantity: harvestData.quantity,
    quality_grade: harvestData.quality_grade
  };
}

async function calculateYieldRevenue(yieldData) {
  let totalValue = 0;
  
  for (const [qualityGrade, quantity] of Object.entries(yieldData.quality_distribution)) {
    const marketPrices = {
      'premium': 50,
      'grade_a': 40,
      'grade_b': 30,
      'grade_c': 20
    };
    
    const pricePerKg = marketPrices[qualityGrade] || 30;
    totalValue += quantity * pricePerKg;
  }
  
  return {
    total_value: totalValue,
    quality_distribution: yieldData.quality_distribution
  };
}

async function calculateLivestockProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const marketPrices = {
      'milk': 30,
      'meat': 100,
      'eggs': 5,
      'wool': 50
    };
    
    const pricePerUnit = marketPrices[product.product_type] || 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateDairyProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const pricePerUnit = product.product_type === 'milk' ? 30 : 
                         product.product_type === 'cheese' ? 200 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculatePoultryProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const pricePerUnit = product.product_type === 'eggs' ? 5 : 
                         product.product_type === 'meat' ? 100 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateGoatProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const pricePerUnit = product.product_type === 'milk' ? 35 : 
                         product.product_type === 'meat' ? 120 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculateSheepProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const pricePerUnit = product.product_type === 'milk' ? 40 : 
                         product.product_type === 'meat' ? 110 : 
                         product.product_type === 'wool' ? 60 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

async function calculatePigProductionRevenue(productionData) {
  let totalValue = 0;
  
  for (const product of productionData.products) {
    const pricePerUnit = product.product_type === 'meat' ? 90 : 50;
    totalValue += product.quantity * pricePerUnit;
  }
  
  return {
    total_value: totalValue,
    products: productionData.products
  };
}

function calculateLandDepreciation(value, acquisitionDate) {
  const acquisitionYear = new Date(acquisitionDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsOwned = currentYear - acquisitionYear;
  const depreciationRate = 0.02; // 2% per year
  const depreciatedValue = value * (1 - (depreciationRate * yearsOwned));
  
  return {
    original_value: value,
    depreciated_value: depreciatedValue,
    depreciation_amount: value - depreciatedValue,
    years_owned: yearsOwned
  };
}

function calculateLivestockDepreciation(value, age) {
  const depreciationRate = 0.15; // 15% per year
  const depreciatedValue = value * (1 - (depreciationRate * age));
  
  return {
    original_value: value,
    depreciated_value: depreciatedValue,
    depreciation_amount: value - depreciatedValue,
    age: age
  };
}

async function calculateHealthEventCost(livestockId, healthData) {
  // Calculate potential loss based on health event
  const lossFactors = {
    'sick': 0.3,
    'critical': 0.7,
    'recovering': 0.1
  };
  
  const lossFactor = lossFactors[healthData.health_status] || 0.3;
  
  // Get current value of livestock
  const pg = getPostgreSQL();
  const asset = await pg.query(`
    SELECT current_value FROM erp_assets
    WHERE asset_id = $1
  `, [livestockId]);
  
  const currentValue = asset.rows[0]?.current_value || 0;
  const potentialLoss = currentValue * lossFactor;
  
  return {
    potential_loss: potentialLoss,
    loss_factor: lossFactor,
    current_value: currentValue
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Farmer Module Integration
  syncFarmerCropPlanningWithERP,
  syncFarmerHarvestWithERP,
  syncFarmerFieldWithERP,
  
  // Crop Module Integration
  syncCropLifecycleWithERP,
  syncCropYieldWithERP,
  
  // Livestock Module Integration
  syncLivestockWithERP,
  syncLivestockProductionWithERP,
  syncLivestockHealthWithERP,
  
  // Inbuilt Modules Integration
  syncDairyProductionWithERP,
  syncPoultryProductionWithERP,
  syncGoatProductionWithERP,
  syncSheepProductionWithERP,
  syncPigProductionWithERP
};


// Merged from erpService.js
/**
 * Comprehensive ERP Core Service - Oracle/SAP Standards
 * 
 * Complete ERP implementation following Oracle E-Business Suite and SAP S/4HANA standards
 * Includes all core ERP modules: FI, CO, MM, SD, PP, QM, PM, HR, PS, TR, AM, BI
 * 
 * Architecture: Multi-tenant, multi-org, multi-currency, multi-language
 * Compliance: IFRS, GAAP, GST, VAT, local regulations
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');
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
      
      return { ...header, total_amount: totalAmount };
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
        `INSERT INTO erp_production_orders (production_order, material_code, production_quantity, unit, planned_start_date, planned_finish_date, production_plant, bom_reference, routing_reference, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'created', NOW())
         RETURNING *`,
        [production_order, material_code, production_quantity, unit, planned_start_date, planned_finish_date, production_plant, bom || null, routing || null]
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
      
      await signalBus.emit('erp.pp.po.released', { production_order: productionOrder, timestamp: new Date().toISOString() });
      logger.info('Production order released', { production_order: productionOrder });
      
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
      
      await signalBus.emit('erp.pp.po.confirmed', { production_order: productionOrder, timestamp: new Date().toISOString() });
      logger.info('Production order confirmed', { production_order: productionOrder });
      
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
      
      await signalBus.emit('erp.pm.mo.completed', { maintenance_order: maintenanceOrder, timestamp: new Date().toISOString() });
      logger.info('Maintenance order completed', { maintenance_order: maintenanceOrder });
      
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


// Merged from ecommerceERPService.js
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

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus } = require('../../core/signalBus');

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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
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
    
    const product = listing.rows[0];
    
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
  const pg = getPostgreSQL();
  
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
  const pg = getPostgreSQL();
  
  try {
    // Get product details
    const product = await pg.query(`
      SELECT id, product_name, category_id, seller_id
      FROM product_listings
      WHERE id = $1
    `, [productId]);
    
    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }
    
    // Generate production order number
    const poNumber = `PRD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    
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



