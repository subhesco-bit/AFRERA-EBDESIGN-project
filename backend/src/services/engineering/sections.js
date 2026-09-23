/**
 * IS 808 hot-rolled section properties, and selection against a demand.
 *
 * Values are the standard published dimensions and section properties for
 * Indian Standard Medium-weight Beams (ISMB), Channels (ISMC) and Equal Angles
 * (ISA). They are a lookup table, not a calculation: nothing here is derived,
 * so nothing here can drift from the code.
 *
 * Units, consistently:
 *   A    cm^2     cross-sectional area
 *   I    cm^4     second moment of area
 *   r    cm       radius of gyration
 *   Ze   cm^3     elastic section modulus
 *   Zp   cm^3     plastic section modulus
 *   mass kg/m
 *
 * `zz` is the major (strong) axis, `yy` the minor (weak) axis.
 */

'use strict';

const { InputError } = require('./advisory');

// designation: [mass, A, Izz, Iyy, rzz, ryy, Zez, Zpz]
const ISMB = {
  'ISMB 100': { mass: 8.9, A: 11.4, Izz: 257.5, Iyy: 40.8, rzz: 4.75, ryy: 1.89, Zez: 51.5, Zpz: 59.6 },
  'ISMB 125': { mass: 13.0, A: 16.6, Izz: 449.0, Iyy: 43.4, rzz: 5.20, ryy: 1.62, Zez: 71.8, Zpz: 83.1 },
  'ISMB 150': { mass: 14.9, A: 19.0, Izz: 726.4, Iyy: 52.6, rzz: 6.18, ryy: 1.66, Zez: 96.9, Zpz: 110.5 },
  'ISMB 175': { mass: 19.3, A: 24.6, Izz: 1272.0, Iyy: 85.0, rzz: 7.19, ryy: 1.86, Zez: 145.4, Zpz: 166.1 },
  'ISMB 200': { mass: 25.4, A: 32.3, Izz: 2235.4, Iyy: 150.0, rzz: 8.32, ryy: 2.15, Zez: 223.5, Zpz: 253.9 },
  'ISMB 225': { mass: 31.2, A: 39.7, Izz: 3441.8, Iyy: 218.3, rzz: 9.31, ryy: 2.34, Zez: 305.9, Zpz: 348.5 },
  'ISMB 250': { mass: 37.3, A: 47.5, Izz: 5131.6, Iyy: 334.5, rzz: 10.39, ryy: 2.65, Zez: 410.5, Zpz: 465.7 },
  'ISMB 300': { mass: 44.2, A: 56.3, Izz: 8603.6, Iyy: 453.9, rzz: 12.37, ryy: 2.84, Zez: 573.6, Zpz: 651.7 },
  'ISMB 350': { mass: 52.4, A: 66.7, Izz: 13630.3, Iyy: 537.7, rzz: 14.29, ryy: 2.84, Zez: 778.9, Zpz: 889.6 },
  'ISMB 400': { mass: 61.6, A: 78.5, Izz: 20458.4, Iyy: 622.1, rzz: 16.15, ryy: 2.82, Zez: 1022.9, Zpz: 1176.2 },
  'ISMB 450': { mass: 72.4, A: 92.3, Izz: 30390.8, Iyy: 834.0, rzz: 18.15, ryy: 3.01, Zez: 1350.7, Zpz: 1553.4 },
  'ISMB 500': { mass: 86.9, A: 110.7, Izz: 45218.3, Iyy: 1369.8, rzz: 20.21, ryy: 3.52, Zez: 1808.7, Zpz: 2074.7 },
  'ISMB 550': { mass: 103.7, A: 132.1, Izz: 64893.6, Iyy: 1833.8, rzz: 22.16, ryy: 3.73, Zez: 2359.8, Zpz: 2711.9 },
  'ISMB 600': { mass: 122.6, A: 156.2, Izz: 91813.0, Iyy: 2651.0, rzz: 24.24, ryy: 4.12, Zez: 3060.4, Zpz: 3510.6 },
};

const ISMC = {
  'ISMC 75': { mass: 7.1, A: 9.0, Izz: 76.7, Iyy: 12.8, rzz: 2.92, ryy: 1.19, Zez: 20.5, Zpz: 24.2 },
  'ISMC 100': { mass: 9.2, A: 11.7, Izz: 186.7, Iyy: 25.9, rzz: 4.00, ryy: 1.49, Zez: 37.3, Zpz: 43.8 },
  'ISMC 125': { mass: 12.7, A: 16.2, Izz: 416.4, Iyy: 59.9, rzz: 5.07, ryy: 1.92, Zez: 66.6, Zpz: 77.6 },
  'ISMC 150': { mass: 16.4, A: 20.9, Izz: 779.4, Iyy: 102.3, rzz: 6.11, ryy: 2.21, Zez: 103.9, Zpz: 120.6 },
  'ISMC 175': { mass: 19.1, A: 24.4, Izz: 1223.6, Iyy: 124.3, rzz: 7.08, ryy: 2.26, Zez: 139.8, Zpz: 162.1 },
  'ISMC 200': { mass: 22.1, A: 28.2, Izz: 1819.3, Iyy: 140.4, rzz: 8.03, ryy: 2.23, Zez: 181.9, Zpz: 211.3 },
  'ISMC 250': { mass: 30.4, A: 38.7, Izz: 3816.8, Iyy: 219.1, rzz: 9.94, ryy: 2.38, Zez: 305.3, Zpz: 355.1 },
  'ISMC 300': { mass: 36.3, A: 46.2, Izz: 6362.6, Iyy: 310.8, rzz: 11.73, ryy: 2.59, Zez: 424.2, Zpz: 493.9 },
  'ISMC 400': { mass: 50.1, A: 63.8, Izz: 15082.8, Iyy: 504.8, rzz: 15.38, ryy: 2.81, Zez: 754.1, Zpz: 878.7 },
};

