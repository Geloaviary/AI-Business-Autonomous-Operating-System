'use strict';

/**
 * adapters/pending-activations-redis.js
 * ---------------------------------------------------------------------------
 * Redis-backed equivalent of pending-activations.js's InMemoryPendingActivations.
 * Required for the dashboard on Vercel: the request that creates a
 * department and the later request where the executive clicks "Activate"
 * are very likely different serverless invocations, possibly different
 * instances entirely. In-memory storage would lose the pending record
 * between those two clicks. This implements the identical interface
 * (add/get/remove/list) so manager.js doesn't know or care which is in use.
 * ---------------------------------------------------------------------------
 */

const { MemoryAccessError } = require('../errors');

const RECORD_PREFIX = 'baos:pending:';
const INDEX_KEY = 'baos:pending:index';

class PendingActivationsKV {
  /** @param {import('@upstash/redis').Redis} redis */
  constructor(redis) {
    if (!redis) throw new MemoryAccessError('PendingActivationsKV requires a redis client');
    this.redis = redis;
  }

  async add(record) {
    await this.redis.set(`${RECORD_PREFIX}${record.artifactId}`, record);
    await this.redis.sadd(INDEX_KEY, record.artifactId);
    return record;
  }

  async get(artifactId) {
    return this.redis.get(`${RECORD_PREFIX}${artifactId}`);
  }

  async remove(artifactId) {
    await this.redis.del(`${RECORD_PREFIX}${artifactId}`);
    await this.redis.srem(INDEX_KEY, artifactId);
  }

  async list() {
    const ids = await this.redis.smembers(INDEX_KEY);
    if (!ids || ids.length === 0) return [];
    const records = await Promise.all(ids.map((id) => this.redis.get(`${RECORD_PREFIX}${id}`)));
    return records.filter(Boolean);
  }
}

module.exports = { PendingActivationsKV };
