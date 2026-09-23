'use strict';
/** Suitability layer. Refuse harmful or invented offers before recommending.
 * Ported from pine-shadow src/lib/os/suitability.ts */

function assessSuitability(offer, opts = {}) {
  if (offer === 'loan') {
    return { offer, suitable: false, refuse: true, reason: 'No underwriting on this kernel. Do not invent a credit score.' };
  }
  if (offer === 'travel') {
    return { offer, suitable: false, refuse: true, reason: 'Tourism is not this village. Remaining journey is a different door.' };
  }
  if (offer === 'scheme') {
    return { offer, suitable: true, refuse: true, reason: 'Eligibility may be computed. Amount stays undeclared. Do not recommend a rupee.' };
  }
  if (offer === 'insurance-quote') {
    return { offer, suitable: false, refuse: true, reason: 'Do not invent a premium.' };
  }
  if (offer === 'price') {
    if (!opts.declared) {
      return { offer, suitable: false, refuse: true, reason: 'salePricePerUnit is declared. AI never writes it.' };
    }
    return { offer, suitable: true, refuse: false, reason: 'Price is declared by the clerk.' };
  }
  if (offer === 'cover') {
    if (opts.premiumKnown) {
      return { offer, suitable: true, refuse: false, reason: 'Cover and premium both declared.' };
    }
    return { offer, suitable: true, refuse: false, reason: 'Cover may bind. Premium stays unknown — never invented.' };
  }
  return { offer, suitable: false, refuse: true, reason: 'Unknown offer. Refuse.' };
}

module.exports = { assessSuitability };