// Equal angles: zz and yy are equal by symmetry; vv is the weak principal axis
// that governs a single-angle strut, so it is carried explicitly.
const ISA = {
  'ISA 40x40x5': { mass: 3.0, A: 3.79, Izz: 5.43, Iyy: 5.43, rzz: 1.20, ryy: 1.20, rvv: 0.77, Zez: 1.91, Zpz: 2.29 },
  'ISA 50x50x6': { mass: 4.5, A: 5.68, Izz: 12.7, Iyy: 12.7, rzz: 1.50, ryy: 1.50, rvv: 0.96, Zez: 3.61, Zpz: 4.33 },
  'ISA 65x65x6': { mass: 5.8, A: 7.44, Izz: 28.8, Iyy: 28.8, rzz: 1.97, ryy: 1.97, rvv: 1.26, Zez: 6.10, Zpz: 7.32 },
  'ISA 75x75x8': { mass: 8.9, A: 11.38, Izz: 58.9, Iyy: 58.9, rzz: 2.27, ryy: 2.27, rvv: 1.45, Zez: 11.0, Zpz: 13.2 },
  'ISA 90x90x10': { mass: 13.4, A: 17.03, Izz: 126.7, Iyy: 126.7, rzz: 2.73, ryy: 2.73, rvv: 1.74, Zez: 19.8, Zpz: 23.8 },
  'ISA 100x100x10': { mass: 14.9, A: 19.03, Izz: 177.0, Iyy: 177.0, rzz: 3.05, ryy: 3.05, rvv: 1.94, Zez: 24.6, Zpz: 29.5 },
  'ISA 130x130x12': { mass: 23.5, A: 29.97, Izz: 472.0, Iyy: 472.0, rzz: 3.97, ryy: 3.97, rvv: 2.53, Zez: 50.3, Zpz: 60.4 },
  'ISA 150x150x16': { mass: 35.8, A: 45.65, Izz: 959.0, Iyy: 959.0, rzz: 4.58, ryy: 4.58, rvv: 2.92, Zez: 89.1, Zpz: 107.0 },
};

const TABLES = { ISMB, ISMC, ISA };

/**
 * Lightest section in `table` whose `property` meets or exceeds `demand`.
 *
 * Returns `{ section: null, reason }` rather than throwing or returning the
 * largest available section, so the caller can report honestly that the demand
 * exceeds the table instead of silently under-designing.
 */
function selectSection(tableName, property, demand) {
  const table = TABLES[String(tableName).toUpperCase()];
  if (!table) {
    throw new InputError(`Unknown section table: ${tableName}. Available: ${Object.keys(TABLES).join(', ')}`);
  }

  const candidates = Object.entries(table)
    .filter(([, props]) => typeof props[property] === 'number')
    .sort((a, b) => a[1].mass - b[1].mass);

  if (!candidates.length) {
    throw new InputError(`Section table ${tableName} carries no property "${property}"`);
  }

  const hit = candidates.find(([, props]) => props[property] >= demand);
  if (!hit) {
    const [heaviestName, heaviest] = candidates[candidates.length - 1];
    return {
      section: null,
      reason: `Demand ${demand} exceeds every ${tableName} section in the IS 808 table; `
        + `the largest, ${heaviestName}, offers ${property} = ${heaviest[property]}. `
        + 'A built-up or plate girder section is required and is outside this engine.',
    };
  }

  return { section: hit[0], properties: hit[1] };
}

function getSection(designation) {
  const key = String(designation || '').trim();
  const table = Object.values(TABLES).find((t) => Object.prototype.hasOwnProperty.call(t, key));
  if (!table) {
    throw new InputError(`Unknown section: ${designation}. Available tables: ${Object.keys(TABLES).join(', ')}`);
  }
  return table[key];
}

function listSections(tableName) {
  if (!tableName) return Object.keys(TABLES).reduce((acc, k) => ({ ...acc, [k]: Object.keys(TABLES[k]) }), {});
  const table = TABLES[String(tableName).toUpperCase()];
  if (!table) throw new InputError(`Unknown section table: ${tableName}`);
  return Object.keys(table);
}

module.exports = {
  TABLES, ISMB, ISMC, ISA, selectSection, getSection, listSections,
};
