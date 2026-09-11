'use strict';

function required(value, name) {
  if (value === undefined || value === null || value === '') throw Object.assign(new Error(`${name} is required`), { code: 'VALIDATION_ERROR' });
}

class InvoiceService {
  constructor({ repository = null, numberGenerator = () => `INV-${new Date().getFullYear()}-${Date.now()}` } = {}) {
    this.repository = repository; this.numberGenerator = numberGenerator;
  }

  calculateTotals(lines, taxRate = 0) {
    if (!Array.isArray(lines) || lines.length === 0) throw Object.assign(new Error('invoice lines are required'), { code: 'VALIDATION_ERROR' });
    const subtotal = lines.reduce((sum, line) => {
      const qty = Number(line.quantity); const rate = Number(line.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(rate) || rate < 0) throw Object.assign(new Error('invalid invoice line'), { code: 'VALIDATION_ERROR' });
      return sum + qty * rate;
    }, 0);
    const rate = Number(taxRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw Object.assign(new Error('invalid tax rate'), { code: 'VALIDATION_ERROR' });
    const tax = subtotal * rate / 100;
    return { subtotal: Number(subtotal.toFixed(2)), tax: Number(tax.toFixed(2)), total: Number((subtotal + tax).toFixed(2)) };
  }

  async create({ orderId, customerId, lines, taxRate = 0, currency = 'INR', dueAt = null }) {
    required(orderId, 'orderId'); required(customerId, 'customerId');
    const totals = this.calculateTotals(lines, taxRate);
    const invoice = { invoiceNumber: this.numberGenerator(), orderId, customerId, currency, lines, taxRate: Number(taxRate), ...totals, dueAt, status: 'ISSUED', issuedAt: new Date().toISOString() };
    return this.repository?.create ? this.repository.create(invoice) : invoice;
  }
}

module.exports = new InvoiceService();
module.exports.InvoiceService = InvoiceService;
