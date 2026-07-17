'use strict';

/**
 * repair.js
 * ---------------------------------------------------------------------------
 * QAD's repair coordination. Critically different from Engineering's
 * repair.js: Engineering's repair produces new CODE (a new artifact).
 * QAD's repair produces a diagnostic PLAN — QAD is a judge, not a builder;
 * it tells the submitting department what's wrong and how to think about
 * fixing it, but never writes the fix itself. That's Engineering's job
 * (or whichever department submitted the failing artifact).
 * ---------------------------------------------------------------------------
 */

const { RepairExhaustedError } = require('./errors');

class RepairCoordinator {
  /** @param {Object} [deps] @param {import('./events').DepartmentEventBus} [deps.events] */
  constructor({ events } = {}) {
    this.events = events;
  }

  buildPlan(issues) {
    return {
      issues,
      actionableSteps: issues.map((issue) => ({
        category: issue.category,
        instruction: issue.missingFile
          ? `Generate the missing file: ${issue.missingFile}`
          : `Resolve: ${issue.message}`
      })),
      createdAt: new Date().toISOString()
    };
  }

  issuePlan({ contractId, departmentName, issues }) {
    const plan = this.buildPlan(issues);
    this.events?.publish('RepairPlanIssued', { contractId, departmentName, plan });
    return plan;
  }

  enforceAttemptLimit(attempt, maxAttempts) {
    if (attempt > maxAttempts) {
      throw new RepairExhaustedError('Maximum resubmission attempts exceeded without escalation', { attempt, maxAttempts });
    }
  }
}

module.exports = { RepairCoordinator };
