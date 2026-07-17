'use strict';

/**
 * lib/engineering-bridge.js
 * ---------------------------------------------------------------------------
 * The dashboard is a thin visualization layer over the real BAOS backend —
 * it does not reimplement or mock any business logic. This module boots
 * ONE process-wide instance each of Platform Memory, the Quality Assurance
 * Director, and the Engineering Department — the same standalone packages
 * used by their own test suites — and wires them together exactly the way
 * a full deployment would: Platform Memory is shared organizational
 * infrastructure, QAD is a peer department that holds the only commit
 * authority to it, and Engineering connects to both as a client.
 *
 * A singleton is intentional: health monitoring, history, and learning are
 * meant to accumulate across requests, exactly like a real organization's
 * institutional memory would across a business day.
 * ---------------------------------------------------------------------------
 */

const path = require('path');

let platformSingleton = null;

/**
 * A Redis-backed Platform Memory (via the Vercel Marketplace's Upstash
 * integration, or a direct Upstash account) is used whenever credentials
 * are present. This matters specifically because Vercel serverless
 * functions are stateless per invocation/cold start — without this, the
 * dashboard would appear to "forget" every certified department the
 * moment a new instance handled the next request.
 *
 * Supports both env var naming conventions: KV_REST_API_URL/TOKEN (set
 * automatically when you attach Redis to a Vercel project via the
 * Marketplace) and UPSTASH_REDIS_REST_URL/TOKEN (set when connecting to
 * an Upstash database directly).
 */
function getRedisCredentials() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

function buildRedisStorage(credentials) {
  // eslint-disable-next-line global-require
  const { Redis } = require('@upstash/redis');
  const redis = new Redis(credentials);
  // eslint-disable-next-line global-require
  const { RedisStorage } = require('../platform-memory/adapters/redis');
  // eslint-disable-next-line global-require
  const { PendingActivationsKV } = require('../departments/engineering/adapters/pending-activations-redis');
  return {
    storage: new RedisStorage(redis),
    pendingActivations: new PendingActivationsKV(redis)
  };
}

/**
 * Boots Platform Memory, QAD, and Engineering together — once — and wires
 * them exactly the way the platform constitution requires: Engineering and
 * QAD both connect to the SAME Platform Memory instance; QAD is the only
 * one holding commit authority to it (granted internally the moment
 * createQualityAssuranceDirector() runs).
 */
function getPlatform() {
  if (!platformSingleton) {
    // eslint-disable-next-line global-require
    const { createPlatformMemory } = require('../platform-memory');
    // eslint-disable-next-line global-require
    const { createQualityAssuranceDirector } = require('../departments/quality-assurance-director');
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment } = require('../departments/engineering');

    const credentials = getRedisCredentials();
    const redisOverrides = credentials ? buildRedisStorage(credentials) : {};

    const platformMemory = createPlatformMemory({ storage: redisOverrides.storage });
    const qad = createQualityAssuranceDirector({ platformMemory });

    const engineering = createEngineeringDepartment({
      platformMemory,
      qad,
      // The dashboard always runs executive-gated: QAD certification and
      // Platform Memory commit happen automatically, but a department only
      // becomes ACTIVE and produces a Marketplace package once the
      // executive explicitly activates it. This is a deliberate product
      // decision, not a technical default — the standalone backend's own
      // tests/demo keep autoActivate:true because they're exercising the
      // pipeline in isolation, not modeling an executive's approval step.
      autoActivate: false,
      pendingActivations: redisOverrides.pendingActivations
    });
    engineering.runtime.start();
    qad.runtime.start();

    platformSingleton = { platformMemory, qad, engineering };
  }
  return platformSingleton;
}

function getDepartment() {
  return getPlatform().engineering;
}

/**
 * Submits a business request and streams every lifecycle event to `onEvent`
 * as it happens, resolving with the final pipeline result once packaging
 * completes (or rejecting if the pipeline ultimately fails after exhausting
 * repair attempts).
 */
async function submitRequestWithProgress(requestSpec, onEvent) {
  const dept = getDepartment();
  const listener = (record) => onEvent(record);
  dept.events.on('*', listener);

  try {
    const result = await dept.runtime.submitRequest(requestSpec);
    return result;
  } finally {
    dept.events.off('*', listener);
  }
}

