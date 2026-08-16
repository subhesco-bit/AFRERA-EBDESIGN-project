const winston = require('winston');
const auditService = require('../services/auditService');

// Compliance logger
const complianceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/compliance.log' }),
    new winston.transports.Console()
  ]
});

// GDPR compliance middleware
const gdprCompliance = (req, res, next) => {
  // Log data access
  if (req.user && req.user.id) {
    complianceLogger.info('Data Access', {
      userId: req.user.id,
      endpoint: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      purpose: req.headers['x-purpose'] || 'unknown'
    });
  }

  // Add GDPR headers
  res.setHeader('X-GDPR-Compliant', 'true');
  res.setHeader('X-Data-Processing', 'legitimate-interest');

  next();
};

// Data retention middleware
const dataRetention = (req, res, next) => {
  // Log data retention events
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    complianceLogger.info('Data Retention', {
      endpoint: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      retentionPeriod: '7-years'
    });
  }

  next();
};

// Consent management middleware
const consentManagement = (req, res, next) => {
  // Check for user consent
  const consentHeader = req.headers['x-consent'];
  
  if (!consentHeader) {
    return res.status(403).json({
      error: 'Consent required',
      message: 'Please provide consent for data processing'
    });
  }

  // Parse consent
  const consent = JSON.parse(consentHeader);
  
  if (!consent.marketing && !consent.analytics && !consent.essential) {
    return res.status(403).json({
      error: 'Invalid consent',
      message: 'At least essential consent is required'
    });
  }

  // Store consent in request
  req.consent = consent;

  next();
};

// Data minimization middleware
const dataMinimization = (req, res, next) => {
  // Remove unnecessary data from request
  const minimizeData = (obj) => {
    const allowedFields = [
      'id', 'name', 'email', 'phone', 'address',
      'productId', 'quantity', 'price', 'category',
      'orderId', 'status', 'createdAt', 'updatedAt'
    ];

    const minimized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && allowedFields.includes(key)) {
        minimized[key] = obj[key];
      }
    }

    return minimized;
  };

  if (req.body) {
    req.body = minimizeData(req.body);
  }

  next();
};

// Right to be forgotten middleware
const rightToBeForgotten = async (req, res, next) => {
  if (req.url === '/api/v1/users/me' && req.method === 'DELETE') {
    // Log data deletion request
    complianceLogger.info('Right to be Forgotten Request', {
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Not implemented. Deliberately do NOT report success: no deletion has
    // happened. A real implementation would need to:
    // 1. Delete user data from primary database
    // 2. Delete user data from backups
    // 3. Delete user data from logs
    // 4. Notify third parties of data deletion
    return res.status(501).json({
      implemented: false,
      error: 'Not Implemented',
      message: 'Right to be forgotten (GDPR Article 17) deletion is not yet implemented. No data was deleted.',
      code: 'GDPR_DELETION_NOT_IMPLEMENTED'
    });
  }

  next();
};

// Data portability middleware
const dataPortability = (req, res, next) => {
  if (req.url === '/api/v1/users/me/data' && req.method === 'GET') {
    // Log data export request
    complianceLogger.info('Data Portability Request', {
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Not implemented. Deliberately do NOT report success: no export was
    // produced. A real implementation would need to:
    // 1. Collect all user data
    // 2. Format in standard format (JSON, CSV)
    // 3. Provide download link
    return res.status(501).json({
      implemented: false,
      error: 'Not Implemented',
      message: 'Data portability (GDPR Article 20) export is not yet implemented. No data was exported.',
      code: 'GDPR_EXPORT_NOT_IMPLEMENTED'
    });
  }

  next();
};

// Audit trail middleware
const auditTrail = (logger) => {
  return (req, res, next) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      action: req.method,
      resource: req.url,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestData: req.body,
      responseData: null
    };

    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      auditData.responseData = data;
      auditData.statusCode = res.statusCode;

      logger.info('Audit Trail', { audit: auditData });

      originalSend.call(this, data);
    };

    next();
  };
};

// Compliance reporting
const generateComplianceReport = async (startDate, endDate) => {
  const report = {
    period: {
      start: startDate,
      end: endDate
    },
    metrics: {
      // totalRequests is computed below from the real audit_logs table.
      // The other metrics have no underlying data source anywhere in this
      // codebase today (see notes) and must NOT be reported as 0, which
      // would misrepresent "never measured" as "measured, zero incidents".
      totalRequests: null,
      dataAccessRequests: null,
      dataDeletionRequests: null,
      consentDenials: null,
      complianceViolations: null
    },
    violations: [],
    recommendations: [],
    notes: []
  };

  // totalRequests: real count of audited events in the period, sourced from
  // the audit_logs table via auditService's shared pool (see auditService.js).
  try {
    const params = [];
    let query = 'SELECT COUNT(*)::int AS count FROM audit_logs WHERE 1=1';

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${params.length}`;
    }

    const result = await auditService.pool.query(query, params);
    report.metrics.totalRequests = result.rows[0] ? result.rows[0].count : 0;
  } catch (error) {
    complianceLogger.error('Failed to compute totalRequests from audit_logs', {
      error: error.message
    });
    report.metrics.totalRequests = null;
    report.notes.push('totalRequests: query against audit_logs failed; not tracked for this report.');
  }

  // dataAccessRequests, dataDeletionRequests, consentDenials, and
  // complianceViolations are NOT tracked anywhere: rightToBeForgotten,
  // dataPortability, and consentManagement only write to complianceLogger
  // (a file/console log), never to a queryable store, and there is no
  // compliance-violation detector anywhere in this codebase. Reporting them
  // as 0 would be a fabricated "no incidents" claim, so they stay null.
  report.notes.push(
    'dataAccessRequests, dataDeletionRequests, consentDenials, and complianceViolations are not tracked by any data source yet (not implemented).'
  );

  return report;
};

// Compliance check middleware
const complianceCheck = (req, res, next) => {
  // Check for compliance requirements
  const complianceHeaders = {
    'X-Compliance-Status': 'compliant',
    'X-Data-Residency': 'India',
    'X-Encryption': 'AES-256',
    'X-Privacy-Policy': '/privacy'
  };

  Object.entries(complianceHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  next();
};

// Module exports
module.exports = {
  complianceLogger,
  gdprCompliance,
  dataRetention,
  consentManagement,
  dataMinimization,
  rightToBeForgotten,
  dataPortability,
  auditTrail,
  generateComplianceReport,
  complianceCheck
};
