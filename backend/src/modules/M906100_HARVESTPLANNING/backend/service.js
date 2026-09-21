/**
 * Harvest & Post-Harvest Planning (M906100_HARVESTPLANNING)
 *
 * SKELETON - not implemented. Every method below throws NOT_IMPLEMENTED
 * on purpose rather than returning fake success, per this project's
 * honesty discipline (no fabricated success paths). See SPEC.md in this
 * folder for the closed stakeholder loop this module owns and the real,
 * already-existing services it should compose rather than duplicate.
 */

'use strict';

class HarvestplanningService {
  async setHarvestWindow(...args) {
    throw new Error('M906100_HARVESTPLANNING.setHarvestWindow: NOT_IMPLEMENTED - see SPEC.md for the real services this should compose');
  }

  async requestLabour(...args) {
    throw new Error('M906100_HARVESTPLANNING.requestLabour: NOT_IMPLEMENTED - see SPEC.md for the real services this should compose');
  }

  async runPackhouseChecklist(...args) {
    throw new Error('M906100_HARVESTPLANNING.runPackhouseChecklist: NOT_IMPLEMENTED - see SPEC.md for the real services this should compose');
  }

  async bookColdSlot(...args) {
    throw new Error('M906100_HARVESTPLANNING.bookColdSlot: NOT_IMPLEMENTED - see SPEC.md for the real services this should compose');
  }

  async scheduleDispatch(...args) {
    throw new Error('M906100_HARVESTPLANNING.scheduleDispatch: NOT_IMPLEMENTED - see SPEC.md for the real services this should compose');
  }
}

module.exports = new HarvestplanningService();
