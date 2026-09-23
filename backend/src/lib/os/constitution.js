'use strict';
/** Ethical personalization constitution. Machine-enforced, not a blog post.
 * Ported from pine-shadow src/lib/os/constitution.ts */

const CONSTITUTION = [
  { id: 'E1', law: 'Never infer caste, religion, health, or psychology.', binds: 'profile', status: 'enforced' },
  { id: 'E2', law: 'No dark patterns, fake urgency, or undisclosed targeting.', binds: 'ux', status: 'enforced' },
  { id: 'E3', law: 'AI cannot write rupees. Propose only.', binds: 'rupee', status: 'enforced' },
  { id: 'E4', law: 'Voluntary constraints cannot set price, credit, employment, insurance, or eligibility.', binds: 'fairness', status: 'enforced' },
  { id: 'E5', law: 'Non-personalized mode is the default. Auth is off for visitors.', binds: 'consent', status: 'enforced' },
  { id: 'E6', law: 'Human command before any consequential write.', binds: 'clerk', status: 'enforced' },
  { id: 'E7', law: 'Absent evidence stays absent. Do not fill blanks.', binds: 'passport', status: 'enforced' },
  { id: 'E8', law: 'Assistance is not manipulation. Benefit over addiction.', binds: 'ethic', status: 'enforced' },
  { id: 'E9', law: 'Consent receipts, deletion, purpose binding. Voluntary only.', binds: 'privacy', status: 'enforced' },
];

const SENSITIVE = /caste|religion|faith|health|psycholog|dalit|hindu|muslim|christian|sikh/i;

function evaluateConstitution(input) {
  const violated = [];
  if (input.inferredTrait && SENSITIVE.test(input.inferredTrait)) violated.push('E1');
  if (input.darkPattern) violated.push('E2');
  if (input.rupeeWrite) violated.push('E3');
  if (input.eligibilityFromConstraint) violated.push('E4');
  return { allowed: violated.length === 0, violated };
}

module.exports = { CONSTITUTION, evaluateConstitution };
