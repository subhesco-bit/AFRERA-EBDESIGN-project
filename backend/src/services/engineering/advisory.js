/**
 * Advisory envelope for every engineering engine result.
 *
 * WHY THIS EXISTS
 * These engines do first-pass sizing arithmetic from published code formulas.
 * They are not a certified design: there is no finite-element solver, no live
 * supplier price feed and no measured irradiation feed in this deployment. A
 * number returned from here must never reach a drawing, a tender or a bank
 * pack as if it were a checked design output.
 *
 * So every result is wrapped: `advisory: true` is not optional, and `basis`
 * naming the method is mandatory -- build() throws without it. A caller can
 * therefore always answer "where did this number come from" from the payload
 * itself, and no engine can quietly ship an unattributed figure.
 */

'use strict';

/** Caller supplied something the engine cannot work with -> HTTP 400. */
class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}

/**
 * A capability the specification lists but this codebase does not implement.
 * Thrown rather than returning a plausible-looking number -> HTTP 501.
 */
class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * @param {object} spec
 * @param {string} spec.basis      Method/clause the result comes from. Required.
 * @param {object} spec.output     The computed values.
 * @param {object} [spec.assumptions] Values the engine chose that the caller did not supply.
 * @param {string} [spec.priceBasis] For cost results: how the money was derived.
 * @param {string[]} [spec.warnings] Caveats the caller must read.
 */
function build(spec) {
  const {
    basis, output, assumptions, priceBasis, warnings,
  } = spec || {};

  if (!basis || typeof basis !== 'string') {
    throw new Error('advisory.build requires a `basis` string naming the method used');
  }
  if (!output || typeof output !== 'object') {
    throw new Error('advisory.build requires an `output` object');
  }

  const envelope = {
    advisory: true,
    basis,
    ...output,
  };

  if (assumptions && Object.keys(assumptions).length) envelope.assumptions = assumptions;
  if (priceBasis) envelope.priceBasis = priceBasis;
  if (warnings && warnings.length) envelope.warnings = warnings;

  return envelope;
}

/** Guard for a value that must be a finite number, optionally positive. */
function num(value, name, { positive = true } = {}) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new InputError(`${name} must be a finite number`);
  }
  if (positive && parsed <= 0) {
    throw new InputError(`${name} must be greater than zero`);
  }
  return parsed;
}

/** Guard for a value that must be one of a known set. */
function oneOf(value, name, allowed) {
  const key = String(value === undefined || value === null ? '' : value);
  if (!Object.prototype.hasOwnProperty.call(allowed, key)) {
    throw new InputError(`${name} must be one of: ${Object.keys(allowed).join(', ')}`);
  }
  return key;
}

/** Round to `places` decimals without the float noise of toFixed round-tripping. */
function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

module.exports = {
  build, InputError, NotImplementedError, num, oneOf, round,
};
