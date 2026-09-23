'use strict';
const loanFlow = {
  id: 'LOAN',
  steps: [
    {id: 'application', name: 'Application Submission'},
    {id: 'appraisal', name: 'Property Appraisal'},
    {id: 'credit_check', name: 'Credit Scoring'},
    {id: 'approval', name: 'Approval Workflow'},
    {id: 'disbursement', name: 'Disbursement'},
    {id: 'repayment_schedule', name: 'Repayment Schedule'}
  ]
};
const handlers = {
  application: async (ctx, cfg) => ({appId: `APP-${Date.now()}`, status: 'received', amount: ctx.amount}),
  appraisal: async (ctx, cfg) => ({appraisedValue: ctx.amount * 0.8, status: 'appraised'}),
  credit_check: async (ctx, cfg) => ({score: ctx.creditScore || 700, tier: ctx.creditScore > 750 ? 'A' : 'B', approved: true}),
  approval: async (ctx, cfg) => ({approved: true, approver: 'Manager', rate: 0.08}),
  disbursement: async (ctx, cfg) => ({disbId: `DISB-${Date.now()}`, amount: ctx.amount, status: 'disbursed'}),
  repayment_schedule: async (ctx, cfg) => ({emi: ctx.amount / 60, months: 60, firstPayment: new Date(Date.now() + 30*24*60*60*1000)})
};
module.exports = { loanFlow, handlers };
