'use strict';

/**
 * service.js
 * ---------------------------------------------------------------------------
 * Shared Engineering services: prompt execution helpers, utility
 * orchestration. Business logic itself remains inside processors — this
 * file only offers small, reusable, side-effect-light helpers that
 * processors and builders can lean on.
 * ---------------------------------------------------------------------------
 */

function slugify(text) {
  return String(text).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function timed(label) {
  const start = Date.now();
  return {
    label,
    stop() {
      return Date.now() - start;
    }
  };
}

async function withTimeout(promise, ms, errorFactory) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(errorFactory ? errorFactory() : new Error(`Timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach((key) => {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return Object.freeze(obj);
}

module.exports = { slugify, timed, withTimeout, deepFreeze };
