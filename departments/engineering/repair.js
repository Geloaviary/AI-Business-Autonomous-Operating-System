'use strict';

/**
 * repair.js
 * ---------------------------------------------------------------------------
 * Handles rejected artifacts.
 * Input:  a QAD Repair Report (or internal validation failure report).
 * Output: a Repair Plan, executed by the RepairEngineer agent, resulting in
 *         a brand-new Artifact.
 *
 * Constitutional rule: repair NEVER modifies an existing artifact. Artifacts
 * are immutable (see artifact.js). Every repair produces a new artifact with
 * `parentArtifactId` pointing at the one it supersedes.
 * ---------------------------------------------------------------------------
 */

const { Artifact } = require('./artifact');
const { RepairExhaustedError } = require('./errors');
const config = require('./config');

class RepairCoordinator {
  /**
   * @param {Object} deps
   * @param {import('./agents/index').RepairEngineer} deps.repairEngineer
   * @param {import('./events').DepartmentEventBus} deps.events
   */
  constructor({ repairEngineer, events }) {
    this.repairEngineer = repairEngineer;
    this.events = events;
  }

  buildRepairPlan(rejectionReport) {
    return {
      issues: rejectionReport.issues || [],
      strategy: (rejectionReport.issues || []).some(i => i.missingFile)
        ? 'GENERATE_MISSING_FILES'
        : 'MANUAL_REVIEW_REQUIRED',
      createdAt: new Date().toISOString()
    };
  }

  async repair({ artifact, rejectionReport, attempt }) {
    if (attempt > config.execution.maxRepairAttempts) {
      throw new RepairExhaustedError('Maximum repair attempts exceeded', {
        artifactId: artifact.id,
        attempt,
        maxAttempts: config.execution.maxRepairAttempts
      });
    }

    this.events?.publish('RepairStarted', { artifactId: artifact.id, attempt });

    const plan = this.buildRepairPlan(rejectionReport);
    const contribution = await this.repairEngineer.perform({
      rejectionReport,
      files: artifact.files
    });

    const repaired = new Artifact({
      contractId: artifact.contractId,
      departmentName: artifact.departmentName,
      files: contribution.repairedFiles,
      architecture: artifact.architecture,
      contributors: [...artifact.contributors, this.repairEngineer.role],
      parentArtifactId: artifact.id
    });

    this.events?.publish('RepairCompleted', {
      previousArtifactId: artifact.id,
      newArtifactId: repaired.id,
      actions: contribution.actions,
      attempt
    });

    return { artifact: repaired, plan, actions: contribution.actions };
  }
}

module.exports = { RepairCoordinator };
