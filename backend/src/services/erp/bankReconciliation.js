'use strict';
class BankReconciliation {
  constructor() {
    this.bankStatement = []; this.reconciled = [];
  }
  importBankStatement(statement) {
    this.bankStatement = statement.map(s => ({...s, reconciled: false}));
    return {imported: statement.length, timestamp: new Date()};
  }
  reconcileTransaction(bankStatementId, glEntryId) {
    const stmt = this.bankStatement.find(s => s.id === bankStatementId);
    if (stmt) {
      stmt.reconciled = true;
      this.reconciled.push({bankId: bankStatementId, glId: glEntryId, date: new Date()});
    }
  }
  getUnreconciled() {
    return this.bankStatement.filter(s => !s.reconciled);
  }
  getReconciliationStatus() {
    const total = this.bankStatement.length;
    const recon = this.bankStatement.filter(s => s.reconciled).length;
    return {total, reconciled: recon, outstanding: total - recon, rate: total > 0 ? (recon / total) * 100 : 0};
  }
}
module.exports = { BankReconciliation };
