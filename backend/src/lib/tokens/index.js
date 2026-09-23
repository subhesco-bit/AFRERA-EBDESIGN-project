'use strict';
const EventEmitter = require('events');

class TokenEconomy extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.ledger = new Map();
    this.balances = new Map();
    this.transactions = [];
    this.config = { ...opts };
  }

  mint(accountId, amount, reason = 'mint') {
    if (amount <= 0) throw new Error('Amount must be positive');

    const txn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'MINT',
      accountId,
      amount,
      reason,
      timestamp: new Date(),
      balance: (this.balances.get(accountId) || 0) + amount
    };

    const current = this.balances.get(accountId) || 0;
    this.balances.set(accountId, current + amount);
    this.transactions.push(txn);
    this.emit('mint', txn);
    return txn;
  }

  burn(accountId, amount, reason = 'burn') {
    if (amount <= 0) throw new Error('Amount must be positive');
    const current = this.balances.get(accountId) || 0;
    if (current < amount) throw new Error('Insufficient balance');

    const txn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'BURN',
      accountId,
      amount,
      reason,
      timestamp: new Date(),
      balance: current - amount
    };

    this.balances.set(accountId, current - amount);
    this.transactions.push(txn);
    this.emit('burn', txn);
    return txn;
  }

  transfer(fromId, toId, amount, reason = 'transfer') {
    if (amount <= 0) throw new Error('Amount must be positive');
    const fromBal = this.balances.get(fromId) || 0;
    if (fromBal < amount) throw new Error('Insufficient balance');

    const txn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'TRANSFER',
      from: fromId,
      to: toId,
      amount,
      reason,
      timestamp: new Date()
    };

    this.balances.set(fromId, fromBal - amount);
    this.balances.set(toId, (this.balances.get(toId) || 0) + amount);
    this.transactions.push(txn);
    this.emit('transfer', txn);
    return txn;
  }

  getBalance(accountId) {
    return this.balances.get(accountId) || 0;
  }

  getTransactionHistory(accountId) {
    return this.transactions.filter(t =>
      t.accountId === accountId || t.from === accountId || t.to === accountId
    );
  }

  getSupply() {
    let total = 0;
    for (const bal of this.balances.values()) {
      total += bal;
    }
    return total;
  }

  getDistribution() {
    const dist = {};
    for (const [id, bal] of this.balances) {
      dist[id] = bal;
    }
    return dist;
  }
}

module.exports = { TokenEconomy };
