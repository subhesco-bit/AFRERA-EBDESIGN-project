'use strict';
class DoubleEntryPosting {
  constructor(coa) {
    this.coa = coa;
    this.entries = [];
  }
  post(debitCode, creditCode, amount, description) {
    if (Math.abs(amount) < 0.01) throw new Error('Amount must be non-zero');
    const debitBefore = this.coa.getBalance(debitCode);
    const creditBefore = this.coa.getBalance(creditCode);
    this.coa.postEntry(debitCode, amount, 'debit');
    this.coa.postEntry(creditCode, amount, 'credit');
    const entry = {id: `JE-${Date.now()}`, debitCode, creditCode, amount, description, timestamp: new Date(), debitBefore, creditBefore};
    this.entries.push(entry);
    return entry;
  }
  getJournalEntries(code, limit = 50) {
    return this.entries.filter(e => e.debitCode === code || e.creditCode === code).slice(-limit);
  }
  validateBalance() {
    const balance = this.coa.trialBalance();
    return {balanced: balance.balanced, debits: balance.debits, credits: balance.credits};
  }
}
module.exports = { DoubleEntryPosting };
