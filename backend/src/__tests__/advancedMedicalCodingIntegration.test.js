'use strict';

const { advancedMedicalCodingService } = require('../services/advancedMedicalCodingService');

describe('advanced medical coding integration', () => {
  test('returns a safe, review-only result when AI is disabled', async () => {
    const result = await advancedMedicalCodingService.aiMedicalCodingAssistance(
      'Clinician documents right wrist pain after a farm equipment incident.',
      'ICD-10-CM',
      { useAI: false },
    );
    expect(result.human_review_required).toBe(true);
    expect(result.auto_submission_allowed).toBe(false);
    expect(result.suggested_codes).toEqual([]);
  });

  test('rejects empty clinical documentation', async () => {
    await expect(advancedMedicalCodingService.aiMedicalCodingAssistance('', 'ICD-10-CM', { useAI: false })).rejects.toThrow('Clinical documentation is required');
  });
});
