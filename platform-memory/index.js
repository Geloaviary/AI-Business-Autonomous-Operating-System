'use strict';

/**
 * index.js
 * ---------------------------------------------------------------------------
 * Platform Memory — the institutional brain of BAOS. Single source of
 * truth, shared across every department. This is NOT owned by Engineering
 * or any other department; it is core platform infrastructure that
 * Engineering, the Quality Assurance Director, and every future department
 * all connect to as clients.
 *
 * Composition contract:
 *   const platformMemory = createPlatformMemory({ storage });
 *   const commitToken = platformMemory.grantCommitAuthority(); // once, to QAD
 *   // Every department gets read access:
 *   await platformMemory.query({ departmentName: 'research' });
 *   // Only QAD, holding the token, may write:
 *   await platformMemory.commit({ ...submission, authorityToken: commitToken });
 * ---------------------------------------------------------------------------
 */

const { PlatformMemoryStore } = require('./store');
const { CommitAuthority } = require('./commit-authority');
const { InMemoryStorage } = require('./adapters/in-memory');
const { KNOWLEDGE_CATEGORY, SERVICE_NAME, SERVICE_VERSION } = require('./constants');

/**
 * @param {Object} [overrides]
 * @param {Object} [overrides.storage] - Storage backend (defaults to in-memory).
 *   Use adapters/redis.js's RedisStorage for a persistent deployment.
 */
function createPlatformMemory(overrides = {}) {
  const storage = overrides.storage || new InMemoryStorage();
  const authority = new CommitAuthority();
  const store = new PlatformMemoryStore({ storage, authority });

  return {
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    categories: KNOWLEDGE_CATEGORY,

    /** Called exactly once, when composing QAD together with Platform Memory. */
    grantCommitAuthority: () => authority.grant(),

    // Store
    commit: (submission) => store.commit(submission),
    // Retrieve
    confirmCommit: (certificateId) => store.confirmCommit(certificateId),
    query: (filter) => store.query(filter),
    // Version
    versionHistory: (subjectKey, departmentName) => store.versionHistory(subjectKey, departmentName),
    latestVersion: (subjectKey, departmentName) => store.latestVersion(subjectKey, departmentName),
    // Search
    search: (queryString) => store.search(queryString),
    // Relationships
    relate: (certificateIdA, certificateIdB, relationshipType) => store.relate(certificateIdA, certificateIdB, relationshipType),
    getRelated: (certificateId) => store.getRelated(certificateId),

    growth: () => store.growth(),

    health: async () => ({
      status: 'HEALTHY',
      backend: storage.constructor.name,
      checkedAt: new Date().toISOString()
    })
  };
}

module.exports = { createPlatformMemory, KNOWLEDGE_CATEGORY };
