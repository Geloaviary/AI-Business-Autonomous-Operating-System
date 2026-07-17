'use strict';

/**
 * config.js
 * ---------------------------------------------------------------------------
 * QAD configuration. No business logic — thresholds and toggles only.
 * ---------------------------------------------------------------------------
 */

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

function envBool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

module.exports = Object.freeze({
  escalation: {
    // After this many failed repair/resubmission attempts on the same
    // contract, QAD stops silently retrying and escalates for human
    // attention instead — mirroring EscalationOfficer's job below.
    maxAttemptsBeforeEscalation: envInt('QAD_MAX_ATTEMPTS_BEFORE_ESCALATION', 3)
  },
  prediction: {
    enabled: envBool('QAD_PREDICTION_ENABLED', true),
    // Minimum number of historical learning entries before predictions are
    // considered reliable enough to surface — avoids confidently predicting
    // from a sample size of one.
    minSampleSize: envInt('QAD_PREDICTION_MIN_SAMPLE', 5)
  },
  health: {
    degradedFailureThreshold: envInt('QAD_DEGRADED_THRESHOLD', 3),
    unhealthyFailureThreshold: envInt('QAD_UNHEALTHY_THRESHOLD', 8),
    heartbeatIntervalMs: envInt('QAD_HEARTBEAT_MS', 30000)
  }
});
