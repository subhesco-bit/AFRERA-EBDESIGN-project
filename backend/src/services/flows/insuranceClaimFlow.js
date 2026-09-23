'use strict';
const insFlow = {
  id: 'INSURANCE',
  steps: [
    {id: 'claim_submit', name: 'Claim Submission'},
    {id: 'verification', name: 'Document Verification'},
    {id: 'adjudication', name: 'Claims Adjudication'},
    {id: 'settlement', name: 'Settlement & Payout'}
  ]
};
const handlers = {
  claim_submit: async (ctx, cfg) => ({claimId: `CLM-${Date.now()}`, status: 'received', incidentDate: ctx.incidentDate}),
  verification: async (ctx, cfg) => ({verified: true, docsChecked: 5, status: 'verified'}),
  adjudication: async (ctx, cfg) => ({assessedAmount: ctx.claimAmount * 0.9, status: 'assessed', reason: 'Standard assessment'}),
  settlement: async (ctx, cfg) => ({settlementId: `STL-${Date.now()}`, amount: ctx.assessedAmount, status: 'approved'})
};
module.exports = { insFlow, handlers };
