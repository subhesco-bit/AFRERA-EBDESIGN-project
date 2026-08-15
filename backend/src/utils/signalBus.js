/**
 * Backward-compatible export for the platform signal bus.
 *
 * The project's nervous-system layer lives in `src/core/signalBus.js`, but a
 * subset of older services still import it from `src/utils/signalBus.js`.
 * Keeping this shim avoids breaking the module graph while preserving the
 * canonical implementation and event contracts.
 */

const { signalBus, SIGNAL, SEVERITY, SignalBus } = require('../core/signalBus');

module.exports = {
  signalBus,
  SIGNAL,
  SEVERITY,
  SignalBus
};
