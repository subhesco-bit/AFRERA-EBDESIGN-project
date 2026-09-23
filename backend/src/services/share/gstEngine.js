/**
 * GST Engine - Goods & Services Tax Calculation & Compliance
 * India-specific tax calculations, filing, compliance
 */

'use strict';

class GSTEngine {
  constructor() {
    this.gstSlabs = {
      '0': 0.00,
      '5': 0.05,
      '12': 0.12,
      '18': 0.18,
      '28': 0.28,
    };

    this.hsnCodes = {
      '1001': {name: 'Rice', slab: 5},
      '1002': {name: 'Wheat', slab: 5},
      '0702': {name: 'Vegetables', slab: 5},
      '0801': {name: 'Nuts', slab: 5},
      '2309': {name: 'Animal feed', slab: 5},
      '3002': {name: 'Milk products', slab: 5},
      '2201': {name: 'Water', slab: 0},
      '2202': {name: 'Soft drinks', slab: 28},
    };

    this.invoices = new Map();
  }

  calculateGST(invoice) {
    const {invoiceValue, hsnCode, sellerState, buyerState, buyerType} = invoice;

    const hsn = this.hsnCodes[hsnCode] || {name: 'Other', slab: 18};
    const gstSlab = hsn.slab;

    let igst = 0, sgst = 0, cgst = 0;

    const isInterState = sellerState !== buyerState;
    const isB2B = buyerType === 'business';

    if (isInterState) {
      igst = invoiceValue * this.gstSlabs[gstSlab.toString()];
    } else {
      const halfSlab = this.gstSlabs[gstSlab.toString()] / 2;
      sgst = invoiceValue * halfSlab;
      cgst = invoiceValue * halfSlab;
    }

    const totalTax = igst + sgst + cgst;
    const grossAmount = invoiceValue + totalTax;

    return {
      advisory: true,
      invoiceValue,
      hsnCode,
      hsnName: hsn.name,
      gstSlab,
      sellerState,
      buyerState,
      buyerType,
      isInterState,
      igst: Number(igst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      cgst: Number(cgst.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      grossAmount: Number(grossAmount.toFixed(2)),
      gstrReportingFlag: isB2B ? 'normal' : 'b2c',
      basis: 'GST Slab from HSN Code, IGST if inter-state, SGST+CGST if intra-state',
      timestamp: new Date(),
    };
  }

  generateGSTR1Entry(invoice, calculatedGST) {
    return {
      invoice_number: invoice.invoiceNumber,
      invoice_date: invoice.invoiceDate,
      invoice_value: calculatedGST.invoiceValue,
      igst: calculatedGST.igst,
      sgst: calculatedGST.sgst,
      cgst: calculatedGST.cgst,
      buyer_gstin: invoice.buyerGSTIN,
      hsn_code: invoice.hsnCode,
      qty: invoice.quantity,
      rate: invoice.rate,
      amt: calculatedGST.invoiceValue,
    };
  }

  generateEWayBill(invoice) {
    return {
      ewb_number: `EWB-${Date.now()}`,
      generated_at: new Date(),
      seller_gstin: invoice.sellerGSTIN,
      buyer_gstin: invoice.buyerGSTIN,
      from_state: invoice.sellerState,
      to_state: invoice.buyerState,
      vehicle_number: invoice.vehicleNumber || null,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      qr_code: `QR-${invoice.invoiceNumber}`,
    };
  }

  storeInvoice(invoiceNumber, invoice, gstCalculation) {
    this.invoices.set(invoiceNumber, {
      invoiceNumber,
      invoice,
      gstCalculation,
      storedAt: new Date(),
      gstr1Entry: this.generateGSTR1Entry(invoice, gstCalculation),
      ewayBill: this.generateEWayBill(invoice),
    });
    return this.invoices.get(invoiceNumber);
  }

  getInvoice(invoiceNumber) {
    return this.invoices.get(invoiceNumber) || null;
  }
}

module.exports = { GSTEngine };
