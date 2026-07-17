'use strict';

/**
 * service.js
 * ---------------------------------------------------------------------------
 * Small, reusable, side-effect-light helpers.
 * ---------------------------------------------------------------------------
 */

function ping() {
  return { department: 'quality-assurance-director', ok: true, at: new Date().toISOString() };
}

module.exports = { ping };
