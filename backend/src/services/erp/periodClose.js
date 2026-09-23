'use strict';
class PeriodClose {
  constructor(coa) {
    this.coa = coa;
    this.closedPeriods = [];
  }
  closePeriod(periodName) {
    const balance = this.coa.trialBalance();
    if (!balance.balanced) throw new Error('Trial balance not balanced');
    const close = {period: periodName, closedAt: new Date(), trialBalance: balance, status: 'closed'};
    this.closedPeriods.push(close);
    return close;
  }
  generateTrialBalance() {
    return {advisory: true, ...this.coa.trialBalance(), timestamp: new Date()};
  }
  generatePL(revenues, expenses) {
    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {revenues: totalRevenue, expenses: totalExpense, netIncome: totalRevenue - totalExpense};
  }
  generateBalanceSheet(assets, liabilities, equity) {
    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiab = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const totalEq = equity.reduce((sum, e) => sum + e.amount, 0);
    return {assets: totalAssets, liabilities: totalLiab, equity: totalEq, balanced: Math.abs(totalAssets - (totalLiab + totalEq)) < 0.01};
  }
}
module.exports = { PeriodClose };
