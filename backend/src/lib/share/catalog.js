'use strict';
/** Village muscle catalog. Hours are remaining. Rent is not a product.
 * Ported from pine-shadow src/lib/share/catalog.ts */

function a(id, name, kind, mode, hours, present, missing) {
  return { id, name, kind, mode, hours, fpo: true, status: 'living', present, missing };
}

const ASSETS = [
  a('cold-static', 'Langthasa cold bay', 'cold', 'static', 24, 'Declared cold hours on the FPO godown. Same lot body.', 'Cold-km energy cost, control tower.'),
  a('mill-static', 'Village mill', 'mill', 'static', 12, 'Static mill hours. Mill rests on heat. Loss declared.', 'Humanoid teleop, rental rupees.'),
  a('process-static', 'Static food process', 'process', 'static', 8, 'Static processing unit. Parent lot required.', 'Factory SKU path, invented yield.'),
  a('process-mobile', 'Mobile food process', 'process', 'mobile', 6, 'Mobile processing unit. Hours on the FPO.', 'National fleet, invented margin.'),
  a('pack-static', 'Static packhouse', 'pack', 'static', 8, 'Pack hours. HSN analog may name the sack.', 'GST e-invoice, e-way bill.'),
  a('pack-mobile', 'Mobile pack unit', 'pack', 'mobile', 4, 'Mobile packaging. Same lot body, named HSN.', 'GST packing credit, rental rupees.'),
  a('lab-food', 'Mobile food lab', 'lab', 'mobile', 4, 'Food lab hours. Clerk reads the strip.', 'NABL rails, residue confirmation.'),
  a('lab-soil', 'Mobile soil lab', 'lab', 'mobile', 4, 'Soil lab hours. Reading is declared.', 'National soil grid, invented NPK.'),
  a('lab-animal', 'Mobile animal lab', 'lab', 'mobile', 4, 'Animal lab hours. AFRERA-VET still proposes.', 'WOAH confirmation, SNOMED-VET.'),
  a('dryer-shared', 'Shared dryer', 'dryer', 'shared', 10, 'Shared dryer hours. Outage holds the slot.', 'kWh-priced booking.'),
  a('poly-fpo', 'FPO polyhouse', 'polyhouse', 'shared', 12, 'Polyhouse hours on the FPO cell.', 'Yield model, rental rupees.'),
  a('equip-pool', 'Shared equipment pool', 'equipment', 'shared', 8, 'Pump and sprayer hours. Household could not afford alone.', '₹/hour engine, ownership twin.'),
];

const ASSET_BY_ID = Object.fromEntries(ASSETS.map((row) => [row.id, row]));

const HSN_ROWS = [
  { id: '1006', label: 'Rice', pack: true, ratePaise: null, status: 'named' },
  { id: '0910', label: 'Ginger', pack: true, ratePaise: null, status: 'named' },
  { id: '0709', label: 'Other vegetables', pack: true, ratePaise: null, status: 'named' },
  { id: '0810', label: 'Other fruit', pack: true, ratePaise: null, status: 'named' },
  { id: '0401', label: 'Milk', pack: false, ratePaise: null, status: 'named' },
  { id: '2302', label: 'Bran', pack: true, ratePaise: null, status: 'named' },
];

const HSN_BY_ID = Object.fromEntries(HSN_ROWS.map((row) => [row.id, row]));

function assetsByKind(kind) {
  return ASSETS.filter((row) => row.kind === kind);
}

module.exports = { ASSETS, ASSET_BY_ID, HSN_ROWS, HSN_BY_ID, assetsByKind };
