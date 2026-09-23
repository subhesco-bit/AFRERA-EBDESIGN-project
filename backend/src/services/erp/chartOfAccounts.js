'use strict';
class ChartOfAccounts {
  constructor() {
    this.accounts = new Map();
    this.balances = new Map();
  }
  registerAccount(accountCode, account) {
    this.accounts.set(accountCode, {code: accountCode, name: account.name, type: account.type, nature: account.nature, balance: 0, createdAt: new Date()});
    this.balances.set(accountCode, 0);
    return this.accounts.get(accountCode);
  }
  postEntry(accountCode, amount, type) {
    if (!this.accounts.has(accountCode)) throw new Error(`Account ${accountCode} not found`);
    const balance = this.balances.get(accountCode) || 0;
    const account = this.accounts.get(accountCode);
    const newBalance = type === 'debit' ? (account.nature === 'debit' ? balance + amount : balance - amount) : (account.nature === 'credit' ? balance + amount : balance - amount);
    this.balances.set(accountCode, newBalance);
    return {accountCode, type, amount, newBalance};
  }
  getBalance(accountCode) {
    return this.balances.get(accountCode) || 0;
  }
  trialBalance() {
    let debits = 0, credits = 0;
    for (const [code, balance] of this.balances) {
      const account = this.accounts.get(code);
      if (account.nature === 'debit') debits += Math.abs(balance);
      else credits += Math.abs(balance);
    }
    return {debits, credits, balanced: Math.abs(debits - credits) < 0.01};
  }
}
module.exports = { ChartOfAccounts };
