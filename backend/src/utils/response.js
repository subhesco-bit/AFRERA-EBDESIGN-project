/**
 * Shared response helpers for the modules/M0xx controller.js scaffold.
 *
 * (2026-09-16) Every controller.js in backend/src/modules/ (344 route
 * files, generated from the same template) does
 * `const { sendSuccess, sendError } = require('../../utils/response')` -
 * but this file never existed, so every one of those modules threw
 * `Cannot find module '../../utils/response'` at require() time, before
 * ever reaching a route handler. Verified this was the actual blocker
 * (not just "never mounted") for all of M076-M080, M103, M107-M110,
 * M132, M141 by requiring each module's routes.js directly.
 *
 * Signature verified against real controller call sites (not invented):
 * `sendSuccess(res, data, pagination = null, statusCode = 200)` and
 * `sendError(res, error, statusCode = error.statusCode || 500)`, with
 * the `{success, data}` / `{success, error}` shape matching the
 * convention used by every other route added this session.
 */

'use strict';

function sendSuccess(res, data, pagination = null, statusCode = 200) {
  const body = { success: true, data };
  if (pagination) {
    body.pagination = pagination;
  }
  return res.status(statusCode).json(body);
}

function sendError(res, error, statusCode = null) {
  const status = statusCode || error?.statusCode || 500;
  return res.status(status).json({ success: false, error: error?.message || String(error) });
}

module.exports = { sendSuccess, sendError };
