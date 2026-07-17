'use strict';

/**
 * index.js
 * ---------------------------------------------------------------------------
 * Composition root for the Quality Assurance Director — a standalone BAOS
 * department, a peer to Engineering, not owned by it. Requires a live
 * Platform Memory instance to be injected; QAD does not bundle its own
 * copy of Platform Memory, because Platform Memory is shared organizational
 * infrastructure, not something any single department — including QAD
 * itself — owns.
 *
 * Composition contract:
 *   const platformMemory = createPlatformMemory();
 *   const qad = createQualityAssuranceDirector({ platformMemory });
 *   await qad.runtime.start();
 *   const verdict = await qad.runtime.certify(submission);
 * ---------------------------------------------------------------------------
 */

const { DepartmentEventBus } = require('./events');
const { QADManager } = require('./manager');
const { Runtime } = require('./runtime');
const { QADOutput } = require('./output');
const { QADInput } = require('./input');
const { QADMemory } = require('./memory');
const { HistoryLog } = require('./history');
const { LearningEngine } = require('./learning');
const { Analytics } = require('./analytics');
const { Metrics } = require('./metrics');
const { QualityAssuranceDirectorHealth } = require('./quality-assurance-director');
const { Registry } = require('./registry');
const { RepairCoordinator } = require('./repair');
const { ConfigError } = require('./errors');

const Agents = require('./agents/index');
const config = require('./config');

/**
 * @param {Object} deps
 * @param {ReturnType<import('../../platform-memory').createPlatformMemory>} deps.platformMemory - REQUIRED.
 */
function createQualityAssuranceDirector(deps = {}) {
  if (!deps.platformMemory) {
    throw new ConfigError(
      'createQualityAssuranceDirector requires a platformMemory instance. ' +
      "Platform Memory is shared organizational infrastructure — see platform-memory/index.js — " +
      'QAD connects to it as a client, the same as every other department.'
    );
  }

  const platformMemory = deps.platformMemory;
  const commitAuthorityToken = platformMemory.grantCommitAuthority();

  const events = new DepartmentEventBus();
  const registry = new Registry();

  const memory = new QADMemory(platformMemory);
  const output = new QADOutput(platformMemory, commitAuthorityToken);
  const input = new QADInput(platformMemory);

  const history = new HistoryLog();
  const learning = new LearningEngine({ events });
  const analytics = new Analytics({ history, learning });
  const metrics = new Metrics({ analytics, history });
  const repairCoordinator = new RepairCoordinator({ events });

  const agents = {
    chiefComplianceOfficer: new Agents.ChiefComplianceOfficer(),
    constitutionalAuditor: new Agents.ConstitutionalAuditor(),
    departmentLiaison: new Agents.DepartmentLiaison(registry),
    escalationOfficer: new Agents.EscalationOfficer(config),
    qualityHistorian: new Agents.QualityHistorian(history),
    predictionAnalyst: new Agents.PredictionAnalyst(learning, config)
  };

  const manager = new QADManager({ agents, events, output, input, history, learning, repairCoordinator, analytics });
  const runtime = new Runtime({ manager });
  const health = new QualityAssuranceDirectorHealth({ events, memory, platformMemory });

  return {
    runtime,
    manager,
    events,
    agents,
    registry,
    memory,
    history,
    learning,
    analytics,
    metrics,
    health,

    /** Lets a department register its own optional validation rules — see registry.js and validators.js. */
    registerDepartmentRules: (departmentName, ruleFn) => registry.registerDepartmentRules(departmentName, ruleFn)
  };
}

module.exports = { createQualityAssuranceDirector };
