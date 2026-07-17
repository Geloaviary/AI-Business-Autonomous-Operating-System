'use strict';

/**
 * manager.js
 * ---------------------------------------------------------------------------
 * The Quality Assurance Director. Orchestrates every employee in this
 * department into the actual certification workflow:
 *
 *   Submission -> Prediction (informational) -> Constitutional Audit ->
 *   Department-Specific Review -> Decision -> [PASS: commit to Platform
 *   Memory] / [FAIL: repair plan, and escalate if attempts are exhausted]
 *
 * Public entry point is `certify(submission)`, returning
 * { verdict: 'PASS', certificateId } or { verdict: 'FAIL', issues, repairPlan, escalated }
 * — this exact shape is what every department's output.js calls, and it
 * does not change based on which department is submitting.
 * ---------------------------------------------------------------------------
 */

const { Contract } = require('./contract');
const { CertificationRecord } = require('./artifact');
const { ExecutionState } = require('./state');
const { STATUS, VERDICT } = require('./constants');
const { RepairExhaustedError } = require('./errors');
const config = require('./config');
const knowledge = require('./knowledge');
const views = require('./views');

class QADManager {
  constructor({ agents, events, output, input, history, learning, repairCoordinator, analytics }) {
    this.agents = agents;
    this.events = events;
    this.output = output;
    this.input = input;
    this.history = history;
    this.learning = learning;
    this.repairCoordinator = repairCoordinator;
    this.analytics = analytics;
    // Tracks resubmission attempts per contractId across calls, so repeated
    // failure on the same underlying work is recognized instead of treated
    // as a fresh, unrelated submission each time.
    this._attemptsByArtifact = new Map();
  }

  /**
   * @param {Object} submission - { departmentName, artifactId, files? , payload?, checksum, mandatoryFiles? }
   * @returns {Promise<{verdict: string, certificateId?: string, issues?: Array, repairPlan?: Object, escalated?: boolean}>}
   */
  async certify(submission) {
    const contract = new Contract({
      departmentName: submission.departmentName,
      artifactId: submission.artifactId,
      submission
    });
    const state = new ExecutionState(contract.id);
    state.transition(STATUS.RECEIVED);
    this.events.publish('SubmissionReceived', { contractId: contract.id, departmentName: submission.departmentName });

    const attemptKey = submission.artifactId || contract.id;
    const attempt = this._attemptsByArtifact.get(attemptKey) || 0;

    try {
      // Prediction is informational only — never blocks or changes the outcome.
      const prediction = this.agents.predictionAnalyst.assess(submission);
      this.events.publish('PredictionAssessed', { contractId: contract.id, prediction });

      state.transition(STATUS.AUDITING);
      this.events.publish('AuditStarted', { contractId: contract.id });
      const constitutionalIssues = this.agents.constitutionalAuditor.audit(submission, {
        mandatoryFiles: submission.mandatoryFiles
      });
      this.events.publish('AuditCompleted', { contractId: contract.id, issueCount: constitutionalIssues.length });

      state.transition(STATUS.DEPARTMENT_REVIEW);
      this.events.publish('DepartmentReviewStarted', { contractId: contract.id });
      const departmentReview = this.agents.departmentLiaison.review(submission);
      this.events.publish('DepartmentReviewCompleted', { contractId: contract.id, ran: departmentReview.ran });

      const issues = [...constitutionalIssues, ...departmentReview.issues];

      state.transition(STATUS.DECIDING);

      if (issues.length > 0) {
        return await this._reject({ contract, state, submission, issues, attempt, attemptKey });
      }

      return await this._certify({ contract, state, submission });
    } catch (err) {
      this.events.publish('Failure', { contractId: contract.id, error: err.message });
      state.transition(STATUS.FAILED, { error: err.message });
      throw err;
    }
  }

  async _reject({ contract, state, submission, issues, attempt, attemptKey }) {
    state.transition(STATUS.REJECTED);
    this.history.record('REJECTION', { departmentName: submission.departmentName, issues, contractId: contract.id });
    this.learning.recordRejection({ departmentName: submission.departmentName, issues });
    this.events.publish('Rejected', { contractId: contract.id, issues });

    const repairPlan = this.repairCoordinator.issuePlan({
      contractId: contract.id,
      departmentName: submission.departmentName,
      issues
    });

    const nextAttempt = attempt + 1;
    this._attemptsByArtifact.set(attemptKey, nextAttempt);

    const shouldEscalate = this.agents.escalationOfficer.shouldEscalate(nextAttempt);
    if (shouldEscalate) {
      state.transition(STATUS.ESCALATED);
      this.history.record('ESCALATION', { departmentName: submission.departmentName, attempt: nextAttempt, contractId: contract.id });
      this.learning.recordEscalation({ departmentName: submission.departmentName, attempt: nextAttempt });
      this.events.publish('Escalated', { contractId: contract.id, attempt: nextAttempt });
    }

    return { verdict: VERDICT.FAIL, issues, repairPlan, escalated: shouldEscalate };
  }

