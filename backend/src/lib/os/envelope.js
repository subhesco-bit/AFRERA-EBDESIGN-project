'use strict';
/** Every AI output carries evidence. A wrapper is not production AI.
 * Ported from pine-shadow src/lib/os/envelope.ts */

function envelopeFor(input) {
  return {
    inputProvenance: `books.${input.organ}`,
    citations: input.citations ?? ['L8 AI rupeeWrite forbidden', 'L9 human command'],
    model: 'library-first',
    policy: 'firewall',
    confidence: 'calculated',
    assumptions: 'Declared kg/₹ only. Absent stays absent.',
    explanation: input.body,
    actionBoundary: 'propose only — clerk writes',
    humanApproval: 'required',
    outcome: 'pending clerk',
    feedback: 'none until a write',
  };
}

function envelopeInventedRupee(env) {
  return /invent/i.test(env.explanation) || env.actionBoundary.includes('write rupee');
}

module.exports = { envelopeFor, envelopeInventedRupee };
