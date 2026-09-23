/**
 * Trading Ledger - Buy/Sell Transaction Tracking & Credibility Scoring
 */

'use strict';

class TradingLedger {
  constructor() {
    this.transactions = [];
    this.farmerLedgers = new Map();
    this.buyerLedgers = new Map();
  }

  recordTransaction(transaction) {
    const {type, farmer_id, buyer_id, product, quantity, unit_price, total_value, payment_status, on_time} = transaction;

    const tx = {
      id: `TX-${Date.now()}`,
      type,
      farmer_id,
      buyer_id,
      product,
      quantity,
      unit_price,
      total_value,
      payment_status,
      on_time: on_time !== undefined ? on_time : true,
      timestamp: new Date(),
    };

    this.transactions.push(tx);

    if (type === 'sell') {
      if (!this.farmerLedgers.has(farmer_id)) {
        this.farmerLedgers.set(farmer_id, []);
      }
      this.farmerLedgers.get(farmer_id).push(tx);
    }

    return tx;
  }

  getCredibilityScore(farmer_id) {
    const ledger = this.farmerLedgers.get(farmer_id) || [];

    if (ledger.length === 0) {
      return {
        farmer_id,
        transactions: 0,
        score: 0,
        tier: 'Bronze',
      };
    }

    const totalValue = ledger.reduce((sum, tx) => sum + tx.total_value, 0);
    const completedTx = ledger.filter(tx => tx.payment_status === 'completed').length;
    const onTimeTx = ledger.filter(tx => tx.on_time).length;
    const onTimeRate = (onTimeTx / ledger.length) * 100;

    let score = 50;
    score += Math.min(ledger.length * 2, 20);
    score += onTimeRate > 90 ? 20 : onTimeRate > 70 ? 10 : 0;
    score += (completedTx / ledger.length) * 10;

    let tier = 'Bronze';
    if (score >= 85) tier = 'Platinum';
    else if (score >= 75) tier = 'Gold';
    else if (score >= 60) tier = 'Silver';

    return {
      farmer_id,
      transactions: ledger.length,
      total_value: totalValue,
      on_time_rate: Number(onTimeRate.toFixed(2)),
      completion_rate: Number((completedTx / ledger.length * 100).toFixed(2)),
      score: Number(score.toFixed(0)),
      tier,
      advisory: true,
    };
  }

  getLedger(farmer_id) {
    return {
      farmer_id,
      transactions: this.farmerLedgers.get(farmer_id) || [],
      credibility: this.getCredibilityScore(farmer_id),
    };
  }

  getBuyerHistory(buyer_id) {
    const history = this.transactions.filter(tx => tx.buyer_id === buyer_id);
    return {
      buyer_id,
      transactions: history,
      total_spent: history.reduce((sum, tx) => sum + tx.total_value, 0),
      suppliers_count: new Set(history.map(tx => tx.farmer_id)).size,
    };
  }
}

module.exports = { TradingLedger };