  async _certify({ contract, state, submission }) {
    const knowledgeExtract = this._extractKnowledge(submission);

    const record = new CertificationRecord({
      contractId: contract.id,
      departmentName: submission.departmentName,
      verdict: VERDICT.PASS,
      checksum: submission.checksum,
      checkedRules: { constitutional: true, departmentSpecific: true },
      knowledgeExtract
    });

    state.transition(STATUS.CERTIFIED);
    this.history.record('CERTIFICATION', { departmentName: submission.departmentName, certificateId: record.id, contractId: contract.id });
    this.learning.recordCertification({ departmentName: submission.departmentName, certificateId: record.id });
    this.events.publish('Certified', { contractId: contract.id, certificateId: record.id });

    await this.output.commit(record, {
      summary: submission.knowledge?.type ? `${submission.knowledge.type} for ${submission.departmentName}` : `Certified artifact for ${submission.departmentName}`,
      category: submission.knowledge?.type,
      subjectKey: submission.knowledge?.subjectKey
    });

    const confirmation = await this.input.confirmCommit(record.id);
    if (!confirmation.committed) {
      throw new RepairExhaustedError('Platform Memory did not confirm the commit', { certificateId: record.id });
    }

    state.transition(STATUS.COMMITTED);
    this.events.publish('MemoryCommitted', { certificateId: record.id });

    this._attemptsByArtifact.delete(submission.artifactId || contract.id);

    return { verdict: VERDICT.PASS, certificateId: record.id };
  }

  /**
   * Distills the substance of a certified submission into something a
   * future specialist can actually cite as precedent.
   *
   * Preferred path: the submitting department already transformed its own
   * artifact via its own knowledge.js/views.js BEFORE submission (see
   * Engineering's manager.js and the generated department template) —
   * QAD just carries that already-formed knowledge through untouched. QAD
   * does not and should not understand what a "DepartmentStaffingPattern"
   * or a "MarketContract" means; only the department that produced it does.
   *
   * Fallback: older-style submissions that only include raw
   * `payload.contributions` (pre-dating knowledge.js/views.js) still get a
   * best-effort extract, so nothing that worked before silently breaks.
   */
  _extractKnowledge(submission) {
    if (submission.knowledge) {
      return { knowledge: submission.knowledge, views: submission.views || null };
    }

    const contributions = submission.payload?.contributions;
    if (!Array.isArray(contributions) || contributions.length === 0) return null;
    return {
      contributions: contributions.map((c) => ({
        role: c.role,
        responsibility: c.responsibility,
        result: c.result,
        knowledgeSource: c.knowledgeSource
      }))
    };
  }

  /** Read-only certification history — what the dashboard's Quality Assurance Center displays. */
  async getCertifications() {
    return this.history.all().slice().reverse();
  }

  /**
   * Distills accumulated certification history for a department into a
   * QualityPattern and commits it to Platform Memory — using QAD's own
   * commit authority, the same as any other certified knowledge. Not
   * triggered automatically on every certification (that would commit
   * near-duplicate patterns constantly); callable on demand, e.g. before
   * Engineering builds another department of this type, or periodically
   * from the dashboard.
   */
  async publishQualityPattern(departmentName) {
    const knowledgeObject = knowledge.transform({ departmentName, analytics: this.analytics });
    const knowledgeViews = views.buildViews(knowledgeObject);

    const record = new CertificationRecord({
      contractId: `quality-pattern-${departmentName}`,
      departmentName,
      verdict: VERDICT.PASS,
      checkedRules: { qualityPatternSynthesis: true },
      knowledgeExtract: { knowledge: knowledgeObject, views: knowledgeViews }
    });

    await this.output.commit(record, {
      summary: `Quality pattern for ${departmentName}`,
      category: knowledgeObject.type,
      subjectKey: knowledgeObject.subjectKey
    });

    return knowledgeObject;
  }
}

module.exports = { QADManager };
