'use strict';
/** Four simultaneous enhancement levels. Do not generate a thousand pages.
 * Ported from pine-shadow src/lib/os/enhance.ts */

const { OS_ITEMS } = require('./catalog');

function agri(x) {
  return x.area === 'agriculture' || x.organs.includes('crop') || x.organs.includes('lot') || x.organs.includes('farmer');
}

function enhance(item) {
  const living = item.kernel === 'verified' || item.kernel === 'partial';
  return [
    {
      level: 'component', title: 'Intelligent component',
      living: living ? `Explains ${item.present} Next action at ${item.href}. Absence stays absent.` : 'Name only. No component yet.',
      missing: 'Language-adapt feedback loop on GitHub.', next: living ? 'Explain or hide.' : 'Do not mint a page for a missing organ.',
    },
    {
      level: 'industry', title: 'Sector-native journey',
      living: agri(item) ? 'Agriculture walk: harvest → godown → offtake → settle.' : item.stage <= 1 ? 'Shared bone: clerk, remaining grams, journal.' : `${item.area} is named. Do not clone the agriculture dashboard.`,
      missing: item.missing, next: item.next,
    },
    {
      level: 'rural', title: 'India / rural-first',
      living: item.organs.includes('farmer') || item.organs.includes('household') ? 'Need is the door. Assisted companion. Vernacular cell / lot / farmgate.' : 'Shared kernel. Offline still missing.',
      missing: 'Offline queue, IVR/SMS, shared-device consent.', next: 'Assisted lives. Offline does not.',
    },
    {
      level: 'future', title: 'Futuristic seed',
      living: item.table === 'future' || item.stage >= 5 ? `Named: ${item.name}. Not claimed.` : 'Seeds a later twin / reflex / graph. No invented ₹.',
      missing: item.kernel === 'missing' || item.kernel === 'proposed' ? item.missing : 'Village twin, energy cloud, federated learning remain proposed.',
      next: 'Show what-if. Never auto-execute.',
    },
  ];
}

function enhanceFor(id) {
  const x = OS_ITEMS.find((r) => r.id === id);
  return x ? enhance(x) : null;
}

module.exports = { enhance, enhanceFor };
