/**
 * ERP Integration Service
 * Provides integration with SAP, Oracle, and custom ERP systems
 * Handles data synchronization, business process automation, and financial Reconciliation
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const { authMiddleware } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

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
const express = require('express');
const router = express.Router();

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

router.post('/sync/bulk', authMiddleware, async (req, res) => {
  try {
    const { entity_type, erp_type } = req.body;
    const result = await triggerBulkSync(entity_type, erp_type);
    res.json(result);
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
  triggerBulkSync
};
