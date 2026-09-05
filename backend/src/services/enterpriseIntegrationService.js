/**
 * M030: Enterprise Integration Service
 * Manages integrations with enterprise ERP systems, third-party services,
 * and external APIs for seamless business operations
 */

const db = require('../database/connection');
const logger = require('../utils/logger');
const https = require('https');
const http = require('http');

class EnterpriseIntegrationService {
  constructor() {
    this.serviceName = 'EnterpriseIntegrationService';
    this.activeIntegrations = new Map();
    this.integrationCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Register new integration
   */
  async registerIntegration(integrationData) {
    try {
      const {
        integrationType,
        integrationName,
        endpointUrl,
        apiKey,
        config,
        organizationId
      } = integrationData;

      // Validate integration type
      const supportedTypes = ['erp', 'payment_gateway', 'logistics', 'analytics', 'communication'];
      if (!supportedTypes.includes(integrationType)) {
        return {
          success: false,
          error: 'Unsupported integration type',
          supportedTypes
        };
      }

      // Test connection
      const connectionTest = await this.testConnection(endpointUrl, apiKey);
      if (!connectionTest.success) {
        return {
          success: false,
          error: 'Connection test failed',
          details: connectionTest.error
        };
      }

      // Store integration
      const query = `
        INSERT INTO enterprise_integrations (
          integration_id, integration_type, integration_name,
          endpoint_url, api_key, config, organization_id,
          status, created_at, last_tested
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
        RETURNING integration_id, integration_type, status
      `;

      const integrationId = this.generateIntegrationId();
      const result = await db.query(query, [
        integrationId, integrationType, integrationName,
        endpointUrl, this.encryptApiKey(apiKey),
        JSON.stringify(config), organizationId
      ]);

      // Add to active integrations
      this.activeIntegrations.set(integrationId, {
        id: result.rows[0].integration_id,
        type: result.rows[0].integration_type,
        endpointUrl,
        config,
        organizationId,
        lastUsed: new Date()
      });

      return {
        success: true,
        data: {
          integrationId: result.rows[0].integration_id,
          integrationType: result.rows[0].integration_type,
          status: result.rows[0].status,
          connectionStatus: 'connected',
          registeredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - registerIntegration error:`, error);
      return {
        success: false,
        error: 'Failed to register integration',
        details: error.message
      };
    }
  }

  /**
   * Sync data with ERP system
   */
  async syncWithERP(integrationId, syncConfig) {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration || integration.integration_type !== 'erp') {
        return {
          success: false,
          error: 'Invalid ERP integration',
          integrationId
        };
      }

      const { dataType, records, syncDirection } = syncConfig;

      let syncResult;
      if (syncDirection === 'push') {
        syncResult = await this.pushToERP(integration, dataType, records);
      } else if (syncDirection === 'pull') {
        syncResult = await this.pullFromERP(integration, dataType);
      } else {
        syncResult = await this.bidirectionalSync(integration, dataType, records);
      }

      // Log sync activity
      await this.logSyncActivity(integrationId, syncConfig, syncResult);

      return {
        success: true,
        data: {
          integrationId,
          syncType: syncDirection,
          dataType,
          recordsProcessed: syncResult.recordsProcessed,
          syncStatus: syncResult.status,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - syncWithERP error:`, error);
      return {
        success: false,
        error: 'Failed to sync with ERP',
        details: error.message
      };
    }
  }

  /**
   * Process payment through gateway
   */
  async processPayment(integrationId, paymentData) {
    try {
      let integration = await this.getIntegration(integrationId);
      if (!integration || integration.integration_type !== 'payment_gateway') {
        return {
          success: false,
          error: 'Invalid payment gateway integration',
          integrationId
        };
      }

      const { amount, currency, orderId, customerDetails } = paymentData;

      // Validate payment data
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid payment data',
          validationErrors: validation.errors
        };
      }

      // Process payment
      const paymentResult = await this.sendPaymentRequest(
        integration,
        paymentData
      );

      // Store payment record
      if (paymentResult.success) {
        await this.storePaymentRecord(paymentResult, integrationId);
      }

      return paymentResult;
    } catch (error) {
      logger.error(`${this.serviceName} - processPayment error:`, error);
      return {
        success: false,
        error: 'Failed to process payment',
        details: error.message
      };
    }
  }

