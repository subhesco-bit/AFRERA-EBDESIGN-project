'use strict';
class SubledgerManager {
  constructor() {
    this.ap = new Map(); this.ar = new Map(); this.cc = new Map();
  }
  recordAP(vendor, amount, invoiceNumber) {
    if (!this.ap.has(vendor)) this.ap.set(vendor, []);
    this.ap.get(vendor).push({invoiceNumber, amount, date: new Date(), status: 'pending'});
  }
  recordAR(customer, amount, invoiceNumber) {
    if (!this.ar.has(customer)) this.ar.set(customer, []);
    this.ar.get(customer).push({invoiceNumber, amount, date: new Date(), status: 'pending'});
  }
  recordCostCenter(ccId, description) {
    this.cc.set(ccId, {id: ccId, description, balance: 0, entries: []});
  }
  postToCostCenter(ccId, amount, description) {
    if (!this.cc.has(ccId)) throw new Error(`Cost center ${ccId} not found`);
    const cc = this.cc.get(ccId);
    cc.balance += amount;
    cc.entries.push({amount, description, date: new Date()});
  }
  getAPBalance(vendor) {
    const bills = this.ap.get(vendor) || [];
    return bills.reduce((sum, b) => sum + (b.status === 'pending' ? b.amount : 0), 0);
  }
  getARBalance(customer) {
    const invoices = this.ar.get(customer) || [];
    return invoices.reduce((sum, i) => sum + (i.status === 'pending' ? i.amount : 0), 0);
  }
}
module.exports = { SubledgerManager };
