'use strict';
/** Ported from pine-shadow src/lib/erp/ids.ts */
function nid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
module.exports = { nid };