async function getWorkforceRoster() {
  const dept = getDepartment();
  return Object.entries(dept.agents).map(([key, agent]) => ({
    key,
    role: agent.role
  }));
}

async function getHealthSnapshot() {
  const dept = getDepartment();
  return dept.health.runDiagnostics();
}

async function getMetricsSnapshot() {
  const dept = getDepartment();
  return dept.metrics.snapshot();
}

async function getRecentHistory(limit = 25) {
  const dept = getDepartment();
  return dept.history.all().slice(-limit).reverse();
}

/**
 * Reads certified knowledge directly from the standalone Platform Memory
 * instance — the single source of truth shared by Engineering, QAD, and
 * every future department, not something read through Engineering.
 */
async function getCertifiedKnowledge() {
  const { platformMemory } = getPlatform();
  const entries = await platformMemory.query({});
  return [...entries].reverse();
}

/**
 * Reads the Quality Assurance Director's certification history directly
 * from the standalone QAD department — its own audit trail, not something
 * proxied through Engineering. QAD's history records CERTIFICATION,
 * REJECTION, and ESCALATION as distinct kinds (see
 * departments/quality-assurance-director/history.js); this maps the first
 * two into the CertificationRecord shape the dashboard renders. Escalations
 * are attached to their corresponding rejection via contractId rather than
 * shown as a separate row, since an escalation is a property of a
 * rejection, not a distinct verdict.
 */
async function getCertificationHistory() {
  const { qad } = getPlatform();
  const records = await qad.manager.getCertifications();

  const escalatedContractIds = new Set(
    records.filter((r) => r.kind === 'ESCALATION').map((r) => r.payload.contractId)
  );

  return records
    .filter((r) => r.kind === 'CERTIFICATION' || r.kind === 'REJECTION')
    .map((r) => ({
      verdict: r.kind === 'CERTIFICATION' ? 'PASS' : 'FAIL',
      certificateId: r.payload.certificateId,
      submission: {
        departmentName: r.payload.departmentName,
        artifactId: r.payload.certificateId || r.payload.contractId,
        contractId: r.payload.contractId
      },
      issues: r.payload.issues,
      escalated: escalatedContractIds.has(r.payload.contractId),
      certifiedAt: r.at
    }));
}

/** Lists generated marketplace ZIP packages on disk. */
async function getMarketplacePackages() {
  const fs = require('fs/promises');
  const config = require('../departments/engineering/config.js');
  // Backend fs calls (adapters/filesystem.js, adapters/archiver.js) resolve
  // relative paths the same way Node always does: against process.cwd() of
  // whatever process required the department module — in this case, the
  // dashboard's own server process. Mirror that resolution here rather than
  // resolving relative to the engineering module's own directory.
  const dir = path.resolve(config.packaging.outputDir);

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const zips = entries.filter((e) => e.isFile() && e.name.endsWith('.zip'));
    const withStats = await Promise.all(
      zips.map(async (e) => {
        const stat = await fs.stat(path.join(dir, e.name));
        return { name: e.name, sizeBytes: stat.size, createdAt: stat.birthtime.toISOString() };
      })
    );
    return withStats.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

/**
 * Departments that are certified and committed to Platform Memory but
 * awaiting the executive's explicit activation decision.
 */
async function getPendingActivations() {
  const dept = getDepartment();
  const pending = await dept.manager.listPendingActivations();
  return pending.map((p) => ({
    artifactId: p.artifactId,
    departmentName: p.departmentName,
    capabilities: p.plan?.capabilities || [],
    fileCount: p.files ? Object.keys(p.files).length : 0,
    certifiedAt: p.certifiedAt
  }));
}

/**
 * The executive's approval step. Activates a pending department — it
 * becomes part of the live platform and immediately produces its
 * Marketplace ZIP package.
 */
async function activateDepartment(artifactId) {
  const dept = getDepartment();
  return dept.manager.activateDepartment(artifactId);
}

module.exports = {
  getPlatform,
  getDepartment,
  submitRequestWithProgress,
  getWorkforceRoster,
  getHealthSnapshot,
  getMetricsSnapshot,
  getRecentHistory,
  getCertifiedKnowledge,
  getCertificationHistory,
  getMarketplacePackages,
  getPendingActivations,
  activateDepartment
};
