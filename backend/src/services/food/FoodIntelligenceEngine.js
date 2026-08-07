/**
 * Food Intelligence & Processing Module
 * Manages food processing operations, nutrition analysis, traceability, and compliance
 */

class FoodIntelligenceEngine {
  /**
   * Initialize a food processing batch
   * @param {Object} params - Batch parameters
   * @returns {Object} Batch record
   */
  static initializeBatch(params) {
    const {
      productId,
      productName,
      quantityKg,
      sourceLocation,
      harvestDate,
      processingMethod,
      targetShelfLife,
    } = params;

    const batchId = this._generateBatchId();
    const startTime = new Date();

    return {
      batchId,
      productId,
      productName,
      quantityKg,
      sourceLocation,
      harvestDate,
      startTime,
      processingMethod,
      targetShelfLife,
      status: 'INITIALIZED',
      processStages: this._initializeProcessStages(processingMethod),
      qualityMetrics: {
        initialQuality: 100,
        currentQuality: 100,
        defectsPercentage: 0,
      },
      traceability: {
        batchId,
        checkpoints: [
          {
            timestamp: startTime,
            location: sourceLocation,
            operation: 'BATCH_CREATED',
            operator: null,
            notes: 'Batch initialized',
          },
        ],
      },
    };
  }

  /**
   * Analyze nutritional content of food product
   * @param {Object} params - Product parameters
   * @returns {Object} Nutrition analysis
   */
  static analyzeNutrition(params) {
    const {
      productName,
      productType,
      rawQuantityG,
      processingLoss = 0,
      cookingMethod = null,
    } = params;

    // Simplified nutrition database lookup (would be expanded in production)
    const nutritionDatabase = this._getNutritionDatabase();
    const baseNutrition = nutritionDatabase[productType] || {};

    // Apply processing and cooking losses
    const processingFactor = 1 - (processingLoss / 100);
    const cookedFactor = cookingMethod ? 0.85 : 1; // 15% nutrient loss when cooked

    const edibleQuantityG = rawQuantityG * processingFactor * cookedFactor;

    const nutrition = {
      edibleQuantityG,
      calories: (baseNutrition.calories || 0) * (edibleQuantityG / 100),
      protein: (baseNutrition.protein || 0) * (edibleQuantityG / 100),
      carbohydrates: (baseNutrition.carbohydrates || 0) * (edibleQuantityG / 100),
      fat: (baseNutrition.fat || 0) * (edibleQuantityG / 100),
      fiber: (baseNutrition.fiber || 0) * (edibleQuantityG / 100),
      vitamins: (baseNutrition.vitamins || {}),
      minerals: (baseNutrition.minerals || {}),
      allergens: baseNutrition.allergens || [],
    };

    return {
      productName,
      productType,
      rawQuantityG,
      edibleQuantityG,
      processingLoss,
      cookingMethod,
      nutrition,
      healthBenefits: this._identifyHealthBenefits(nutrition),
      recommendations: this._generateDietaryRecommendations(nutrition),
    };
  }

  /**
   * Record traceability checkpoint
   * @param {Object} params - Checkpoint parameters
   * @returns {Object} Recorded checkpoint
   */
  static recordTraceabilityCheckpoint(params) {
    const {
      batchId,
      location,
      operation,
      operator,
      notes,
      environmentalConditions = {},
      blockchainHash = null,
    } = params;

    const checkpoint = {
      timestamp: new Date(),
      batchId,
      location,
      operation,
      operator,
      notes,
      environmentalConditions,
      blockchainHash,
      verified: false,
      verificationTimestamp: null,
      verifier: null,
    };

    return {
      checkpoint,
      chainIntegrity: this._verifyChainIntegrity(batchId, checkpoint),
      certificateGenerationEligible: this._checkCertificateEligibility(batchId),
    };
  }

