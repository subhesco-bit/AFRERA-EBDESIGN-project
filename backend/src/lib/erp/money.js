'use strict';
/** Mass is grams. Money is paise. Never float rupees through the ledger.
 * Ported faithfully from pine-shadow src/lib/erp/money.ts */

function paiseFromKgPrice(grams, paisePerKg) {
  return Math.round((grams * paisePerKg) / 1000);
}

function gramsFromKg(kg) {
  return Math.round(kg * 1000);
}

function kgFromGrams(grams) {
  return grams / 1000;
}

function formatKg(grams) {
  const kg = grams / 1000;
  return `${kg.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg`;
}

function formatRupee(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

function parseKg(raw) {
  const n = Number(String(raw).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return gramsFromKg(n);
}

function parseRupeePerKg(raw) {
  const n = Number(String(raw).replace(/,/g, '').replace(/^₹/, '').trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

module.exports = { paiseFromKgPrice, gramsFromKg, kgFromGrams, formatKg, formatRupee, parseKg, parseRupeePerKg };
