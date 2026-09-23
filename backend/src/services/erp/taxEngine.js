'use strict';
class TaxEngine {
  constructor() {
    this.slabs = {'0': 0, '5': 0.05, '12': 0.12, '18': 0.18, '28': 0.28};
    this.hsnMap = {'1001': '5', '1002': '5', '0702': '5', '2201': '0', '2202': '28'};
  }
  calculateTax(amount, hsnCode, isInterState) {
    const slab = this.hsnMap[hsnCode] || '18';
    const rate = this.slabs[slab];
    const tax = amount * rate;
    return {amount, tax: Number(tax.toFixed(2)), slab: Number(slab), total: Number((amount + tax).toFixed(2)), isInterState};
  }
  determineGSTType(sellerState, buyerState) {
    return sellerState === buyerState ? {igst: 0, sgst: 0.5, cgst: 0.5} : {igst: 1, sgst: 0, cgst: 0};
  }
  applyGST(amount, hsnCode, sellerState, buyerState) {
    const rate = Number(this.hsnMap[hsnCode] || '18') / 100;
    const isInterState = sellerState !== buyerState;
    if (isInterState) {
      return {igst: Number((amount * rate).toFixed(2)), sgst: 0, cgst: 0, total: Number((amount + amount * rate).toFixed(2))};
    }
    const half = rate / 2;
    return {igst: 0, sgst: Number((amount * half).toFixed(2)), cgst: Number((amount * half).toFixed(2)), total: Number((amount + amount * rate).toFixed(2))};
  }
}
module.exports = { TaxEngine };
