/**
 * Indian standard rolled steel section properties (IS 808).
 *
 * Section selection previously could not be automated: the engine returned a
 * required Z and I and told the caller to look up a section by hand. This
 * table closes that gap for the profiles used in agricultural structures.
 *
 * Units: A cm², Z cm³, I cm⁴, r cm, mass kg/m. Values are the published
 * IS 808 properties for the major (zz) axis unless suffixed _yy.
 *
 * SCOPE: ISMB (beams), ISMC (channels) and ISA (equal angles) in the sizes
 * common to sheds, greenhouses and storage structures. It is not the whole
 * IS 808 catalogue; `selectSection` reports honestly when nothing fits
 * rather than extrapolating beyond the table.
 */

'use strict';

const ISMB = [
  { designation: 'ISMB 100', mass: 11.5, A: 14.6, Izz: 257.5, Zzz: 51.5, rzz: 4.20, Iyy: 40.8, ryy: 1.67, depth: 100 },
  { designation: 'ISMB 125', mass: 13.3, A: 16.6, Izz: 449.0, Zzz: 71.8, rzz: 5.20, Iyy: 43.8, ryy: 1.62, depth: 125 },
  { designation: 'ISMB 150', mass: 14.9, A: 19.0, Izz: 726.4, Zzz: 96.9, rzz: 6.18, Iyy: 52.6, ryy: 1.66, depth: 150 },
  { designation: 'ISMB 175', mass: 19.3, A: 24.6, Izz: 1272.0, Zzz: 145.4, rzz: 7.19, Iyy: 85.0, ryy: 1.86, depth: 175 },
  { designation: 'ISMB 200', mass: 25.4, A: 32.3, Izz: 2235.4, Zzz: 223.5, rzz: 8.32, Iyy: 150.0, ryy: 2.16, depth: 200 },
  { designation: 'ISMB 225', mass: 31.2, A: 39.7, Izz: 3441.8, Zzz: 305.9, rzz: 9.31, Iyy: 218.3, ryy: 2.34, depth: 225 },
  { designation: 'ISMB 250', mass: 37.3, A: 47.5, Izz: 5131.6, Zzz: 410.5, rzz: 10.39, Iyy: 334.5, ryy: 2.65, depth: 250 },
  { designation: 'ISMB 300', mass: 44.2, A: 56.3, Izz: 8603.6, Zzz: 573.6, rzz: 12.37, Iyy: 453.9, ryy: 2.84, depth: 300 },
  { designation: 'ISMB 350', mass: 52.4, A: 66.7, Izz: 13630.3, Zzz: 778.9, rzz: 14.29, Iyy: 537.7, ryy: 2.84, depth: 350 },
  { designation: 'ISMB 400', mass: 61.6, A: 78.5, Izz: 20458.4, Zzz: 1022.9, rzz: 16.15, Iyy: 622.1, ryy: 2.82, depth: 400 },
  { designation: 'ISMB 450', mass: 72.4, A: 92.3, Izz: 30390.8, Zzz: 1350.7, rzz: 18.15, Iyy: 834.0, ryy: 3.01, depth: 450 },
  { designation: 'ISMB 500', mass: 86.9, A: 110.7, Izz: 45218.3, Zzz: 1808.7, rzz: 20.21, Iyy: 1369.8, ryy: 3.52, depth: 500 },
  { designation: 'ISMB 600', mass: 122.6, A: 156.2, Izz: 91813.0, Zzz: 3060.4, rzz: 24.24, Iyy: 2651.0, ryy: 4.12, depth: 600 },
];

