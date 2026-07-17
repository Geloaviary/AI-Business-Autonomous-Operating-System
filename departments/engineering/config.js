'use strict';

/**
 * config.js
 * ---------------------------------------------------------------------------
 * Department configuration only. No business logic.
 * Values may be overridden via environment variables so this department
 * remains portable across deployments (this is part of what makes it
 * "installable" as a marketplace package).
 * ---------------------------------------------------------------------------
 */

const os = require('os');
const path = require('path');
const { ConfigError } = require('./errors');

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new ConfigError(`Environment variable ${name} must be an integer`);
  return n;
}

function envBool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

const config = Object.freeze({
  department: {
    name: 'engineering',
    autoActivateOnCertification: envBool('ENGINEERING_AUTO_ACTIVATE', true),
    autoPackageOnActivation: envBool('ENGINEERING_AUTO_PACKAGE', true)
  },

  workforce: {
    maxParallelWorkers: envInt('ENGINEERING_MAX_PARALLEL_WORKERS', 4),
    workerTimeoutMs: envInt('ENGINEERING_WORKER_TIMEOUT_MS', 120000)
  },

  execution: {
    maxRepairAttempts: envInt('ENGINEERING_MAX_REPAIR_ATTEMPTS', 3),
    pipelineTimeoutMs: envInt('ENGINEERING_PIPELINE_TIMEOUT_MS', 600000)
  },

  knowledge: {
    preferPlatformMemory: envBool('ENGINEERING_PREFER_PLATFORM_MEMORY', true),
    openaiModel: process.env.ENGINEERING_OPENAI_MODEL || 'gpt-4.1',
    openaiEnabled: envBool('ENGINEERING_OPENAI_ENABLED', true)
  },

  health: {
    heartbeatIntervalMs: envInt('ENGINEERING_HEARTBEAT_MS', 30000),
    degradedFailureThreshold: envInt('ENGINEERING_DEGRADED_THRESHOLD', 3),
    unhealthyFailureThreshold: envInt('ENGINEERING_UNHEALTHY_THRESHOLD', 8)
  },

  packaging: {
    // Defaults to the OS temp directory rather than a relative project path:
    // serverless platforms (Vercel, AWS Lambda, etc.) only permit writes to
    // /tmp, and any relative path resolves against process.cwd() of whatever
    // process required this module — which for the dashboard is the Next.js
    // server, not this department's own directory. /tmp works in both a
    // local Node process and a serverless function.
    outputDir: process.env.ENGINEERING_PACKAGE_OUTPUT || path.join(os.tmpdir(), 'baos-marketplace-packages')
  },

  featureFlags: {
    enableUiBuilder: envBool('ENGINEERING_ENABLE_UI_BUILDER', true),
    enableSelfHealing: envBool('ENGINEERING_ENABLE_SELF_HEALING', true)
  }
});

module.exports = config;
