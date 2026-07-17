'use strict';

/**
 * events.js
 * ---------------------------------------------------------------------------
 * QAD's event bus. Every certification decision, repair plan, and
 * escalation is published here — this is what the dashboard's Quality
 * Assurance Center watches in real time.
 * ---------------------------------------------------------------------------
 */

const { EventEmitter } = require('events');

const EVENT_NAMES = Object.freeze({
  SUBMISSION_RECEIVED: 'SubmissionReceived',
  PREDICTION_ASSESSED: 'PredictionAssessed',
  AUDIT_STARTED: 'AuditStarted',
  AUDIT_COMPLETED: 'AuditCompleted',
  DEPARTMENT_REVIEW_STARTED: 'DepartmentReviewStarted',
  DEPARTMENT_REVIEW_COMPLETED: 'DepartmentReviewCompleted',
  CERTIFIED: 'Certified',
  REJECTED: 'Rejected',
  REPAIR_PLAN_ISSUED: 'RepairPlanIssued',
  ESCALATED: 'Escalated',
  MEMORY_COMMITTED: 'MemoryCommitted',
  LEARNING_RECORDED: 'LearningRecorded',
  HEALTH_CHECK: 'HealthCheck',
  FAILURE: 'Failure'
});

class DepartmentEventBus extends EventEmitter {
  constructor({ historyLimit = 500 } = {}) {
    super();
    this.setMaxListeners(100);
    this._history = [];
    this._historyLimit = historyLimit;
  }

  publish(eventName, payload = {}) {
    const record = { event: eventName, payload, at: new Date().toISOString() };
    this._history.push(record);
    if (this._history.length > this._historyLimit) this._history.shift();
    this.emit(eventName, record);
    this.emit('*', record);
    return record;
  }

  recent(limit = 50) {
    return this._history.slice(-limit);
  }
}

module.exports = { EVENT_NAMES, DepartmentEventBus };
