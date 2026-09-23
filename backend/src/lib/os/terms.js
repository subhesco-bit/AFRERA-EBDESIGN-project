'use strict';
/** Domain terminology. Rupee laws are never auto-translated.
 * Ported from pine-shadow src/lib/os/terms.ts */

const TERMS = [
  { id: 'cell', en: 'cell', as: 'কোষ', hi: 'कोशिका', law: false },
  { id: 'lot', en: 'lot', as: 'লট', hi: 'लॉट', law: false },
  { id: 'farmgate', en: 'farmgate', as: 'ফার্মগেট', hi: 'फार्मगेट', law: false },
  { id: 'remaining', en: 'remaining grams', as: 'অৱশিষ্ট গ্ৰাম', hi: 'शेष ग्राम', law: true },
  { id: 'journal', en: 'journal', as: 'জার্নেল', hi: 'जर्नल', law: true },
  { id: 'firewall', en: 'AI cannot write rupees', as: 'AI cannot write rupees', hi: 'AI cannot write rupees', law: true },
  { id: 'clerk', en: 'clerk', as: 'ক্লার্ক', hi: 'क्लर्क', law: false },
  { id: 'cover', en: 'cover', as: "ক'ভাৰ", hi: 'कवर', law: false },
];

function neverTranslate(id) {
  return TERMS.find((t) => t.id === id)?.law === true;
}

function term(id, locale) {
  const t = TERMS.find((x) => x.id === id);
  if (!t) return id;
  if (t.law && locale !== 'en') return t.en;
  return t[locale];
}

module.exports = { TERMS, neverTranslate, term };
