/**
 * GDPR Routes - GDPR Compliance API Endpoints
 */

const express = require('express.js');
const router = express.Router();
const gdprService = require('../../services/dual-use/gdprService.js');
const { authMiddleware } = require('../../middleware/auth.js');
const { adminMiddleware } = require('../../middleware/admin.js');

/**
 * POST /api/v1/privacy/consent
 * Record user consent
 */
router.post('/consent', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { consentType, consentGiven } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    
    const consentRecord = await gdprService.recordConsent(
      userId,
      consentType,
      consentGiven,
      ipAddress,
      userAgent
    );
    
    res.json({
      success: true,
      data: consentRecord,
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Consent recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record consent'
    });
  }
});

/**
 * GET /api/v1/privacy/consent/:userId
 * Get user consent status
 */
router.get('/consent/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user has permission to view this consent
    if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }
    
    const consentData = await gdprService.getUserConsent(userId);
    
    res.json({
      success: true,
      data: consentData
    });
  } catch (error) {
    console.error('Get consent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get consent data'
    });
  }
});

/**
 * POST /api/v1/privacy/rtbf
 * Right to be Forgotten - Anonymize user data
 */
router.post('/rtbf', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { reason } = req.body;
    const requestId = `RTBF-${Date.now()}-${userId}`;
    
    const result = await gdprService.rightToBeForgotten(userId, reason, requestId);
    
    res.json(result);
  } catch (error) {
    console.error('Right to be forgotten error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process right to be forgotten'
    });
  }
});

/**
 * GET /api/v1/privacy/export/:userId
 * Data Portability - Export user data
 */
router.get('/export/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;
    
    // Check if user has permission to export this data
    if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }
    
    const exportData = await gdprService.exportUserData(userId, format);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=user_data_${userId}.json`);
      res.send(exportData);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user_data_${userId}.csv`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data'
    });
  }
});

/**
 * GET /api/v1/privacy/data-residency/:userId
 * Check data residency compliance
 */
router.get('/data-residency/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { dataRegion = 'IN' } = req.query; // Default to India
    
    const complianceCheck = await gdprService.checkDataResidency(userId, dataRegion);
    
    res.json({
      success: true,
      data: complianceCheck
    });
  } catch (error) {
    console.error('Data residency check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check data residency'
    });
  }
});

/**
 * POST /api/v1/privacy/privacy-impact-assessment
 * Conduct Privacy Impact Assessment
 */
router.post('/privacy-impact-assessment', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { systemComponent, dataTypes, processingPurpose } = req.body;
    
    const assessment = await gdprService.conductPrivacyImpactAssessment(
      systemComponent,
      dataTypes,
      processingPurpose
    );
    
    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Privacy impact assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to conduct privacy impact assessment'
    });
  }
});

/**
 * GET /api/v1/privacy/policy
 * Get privacy policy
 */
router.get('/policy', async (req, res) => {
  try {
    const privacyPolicy = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      principles: [
        'Lawfulness, fairness, and transparency',
        'Purpose limitation',
        'Data minimization',
        'Accuracy',
        'Storage limitation',
        'Integrity and confidentiality',
        'Accountability'
      ],
      userRights: [
        'Right to be informed',
        'Right of access',
        'Right to rectification',
        'Right to erasure (right to be forgotten)',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object'
      ],
      dataRetention: {
        'personalData': '5 years after account closure',
        'transactionData': '7 years for legal compliance',
        'analyticsData': '2 years'
      },
      contact: {
        'email': 'privacy@afrera.com',
        'address': 'AFRERA Privacy Office, Assam, India'
      }
    };
    
    res.json({
      success: true,
      data: privacyPolicy
    });
  } catch (error) {
    console.error('Get privacy policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy policy'
    });
  }
});

module.exports = router;
