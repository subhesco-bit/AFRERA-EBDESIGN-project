/**
 * Crop disease detection via computer vision (no vision model is currently
 * bundled - see loadComputerVisionModel below). Split out of the former
 * monolithic services/advancedAIService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { ADVANCED_AI_MODELS } = require('./models');

/**
 * Crop Disease Detection using Computer Vision
 */
async function detectCropDisease(imageData, additionalData = {}) {
  try {
    // Load computer vision model
    const cvModel = await loadComputerVisionModel('crop_disease_detection');

    // Preprocess image
    const preprocessedImage = preprocessImage(imageData);

    // Run disease detection
    const detectionResults = await cvModel.detect(preprocessedImage);

    // Get disease information
    const diseaseInfo = await getDiseaseInformation(detectionResults.detected_diseases);

    // Generate treatment recommendations
    const treatmentRecommendations = await generateTreatmentRecommendations(detectionResults, diseaseInfo);

    // Calculate confidence intervals
    const confidenceIntervals = calculateDetectionConfidence(detectionResults);

    logger.info(`Crop disease detection completed: ${detectionResults.primary_disease}`);

    return {
      image_analysis: {
        primary_disease: detectionResults.primary_disease,
        confidence: detectionResults.confidence,
        detected_diseases: detectionResults.detected_diseases,
        affected_areas: detectionResults.affected_areas,
        severity: detectionResults.severity
      },
      disease_information: diseaseInfo,
      treatment_recommendations: treatmentRecommendations,
      confidence_intervals: confidenceIntervals,
      additional_insights: {
        spread_prediction: await predictDiseaseSpread(detectionResults, additionalData),
        economic_impact: await calculateEconomicImpact(detectionResults, additionalData),
        prevention_measures: await generatePreventionMeasures(detectionResults)
      },
      model_info: {
        architecture: ADVANCED_AI_MODELS.crop_disease_detection.architecture,
        model: ADVANCED_AI_MODELS.crop_disease_detection.model,
        version: ADVANCED_AI_MODELS.crop_disease_detection.model_version
      }
    };
  } catch (error) {
    logger.error('Crop disease detection failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// --- computer vision (not yet available) -------------------------------------

async function loadComputerVisionModel() {
  // No vision model is bundled. Return an explicitly unavailable handle rather
  // than a fake classifier, so callers surface "unavailable" not a wrong
  // diagnosis - a wrong crop-disease call has real economic consequences.
  return {
    available: false,
    classify: async () => ({
      available: false,
      note: 'No crop-disease vision model is deployed. Integrate a trained model before relying on this endpoint.'
    })
  };
}

function preprocessImage(imageData) {
  return { received: !!imageData, bytes: imageData?.length ?? 0 };
}

function calculateDetectionConfidence(result) {
  return result?.available === false ? 0 : (result?.confidence ?? 0);
}

async function getDiseaseInformation(label) {
  return { disease: label ?? null, available: false, note: 'No disease knowledge base integrated' };
}

function generateTreatmentRecommendations(label) {
  return label
    ? [{ action: 'consult_agronomist', detail: `Automated identification unavailable for "${label}"; refer to an agronomist.` }]
    : [{ action: 'consult_agronomist', detail: 'Automated crop-disease detection is not available.' }];
}

function predictDiseaseSpread() {
  return { available: false, note: 'Spread modelling requires geospatial outbreak data not yet collected' };
}

function calculateEconomicImpact() {
  return { available: false, note: 'Economic impact modelling requires yield and price baselines not yet collected' };
}

function generatePreventionMeasures() {
  return [
    { measure: 'field_sanitation', detail: 'Remove and destroy infected plant material.' },
    { measure: 'crop_rotation', detail: 'Rotate with a non-host crop next season.' },
    { measure: 'monitoring', detail: 'Scout fields weekly and record observations.' }
  ];
}

module.exports = {
  detectCropDisease,
  loadComputerVisionModel,
  preprocessImage,
  calculateDetectionConfidence,
  getDiseaseInformation,
  generateTreatmentRecommendations,
  predictDiseaseSpread,
  calculateEconomicImpact,
  generatePreventionMeasures
};
