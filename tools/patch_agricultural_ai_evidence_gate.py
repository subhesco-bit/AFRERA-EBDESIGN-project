from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\agriculture\agriculturalIntelligenceService.js')
t=p.read_text(encoding='utf-8')
start=t.index('  generateYieldRecommendations(prediction) {')
end=t.index('  /**\n   * Health check', start)
new=r'''  generateYieldRecommendations(prediction) {
    if (!prediction || prediction.implemented !== true) return [];
    return Array.isArray(prediction.recommendations) ? prediction.recommendations : [];
  }

  /**
   * Pass through only validated, engine-supplied fertilizer recommendations.
   * No generic dosage or product is invented here.
   */
  generateFertilizerRecommendations(analysis) {
    if (!analysis || analysis.implemented !== true) return [];
    return Array.isArray(analysis.fertilizer_recommendations) ? analysis.fertilizer_recommendations : [];
  }

  /**
   * Pass through only validated, engine-supplied irrigation recommendations.
   */
  generateIrrigationRecommendations(analysis) {
    if (!analysis || analysis.implemented !== true) return [];
    return Array.isArray(analysis.irrigation_recommendations) ? analysis.irrigation_recommendations : [];
  }

  async generateWeatherAdvisory(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) {
      return {
        status: 'unavailable',
        level: null,
        actions: [],
        alerts: [],
        reason: weatherPrediction?.reason || 'No validated weather intelligence engine is connected.',
        requiresQualifiedReview: true,
      };
    }
    return weatherPrediction.advisory || {
      status: 'engine_output_missing_advisory',
      level: null,
      actions: [],
      alerts: [],
      requiresQualifiedReview: true,
    };
  }

  assessWeatherRisks(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) {
      return { overall: null, factors: [], status: 'unavailable', requiresQualifiedReview: true };
    }
    return weatherPrediction.risk_assessment || {
      overall: null, factors: [], status: 'engine_output_missing_risk_assessment', requiresQualifiedReview: true,
    };
  }

  generateWeatherRecommendations(weatherPrediction) {
    if (!weatherPrediction || weatherPrediction.implemented !== true) return [];
    return Array.isArray(weatherPrediction.recommendations) ? weatherPrediction.recommendations : [];
  }

  generatePestPreventiveMeasures(prediction) {
    if (!prediction || prediction.implemented !== true) return [];
    return Array.isArray(prediction.preventive_measures) ? prediction.preventive_measures : [];
  }

  generatePestTreatmentRecommendations(prediction) {
    if (!prediction || prediction.implemented !== true) {
      return {
        status: 'unavailable',
        chemical: null,
        biological: null,
        cultural: null,
        requiresQualifiedReview: true,
      };
    }
    return prediction.treatment_recommendations || {
      status: 'engine_output_missing_treatment_recommendations',
      chemical: null, biological: null, cultural: null, requiresQualifiedReview: true,
    };
  }

  generatePestMonitoringProtocol(prediction) {
    if (!prediction || prediction.implemented !== true) {
      return {
        status: 'unavailable',
        frequency: null, methods: [], threshold_levels: null, reporting: null, requiresQualifiedReview: true,
      };
    }
    return prediction.monitoring_protocol || {
      status: 'engine_output_missing_monitoring_protocol',
      frequency: null, methods: [], threshold_levels: null, reporting: null, requiresQualifiedReview: true,
    };
  }

'''
t=t[:start]+new+t[end:]
t=t.replace("status: aiHealth.status === 'healthy' && analyticsHealth.status === 'healthy' ? 'healthy' : 'degraded',","status: ['healthy','configured'].includes(aiHealth.status) && analyticsHealth.status === 'healthy' ? 'healthy' : 'degraded',")
p.write_text(t,encoding='utf-8')
print('agricultural AI canned recommendations removed')