const ISMC = [
  { designation: 'ISMC 75', mass: 7.14, A: 9.09, Izz: 76.9, Zzz: 20.5, rzz: 2.91, Iyy: 12.6, ryy: 1.18, depth: 75 },
  { designation: 'ISMC 100', mass: 9.56, A: 12.2, Izz: 192.3, Zzz: 38.5, rzz: 3.97, Iyy: 25.9, ryy: 1.46, depth: 100 },
  { designation: 'ISMC 125', mass: 12.7, A: 16.2, Izz: 416.4, Zzz: 66.6, rzz: 5.07, Iyy: 44.8, ryy: 1.66, depth: 125 },
  { designation: 'ISMC 150', mass: 16.4, A: 20.9, Izz: 779.4, Zzz: 103.9, rzz: 6.11, Iyy: 102.3, ryy: 2.21, depth: 150 },
  { designation: 'ISMC 175', mass: 19.1, A: 24.4, Izz: 1223.6, Zzz: 139.8, rzz: 7.08, Iyy: 124.3, ryy: 2.26, depth: 175 },
  { designation: 'ISMC 200', mass: 22.1, A: 28.2, Izz: 1819.3, Zzz: 181.9, rzz: 8.03, Iyy: 140.4, ryy: 2.23, depth: 200 },
  { designation: 'ISMC 250', mass: 30.4, A: 38.7, Izz: 3816.8, Zzz: 305.3, rzz: 9.94, Iyy: 219.1, ryy: 2.38, depth: 250 },
  { designation: 'ISMC 300', mass: 36.3, A: 46.2, Izz: 6362.6, Zzz: 424.2, rzz: 11.73, Iyy: 310.8, ryy: 2.59, depth: 300 },
  { designation: 'ISMC 400', mass: 49.4, A: 62.9, Izz: 15082.8, Zzz: 754.1, rzz: 15.48, Iyy: 504.8, ryy: 2.83, depth: 400 },
];

// Equal angles — the ryy value governs strut buckling about the weak axis.
const ISA = [
  { designation: 'ISA 50x50x6', mass: 4.5, A: 5.68, Izz: 12.7, Zzz: 3.6, rzz: 1.50, Iyy: 12.7, ryy: 0.96, depth: 50 },
  { designation: 'ISA 65x65x6', mass: 5.8, A: 7.44, Izz: 28.7, Zzz: 6.1, rzz: 1.96, Iyy: 28.7, ryy: 1.26, depth: 65 },
  { designation: 'ISA 75x75x6', mass: 6.8, A: 8.66, Izz: 44.9, Zzz: 8.2, rzz: 2.28, Iyy: 44.9, ryy: 1.46, depth: 75 },
  { designation: 'ISA 90x90x8', mass: 10.8, A: 13.79, Izz: 104.2, Zzz: 16.1, rzz: 2.75, Iyy: 104.2, ryy: 1.75, depth: 90 },
  { designation: 'ISA 100x100x10', mass: 14.9, A: 19.03, Izz: 177.0, Zzz: 24.6, rzz: 3.05, Iyy: 177.0, ryy: 1.94, depth: 100 },
  { designation: 'ISA 130x130x12', mass: 23.5, A: 29.97, Izz: 466.0, Zzz: 50.1, rzz: 3.94, Iyy: 466.0, ryy: 2.54, depth: 130 },
];

const CATALOGUE = { ISMB, ISMC, ISA };

/**
 * Lightest section satisfying the required section modulus and, when given,
 * the required second moment of area.
 *
 * Returns null when nothing in the table qualifies, so the caller can say so
 * rather than silently returning the largest available section.
 */
function selectSection({ requiredZ_cm3, requiredI_cm4 = 0, family = 'ISMB' }) {
  const list = CATALOGUE[String(family).toUpperCase()];
  if (!list) {
    throw new Error(`Unknown section family "${family}". Expected one of: ${Object.keys(CATALOGUE).join(', ')}`);
  }
  const candidates = list
    .filter(s => s.Zzz >= requiredZ_cm3 && s.Izz >= requiredI_cm4)
    .sort((a, b) => a.mass - b.mass);

  if (candidates.length === 0) {
    return {
      found: false,
      family: String(family).toUpperCase(),
      reason: `no ${family} section in the table reaches Z=${requiredZ_cm3} cm³ and I=${requiredI_cm4} cm⁴; a plate girder or a deeper family is required`,
      largestAvailable: list[list.length - 1].designation,
    };
  }

  const chosen = candidates[0];
  return {
    found: true,
    family: String(family).toUpperCase(),
    section: chosen.designation,
    properties: chosen,
    utilisation: {
      sectionModulus: Number((requiredZ_cm3 / chosen.Zzz).toFixed(3)),
      momentOfInertia: requiredI_cm4 ? Number((requiredI_cm4 / chosen.Izz).toFixed(3)) : null,
    },
    alternatives: candidates.slice(1, 4).map(s => s.designation),
  };
}

module.exports = { CATALOGUE, ISMB, ISMC, ISA, selectSection };