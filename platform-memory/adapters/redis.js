'use strict';

/**
 * adapters/redis.js
 * ---------------------------------------------------------------------------
 * Real, persistent Platform Memory storage, backed by Upstash Redis (what
 * Vercel now routes "KV" through, since Vercel KV itself was deprecated in
 * December 2024). Implements the exact same interface as
 * adapters/in-memory.js so storage.js and index.js are unaffected by which
 * one is injected — that's the entire reason storage is behind an
 * interface at all: Platform Memory being the single source of truth
 * across every department only means something if it actually persists
 * across serverless cold starts, not just across function calls in one
 * process.
 * ---------------------------------------------------------------------------
 */

const LEDGER_PREFIX = 'baos:memory:ledger:';
const KNOWLEDGE_KEY = 'baos:memory:knowledge';
const RELATIONSHIPS_KEY = 'baos:memory:relationships';

function parseMaybeJSON(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class RedisStorage {
  /** @param {import('@upstash/redis').Redis} redis */
  constructor(redis) {
    this.redis = redis;
  }

  async ledgerSet(certificateId, record) {
    await this.redis.set(`${LEDGER_PREFIX}${certificateId}`, record);
  }

  async ledgerGet(certificateId) {
    return this.redis.get(`${LEDGER_PREFIX}${certificateId}`);
  }

  async knowledgePush(entry) {
    await this.redis.lpush(KNOWLEDGE_KEY, JSON.stringify(entry));
  }

  async knowledgeAll() {
    const raw = await this.redis.lrange(KNOWLEDGE_KEY, 0, -1);
    return (raw || []).map(parseMaybeJSON);
  }

  async relationshipAdd(certificateIdA, certificateIdB, relationshipType) {
    await this.redis.lpush(RELATIONSHIPS_KEY, JSON.stringify({ certificateIdA, certificateIdB, relationshipType }));
  }

  async relationshipsFor(certificateId) {
    const raw = await this.redis.lrange(RELATIONSHIPS_KEY, 0, -1);
    const all = (raw || []).map(parseMaybeJSON);
    const edges = [];
    for (const r of all) {
      if (r.certificateIdA === certificateId) edges.push({ otherCertificateId: r.certificateIdB, relationshipType: r.relationshipType });
      else if (r.certificateIdB === certificateId) edges.push({ otherCertificateId: r.certificateIdA, relationshipType: r.relationshipType });
    }
    return edges;
  }
}

module.exports = { RedisStorage };