  /**
   * Sync logistics data
   */
  async syncLogistics(integrationId, logisticsData) {
    try {
      let integration = await this.getIntegration(integrationId);
      if (!integration || integration.integration_type !== 'logistics') {
        return {
          success: false,
          error: 'Invalid logistics integration',
          integrationId
        };
      }

      const { operation, shipmentData } = logisticsData;

      let result;
      switch (operation) {
        case 'create_shipment':
          result = await this.createShipment(integration, shipmentData);
          break;
        case 'track_shipment':
          result = await this.trackShipment(integration, shipmentData.shipmentId);
          break;
        case 'update_shipment':
          result = await this.updateShipment(integration, shipmentData);
          break;
        default:
          result = {
            success: false,
            error: 'Invalid logistics operation',
            operation
          };
      }

      return result;
    } catch (error) {
      logger.error(`${this.serviceName} - syncLogistics error:`, error);
      return {
        success: false,
        error: 'Failed to sync logistics',
        details: error.message
      };
    }
  }

  /**
   * Send analytics data
   */
  async sendAnalytics(integrationId, analyticsData) {
    try {
      let integration = await this.getIntegration(integrationId);
      if (!integration || integration.integration_type !== 'analytics') {
        return {
          success: false,
          error: 'Invalid analytics integration',
          integrationId
        };
      }

      const { eventType, eventData, userId, sessionId } = analyticsData;

      // Send analytics event
      let result = await this.sendAnalyticsEvent(
        integration,
        eventType,
        eventData,
        userId,
        sessionId
      );

      return {
        success: true,
        data: {
          eventId: result.eventId,
          eventType,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - sendAnalytics error:`, error);
      return {
        success: false,
        error: 'Failed to send analytics',
        details: error.message
      };
    }
  }

  /**
   * Send communication message
   */
  async sendCommunication(integrationId, messageData) {
    try {
      let integration = await this.getIntegration(integrationId);
      if (!integration || integration.integration_type !== 'communication') {
        return {
          success: false,
          error: 'Invalid communication integration',
          integrationId
        };
      }

      const { channel, recipients, message, templateId } = messageData;

      let result = await this.sendMessage(
        integration,
        channel,
        recipients,
        message,
        templateId
      );

      return {
        success: true,
        data: {
          messageId: result.messageId,
          channel,
          recipientsCount: recipients.length,
          sentAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - sendCommunication error:`, error);
      return {
        success: false,
        error: 'Failed to send communication',
        details: error.message
      };
    }
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId) {
    let query = `
      SELECT integration_id, integration_type, integration_name,
             endpoint_url, config, organization_id, status,
             created_at, last_tested
      FROM enterprise_integrations
      WHERE integration_id = $1 AND status = 'active'
    `;

    let result = await db.query(query, [integrationId]);
    if (result.rows.length === 0) return null;

    let integration = result.rows[0];
    integration.config = JSON.parse(integration.config);
    return integration;
  }

  /**
   * Test connection to integration endpoint
   */
  async testConnection(endpointUrl, apiKey) {
    try {
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const response = await this.makeHttpRequest(endpointUrl + '/health', options);
      
      return {
        success: response.statusCode === 200,
        statusCode: response.statusCode,
        responseTime: response.responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Push data to ERP
   */
  async pushToERP(integration, dataType, records) {
    const endpoint = `${integration.endpoint_url}/api/${dataType}`;
    let options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ records })
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    return {
      status: response.statusCode === 200 ? 'success' : 'failed',
      recordsProcessed: records.length,
      response: response.body
    };
  }

  /**
   * Pull data from ERP
   */
  async pullFromERP(integration, dataType) {
    let endpoint = `${integration.endpoint_url}/api/${dataType}`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      }
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    if (response.statusCode === 200) {
      const records = JSON.parse(response.body);
      return {
        status: 'success',
        recordsProcessed: records.length,
        records
      };
    }
    
    return {
      status: 'failed',
      recordsProcessed: 0,
      error: response.body
    };
  }

  /**
   * Bidirectional sync
   */
  async bidirectionalSync(integration, dataType, records) {
    const pushResult = await this.pushToERP(integration, dataType, records);
    const pullResult = await this.pullFromERP(integration, dataType);
    
    return {
      status: pushResult.status === 'success' && pullResult.status === 'success' ? 'success' : 'partial',
      pushResult,
      pullResult,
      recordsProcessed: pushResult.recordsProcessed + pullResult.recordsProcessed
    };
  }

  /**
   * Send payment request
   */
  async sendPaymentRequest(integration, paymentData) {
    let endpoint = `${integration.endpoint_url}/payments`;
    let options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    if (response.statusCode === 200) {
      let result = JSON.parse(response.body);
      return {
        success: true,
        data: {
          paymentId: result.payment_id,
          status: result.status,
          transactionId: result.transaction_id
        }
      };
    }
    
    return {
      success: false,
      error: 'Payment processing failed',
      details: response.body
    };
  }

  /**
   * Create shipment
   */
  async createShipment(integration, shipmentData) {
    let endpoint = `${integration.endpoint_url}/shipments`;
    let options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    if (response.statusCode === 200) {
      let result = JSON.parse(response.body);
      return {
        success: true,
        data: {
          shipmentId: result.shipment_id,
          trackingNumber: result.tracking_number,
          estimatedDelivery: result.estimated_delivery
        }
      };
    }
    
    return {
      success: false,
      error: 'Failed to create shipment',
      details: response.body
    };
  }

  /**
   * Track shipment
   */
  async trackShipment(integration, shipmentId) {
    let endpoint = `${integration.endpoint_url}/shipments/${shipmentId}/track`;
    let options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      }
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    if (response.statusCode === 200) {
      let result = JSON.parse(response.body);
      return {
        success: true,
        data: {
          shipmentId,
          currentStatus: result.status,
          location: result.current_location,
          estimatedDelivery: result.estimated_delivery,
          trackingHistory: result.tracking_history
        }
      };
    }
    
    return {
      success: false,
      error: 'Failed to track shipment',
      details: response.body
    };
  }

