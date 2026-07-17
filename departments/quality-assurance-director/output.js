'use strict';

/**
 * output.js
 * ---------------------------------------------------------------------------
 * QAD's WRITE interface to Platform Memory. This is the one place in all
 * of BAOS where the commit authority token (see platform-memory's
 * commit-authority.js) is actually presented. No other department holds
 * this token — that's what makes "only QAD may commit organizational
 * knowledge" an enforced rule instead of a comment.
 * ---------------------------------------------------------------------------
 */

const { CommitError } = require('./errors');

class QADOutput {
  /**
   * @param {ReturnType<import('../../platform-memory').createPlatformMemory>} platformMemory
   * @param {string} commitAuthorityToken - Granted once at composition time.
   */
  constructor(platformMemory, commitAuthorityToken) {
    if (!platformMemory || !commitAuthorityToken) {
      throw new CommitError('QADOutput requires platformMemory and a commitAuthorityToken');
    }
    this.platformMemory = platformMemory;
    this.token = commitAuthorityToken;
  }

  async commit(certificationRecord, { category, summary, subjectKey } = {}) {
    return this.platformMemory.commit({
      certificateId: certificationRecord.id,
      departmentName: certificationRecord.departmentName,
      artifactId: certificationRecord.contractId,
      checksum: certificationRecord.checksum,
      category,
      subjectKey,
      summary: summary || `Certified artifact for ${certificationRecord.departmentName}`,
      content: certificationRecord.knowledgeExtract,
      authorityToken: this.token
    });
  }
}

module.exports = { QADOutput };