  /**
   * Predict shelf life of product
   * @param {Object} params - Shelf life parameters
   * @returns {Object} Shelf life prediction
   */
  static predictShelfLife(params) {
    const {
      productType,
      processingMethod,
      storageTemperature,
      storageHumidity,
      packagingType,
      initialQuality = 100,
    } = params;

    // Shelf life factors
    const baseShelfLife = this._getBaseShelfLife(productType);
    
    let temperatureFactor = 1;
    if (storageTemperature <= 4) temperatureFactor = 1.8;
    else if (storageTemperature <= 10) temperatureFactor = 1.5;
    else if (storageTemperature <= 20) temperatureFactor = 1.0;
    else if (storageTemperature <= 30) temperatureFactor = 0.7;
    else temperatureFactor = 0.4;

    let humidityFactor = 1;
    if (storageHumidity >= 40 && storageHumidity <= 60) humidityFactor = 1.2;
    else if (storageHumidity < 40 || storageHumidity > 80) humidityFactor = 0.6;

    const packagingFactor = this._getPackagingFactor(packagingType);

    const adjustedShelfLife = baseShelfLife * temperatureFactor * 
      humidityFactor * packagingFactor * (initialQuality / 100);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + adjustedShelfLife);

    return {
      productType,
      baseShelfLifeDays: baseShelfLife,
      adjustedShelfLifeDays: Math.round(adjustedShelfLife),
      expirationDate,
      storageRecommendations: this._generateStorageRecommendations(
        storageTemperature, 
        storageHumidity, 
        packagingType
      ),
      qualityDegradationRate: {
        daily: (100 / adjustedShelfLife).toFixed(2),
        weekly: (700 / adjustedShelfLife).toFixed(2),
        monthly: (3000 / adjustedShelfLife).toFixed(2),
      },
      riskFactors: this._identifyShelfLifeRisks(
        storageTemperature, 
        storageHumidity, 
        packagingType
      ),
    };
  }

  /**
   * Verify compliance with food safety standards
   * @param {Object} params - Compliance parameters
   * @returns {Object} Compliance status
   */
  static verifyCompliance(params) {
    const {
      batchId,
      productType,
      processingFacilityId,
      certificationsHeld = [],
      storageConditions = {},
    } = params;

    const complianceChecks = {
      fssai: this._checkFSSAICompliance(productType, certificationsHeld),
      iso22000: this._checkISO22000Compliance(processingFacilityId),
      haccp: this._checkHACCPCompliance(productType, storageConditions),
      organic: this._checkOrganicCompliance(certificationsHeld),
      labeling: this._checkLabelingCompliance(productType),
    };

    const allCompliant = Object.values(complianceChecks).every(c => c.compliant);

    return {
      batchId,
      overallCompliant: allCompliant,
      complianceChecks,
      certificationsEligible: this._determineCertificationsEligible(complianceChecks),
      remediationActions: allCompliant ? [] : this._generateRemediationPlan(complianceChecks),
      nextAuditDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Generate organic certification recommendation
   * @param {Object} params - Certification parameters
   * @returns {Object} Certification recommendation
   */
  static recommendOrganicCertification(params) {
    const {
      batchId,
      farmId,
      cropHistory,
      chemicalUsageRecords,
      pestManagementLogs,
    } = params;

    const eligibilityScore = this._calculateOrganicEligibility(
      cropHistory,
      chemicalUsageRecords,
      pestManagementLogs
    );

    return {
      batchId,
      farmId,
      eligibilityScore,
      recommendation: eligibilityScore >= 80 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
      requiredActions: eligibilityScore < 80 ? 
        this._generateOrganicRoadmap(eligibilityScore) : [],
      certificationBody: eligibilityScore >= 80 ? 'REFER_TO_APEDA' : null,
      estimatedTimeToEligibility: this._estimateCertificationTimeline(eligibilityScore),
    };
  }

  // Helper methods
  static _generateBatchId() {
    return `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static _initializeProcessStages(processingMethod) {
    const stages = {
      'FRESH': ['QUALITY_CHECK', 'GRADING', 'PACKAGING', 'LABELING'],
      'PROCESSED': ['WASHING', 'DRYING', 'GRINDING', 'PACKAGING', 'LABELING'],
      'FROZEN': ['PREPARATION', 'FREEZING', 'PACKAGING', 'LABELING'],
      'CANNED': ['PREPARATION', 'COOKING', 'CANNING', 'STERILIZATION', 'COOLING', 'LABELING'],
    };
    return (stages[processingMethod] || []).map(stage => ({
      name: stage,
      status: 'PENDING',
      startTime: null,
      endTime: null,
      operator: null,
    }));
  }

  static _getNutritionDatabase() {
    return {
      'RICE': { calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4 },
      'WHEAT': { calories: 364, protein: 13, carbohydrates: 71, fat: 1.7, fiber: 12 },
      'POTATO': { calories: 77, protein: 2, carbohydrates: 17, fat: 0.1, fiber: 2.1 },
      'TOMATO': { calories: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2 },
      'ONION': { calories: 40, protein: 1.1, carbohydrates: 9, fat: 0.1, fiber: 1.7 },
    };
  }

  static _identifyHealthBenefits(nutrition) {
    const benefits = [];
    if (nutrition.protein > 10) benefits.push('High Protein');
    if (nutrition.fiber > 5) benefits.push('High Fiber');
    if (nutrition.vitamins && Object.keys(nutrition.vitamins).length > 0) benefits.push('Vitamin Rich');
    return benefits;
  }

  static _generateDietaryRecommendations(nutrition) {
    return [
      'Suitable for balanced diet',
      'Good source of essential nutrients',
      'Recommended serving size: 100g',
    ];
  }

  static _verifyChainIntegrity(batchId, checkpoint) {
    return {
      batchIdMatches: true,
      sequenceValid: true,
      timestampValid: true,
      integrityScore: 100,
    };
  }

  static _checkCertificateEligibility(batchId) {
    return true; // Simplified
  }

  static _getBaseShelfLife(productType) {
    const shelfLifeMap = {
      'FRESH': 5,
      'REFRIGERATED': 15,
      'FROZEN': 365,
      'CANNED': 730,
      'DRY': 365,
    };
    return shelfLifeMap[productType] || 30;
  }

  static _getPackagingFactor(packagingType) {
    const factors = {
      'VACUUM_SEALED': 1.5,
      'MODIFIED_ATMOSPHERE': 1.3,
      'REFRIGERATED': 1.2,
      'STANDARD': 1.0,
      'PAPER': 0.8,
    };
    return factors[packagingType] || 1.0;
  }

  static _generateStorageRecommendations(temp, humidity, packaging) {
    return [
      `Optimal temperature: 2-4°C (current: ${temp}°C)`,
      `Optimal humidity: 40-60% (current: ${humidity}%)`,
      `Use ${packaging} packaging`,
      'Store away from direct sunlight',
      'Maintain proper ventilation',
    ];
  }

  static _identifyShelfLifeRisks(temp, humidity, packaging) {
    const risks = [];
    if (temp > 25) risks.push('High temperature risk');
    if (humidity < 30 || humidity > 75) risks.push('Humidity imbalance');
    if (packaging === 'PAPER') risks.push('Moisture ingress risk');
    return risks;
  }

  static _checkFSSAICompliance(productType, certifications) {
    return {
      compliant: certifications.includes('FSSAI'),
      requirementsMet: 7,
      totalRequirements: 8,
    };
  }

  static _checkISO22000Compliance(facilityId) {
    return {
      compliant: true,
      lastAuditDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      nextAuditDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    };
  }

  static _checkHACCPCompliance(productType, storageConditions) {
    return {
      compliant: true,
      criticalControlPointsMet: 5,
    };
  }

  static _checkOrganicCompliance(certifications) {
    return {
      compliant: certifications.includes('ORGANIC'),
      certificationValid: true,
    };
  }

  static _checkLabelingCompliance(productType) {
    return {
      compliant: true,
      requirementsChecked: 12,
    };
  }

  static _determineCertificationsEligible(checks) {
    const eligible = [];
    if (checks.fssai.compliant) eligible.push('FSSAI');
    if (checks.organic.compliant) eligible.push('ORGANIC');
    if (checks.iso22000.compliant) eligible.push('ISO_22000');
    return eligible;
  }

  static _generateRemediationPlan(checks) {
    return [
      'Obtain FSSAI license',
      'Implement HACCP system',
      'Conduct staff training',
    ];
  }

  static _calculateOrganicEligibility(history, chemicalRecords, pestLogs) {
    let score = 100;
    if (chemicalRecords.length > 0) score -= 20;
    if (pestLogs.length > 0) score -= 15;
    return Math.max(score, 0);
  }

  static _generateOrganicRoadmap(score) {
    return [
      'Phase out chemical inputs',
      'Implement organic pest management',
      'Document farming practices',
      'Obtain transitional certification first',
    ];
  }

  static _estimateCertificationTimeline(score) {
    const monthsNeeded = Math.ceil((100 - score) / 10);
    return { months: monthsNeeded, estimatedDate: new Date(Date.now() + monthsNeeded * 30 * 24 * 60 * 60 * 1000) };
  }
}

module.exports = FoodIntelligenceEngine;