  /**
   * Update shipment
   */
  async updateShipment(integration, shipmentData) {
    let endpoint = `${integration.endpoint_url}/shipments/${shipmentData.shipmentId}`;
    let options = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    if (response.statusCode === 200) {
      return {
        success: true,
        data: {
          shipmentId: shipmentData.shipmentId,
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    return {
      success: false,
      error: 'Failed to update shipment',
      details: response.body
    };
  }

  /**
   * Send analytics event
   */
  async sendAnalyticsEvent(integration, eventType, eventData, userId, sessionId) {
    let endpoint = `${integration.endpoint_url}/events`;
    let options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        user_id: userId,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      })
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    return {
      eventId: `evt-${Date.now()}`,
      status: response.statusCode === 200 ? 'delivered' : 'failed'
    };
  }

  /**
   * Send message
   */
  async sendMessage(integration, channel, recipients, message, templateId) {
    let endpoint = `${integration.endpoint_url}/messages`;
    let options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.decryptApiKey(integration.api_key)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        recipients,
        message,
        template_id: templateId
      })
    };

    let response = await this.makeHttpRequest(endpoint, options);
    
    return {
      messageId: `msg-${Date.now()}`,
      status: response.statusCode === 200 ? 'sent' : 'failed'
    };
  }

  /**
   * Make HTTP request
   */
  async makeHttpRequest(url, options) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data,
            responseTime: Date.now() - startTime
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Validate payment data
   */
  validatePaymentData(paymentData) {
    const errors = [];
    
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Invalid amount');
    }
    
    if (!paymentData.currency || paymentData.currency.length !== 3) {
      errors.push('Invalid currency code');
    }
    
    if (!paymentData.orderId) {
      errors.push('Order ID is required');
    }
    
    if (!paymentData.customerDetails || !paymentData.customerDetails.email) {
      errors.push('Customer email is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Store payment record
   */
  async storePaymentRecord(paymentResult, integrationId) {
    let query = `
      INSERT INTO payment_records (
        payment_id, integration_id, order_id, amount,
        currency, status, transaction_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    await db.query(query, [
      paymentResult.data.paymentId,
      integrationId,
      paymentResult.data.orderId,
      paymentResult.data.amount,
      paymentResult.data.currency,
      paymentResult.data.status,
      paymentResult.data.transactionId
    ]);
  }

  /**
   * Log sync activity
   */
  async logSyncActivity(integrationId, syncConfig, syncResult) {
    let query = `
      INSERT INTO integration_sync_logs (
        integration_id, sync_type, data_type, sync_direction,
        records_processed, status, error_message, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    await db.query(query, [
      integrationId,
      syncConfig.dataType,
      syncConfig.dataType,
      syncConfig.syncDirection,
      syncResult.recordsProcessed,
      syncResult.status,
      syncResult.error || null
    ]);
  }

  /**
   * Encrypt API key (simplified - use proper encryption in production)
   */
  encryptApiKey(apiKey) {
    // In production, use proper encryption like AES-256
    return Buffer.from(apiKey).toString('base64');
  }

  /**
   * Decrypt API key (simplified - use proper decryption in production)
   */
  decryptApiKey(encryptedKey) {
    // In production, use proper decryption
    return Buffer.from(encryptedKey, 'base64').toString();
  }

  /**
   * Generate integration ID
   */
  generateIntegrationId() {
    return `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get organization integrations
   */
  async getOrganizationIntegrations(organizationId) {
    let query = `
      SELECT integration_id, integration_type, integration_name,
             status, created_at, last_tested
      FROM enterprise_integrations
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `;

    let result = await db.query(query, [organizationId]);
    
    return {
      success: true,
      data: {
        organizationId,
        integrationCount: result.rows.length,
        integrations: result.rows
      }
    };
  }

  /**
   * Deactivate integration
   */
  async deactivateIntegration(integrationId) {
    let query = `
      UPDATE enterprise_integrations
      SET status = 'inactive', deactivated_at = NOW()
      WHERE integration_id = $1
      RETURNING integration_id, status
    `;

    let result = await db.query(query, [integrationId]);
    
    // Remove from active integrations
    this.activeIntegrations.delete(integrationId);

    return {
      success: true,
      data: {
        integrationId: result.rows[0].integration_id,
        status: result.rows[0].status,
        deactivatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get integration health status
   */
  async getIntegrationHealth(integrationId) {
    let integration = await this.getIntegration(integrationId);
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found',
        integrationId
      };
    }

    const healthCheck = await this.testConnection(
      integration.endpoint_url,
      this.decryptApiKey(integration.api_key)
    );

    // Get recent sync activity
    const syncActivity = await this.getRecentSyncActivity(integrationId);

    return {
      success: true,
      data: {
        integrationId,
        integrationType: integration.integration_type,
        connectionStatus: healthCheck.success ? 'healthy' : 'unhealthy',
        lastTested: integration.last_tested,
        recentSyncActivity: syncActivity,
        activeSince: integration.created_at
      }
    };
  }

  /**
   * Get recent sync activity
   */
  async getRecentSyncActivity(integrationId) {
    let query = `
      SELECT sync_type, data_type, sync_direction,
             records_processed, status, created_at
      FROM integration_sync_logs
      WHERE integration_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

    let result = await db.query(query, [integrationId]);
    return result.rows;
  }

  /**
   * Get active integrations count
   */
  getActiveIntegrationsCount() {
    return this.activeIntegrations.size;
  }

  /**
   * Clear integration cache
   */
  clearCache() {
    this.integrationCache.clear();
    return { success: true, message: 'Integration cache cleared' };
  }
}

module.exports = new EnterpriseIntegrationService();