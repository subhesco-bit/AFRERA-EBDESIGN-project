'use strict';

const {
  buildAssessment,
  detectRedFlags,
  detectContraindications,
} = require('./clinicalNutritionDecisionSupportService');

describe('clinical nutrition decision support safety boundary', () => {
  test('urgent symptoms escalate and never become a nutrition recommendation', () => {
    const assessment = buildAssessment({ symptoms: 'chest pain and shortness of breath' });

    expect(assessment.status).toBe('urgent_escalation');
    expect(assessment.red_flags).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'chest_pain' }),
    ]));
    expect(assessment.requires_clinician_approval).toBe(true);
    expect(assessment.safety_constraints.join(' ')).toMatch(/does not diagnose/i);
  });

  test('high-risk conditions produce clinician-review constraints', () => {
    const assessment = buildAssessment({ conditions: 'kidney disease', medications: 'warfarin' });

    expect(assessment.status).toBe('needs_clinician_review');
    expect(detectContraindications({ conditions: 'kidney disease', medications: 'warfarin' })).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'kidney_disease' }),
      expect.objectContaining({ key: 'anticoagulant' }),
    ]));
    expect(assessment.claude_draft).toBeUndefined();
  });

  test('ordinary nutrition context remains explicitly non-autonomous', () => {
    const assessment = buildAssessment({ age: 35, goals: 'improve meal quality' });

    expect(assessment.status).toBe('needs_clinician_review');
    expect(assessment.red_flags).toEqual([]);
    expect(assessment.requires_clinician_approval).toBe(true);
    expect(assessment.disclaimer).toMatch(/not medical advice/i);
  });

  test('input validation rejects unsafe age values', () => {
    expect(() => buildAssessment({ age: 121 })).toThrow(/age must be/i);
    expect(() => buildAssessment(null)).toThrow(/structured patient context/i);
  });
});
