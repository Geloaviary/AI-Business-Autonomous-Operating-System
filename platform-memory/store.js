'use strict';

/**
 * store.js
 * ---------------------------------------------------------------------------
 * The actual "single source of truth" logic — deliberately reduced to six
 * primitives: Store, Retrieve, Version, Search, Relationships, Security.
 * Platform Memory does NOT transform knowledge and does NOT own a fixed
 * business taxonomy — that was a real design flaw in an earlier version of
 * this file (a hardcoded KNOWLEDGE_CATEGORY enum baked business meaning
 * into shared infrastructure). Departments transform their own artifacts
 * into knowledge via their own knowledge.js, and produce consumer-specific
 * views via their own views.js, BEFORE submission to QAD — by the time
 * anything reaches Platform Memory, it's already fully-formed, opaque
 * knowledge. Platform Memory just stores it, versions it, indexes it,
 * relates it, and guards who may write it.
 *
 * Constitutional rule enforced here, not just documented: commit() requires
 * a valid capability token from commit-authority.js. Every read operation
 * (retrieve, version history, search, relationships) has no such
 * restriction — every department may freely consult certified knowledge;
 * only writing it is gated. That asymmetry IS the Security pillar.
 * ---------------------------------------------------------------------------
 */

const { ValidationError } = require('./errors');

class PlatformMemoryStore {
  /**
   * @param {Object} deps
   * @param {Object} deps.storage - ledgerSet/ledgerGet/knowledgePush/knowledgeAll/relationshipAdd/relationshipsFor
   * @param {import('./commit-authority').CommitAuthority} deps.authority
   */
  constructor({ storage, authority }) {
    this.storage = storage;
    this.authority = authority;
  }

  // --- Store -----------------------------------------------------------
  /**
   * Commit certified knowledge. Only callable with a valid authority token.
   * `knowledge` is whatever opaque, already-transformed object the
   * submitting department's own knowledge.js produced — Platform Memory
   * does not interpret it, only stores it.
   *
   * `subjectKey` is optional and is what enables the Version pillar: pass
   * the same subjectKey across multiple commits (e.g. a department resubmitting
   * an updated "market-analysis:japan" knowledge item) and this store tracks
   * them as versions of the same subject rather than unrelated entries.
   */
  async commit({ certificateId, category, departmentName, artifactId, checksum, summary, content, subjectKey, authorityToken }) {
    this.authority.verify(authorityToken);

    if (!certificateId || !departmentName) {
      throw new ValidationError('commit requires certificateId and departmentName', { certificateId, departmentName });
    }

    const record = {
      certificateId,
      departmentName,
      artifactId: artifactId || null,
      checksum: checksum || null,
      committedAt: new Date().toISOString()
    };
    await this.storage.ledgerSet(certificateId, record);

    const priorVersions = subjectKey ? await this._versionsFor(subjectKey, departmentName) : [];

    const knowledgeEntry = {
      category: category || null,
      departmentName,
      certificateId,
      artifactId: artifactId || null,
      summary: summary || `Certified artifact for ${departmentName}`,
      content: content || null,
      subjectKey: subjectKey || null,
      version: subjectKey ? priorVersions.length + 1 : 1,
      committedAt: record.committedAt
    };
    await this.storage.knowledgePush(knowledgeEntry);

    return record;
  }

  // --- Retrieve ----------------------------------------------------------
  /** Read-only. Any department may confirm a commit landed. */
  async confirmCommit(certificateId) {
    const record = await this.storage.ledgerGet(certificateId);
    return record ? { committed: true, committedAt: record.committedAt } : { committed: false };
  }

  /** Read-only. Any department may query certified knowledge by structural fields. */
  async query({ departmentName, category, topic, subjectKey } = {}) {
    const all = await this.storage.knowledgeAll();
    return all.filter((entry) => {
      if (departmentName && entry.departmentName !== departmentName) return false;
      if (category && entry.category !== category) return false;
      if (subjectKey && entry.subjectKey !== subjectKey) return false;
      if (topic && !JSON.stringify(entry).toLowerCase().includes(String(topic).toLowerCase())) return false;
      return true;
    });
  }

  // --- Version -------------------------------------------------------------
  /**
   * `departmentName` is optional here deliberately: a subjectKey like
   * "staffing-pattern:sales" is already unambiguous on its own, and the
   * department that CONTRIBUTED a piece of knowledge (e.g. Engineering,
   * producing a staffing pattern) is often different from the department
   * the knowledge is ABOUT (e.g. Sales, the subject of that pattern) —
   * the artifact being certified is correctly tagged with the latter, so
   * looking it back up by the former would never match anything.
   */
  async _versionsFor(subjectKey, departmentName = null) {
    const all = await this.storage.knowledgeAll();
    return all
      .filter((e) => e.subjectKey === subjectKey && (!departmentName || e.departmentName === departmentName))
      .sort((a, b) => a.version - b.version);
  }

  /** Full version history for a subject, oldest first. */
  async versionHistory(subjectKey, departmentName = null) {
    return this._versionsFor(subjectKey, departmentName);
  }

  /** The most recent version of a subject, or null if it has never been committed. */
  async latestVersion(subjectKey, departmentName = null) {
    const versions = await this._versionsFor(subjectKey, departmentName);
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }

  // --- Search --------------------------------------------------------------
  /**
   * Free-text search across every knowledge entry's structural fields and
   * content — for when a department doesn't know the exact department/
   * category/subjectKey to query by, only roughly what it's looking for.
   */
  async search(queryString) {
    if (!queryString) return [];
    const needle = String(queryString).toLowerCase();
    const all = await this.storage.knowledgeAll();
    return all.filter((entry) => JSON.stringify(entry).toLowerCase().includes(needle));
  }

  // --- Relationships ---------------------------------------------------------
  /** Links two certified knowledge entries together (e.g. a Trend Contract relates to a Market Contract). */
  async relate(certificateIdA, certificateIdB, relationshipType = 'related') {
    if (!certificateIdA || !certificateIdB) {
      throw new ValidationError('relate requires two certificateIds', { certificateIdA, certificateIdB });
    }
    await this.storage.relationshipAdd(certificateIdA, certificateIdB, relationshipType);
    return { certificateIdA, certificateIdB, relationshipType };
  }

  /** Every knowledge entry related to a given certificate, in either direction. */
  async getRelated(certificateId) {
    const edges = await this.storage.relationshipsFor(certificateId);
    if (edges.length === 0) return [];
    const all = await this.storage.knowledgeAll();
    const byId = new Map(all.map((e) => [e.certificateId, e]));
    return edges
      .map((edge) => ({
        relationshipType: edge.relationshipType,
        entry: byId.get(edge.otherCertificateId) || null
      }))
      .filter((r) => r.entry !== null);
  }

  // --- Organizational growth (dashboard-facing) -------------------------------------
  async growth() {
    const all = await this.storage.knowledgeAll();
    const byCategory = {};
    const byDepartment = {};
    for (const entry of all) {
      const categoryKey = entry.category || 'Uncategorized';
      byCategory[categoryKey] = (byCategory[categoryKey] || 0) + 1;
      byDepartment[entry.departmentName] = (byDepartment[entry.departmentName] || 0) + 1;
    }
    return { totalEntries: all.length, byCategory, byDepartment };
  }
}

module.exports = { PlatformMemoryStore };
