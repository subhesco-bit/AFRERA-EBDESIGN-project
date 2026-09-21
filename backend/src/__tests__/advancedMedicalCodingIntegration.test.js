'use strict';

const { advancedMedicalCodingService } = require('../services/advancedMedicalCodingService');

describe('advanced medical coding integration', () => {
  test('returns a safe, review-only result when AI is disabled', async () => {
    const result = await advancedMedicalCodingService.aiMedicalCodingAssistance(
      'Dietitian documents a nutrition assessment and medical nutrition therapy plan.',
      'ICD-10-CM',
      { useAI: false, careContext: 'dietitian' },
    );
    expect(result.human_review_required).toBe(true);
    expect(result.auto_submission_allowed).toBe(false);
    expect(result.suggested_codes).toEqual([]);
    expect(result.care_context).toBe('dietitian');
  });

  test('rejects empty clinical documentation', async () => {
    await expect(advancedMedicalCodingService.aiMedicalCodingAssistance('', 'ICD-10-CM', { useAI: false })).rejects.toThrow('Clinical documentation is required');
  });
});
