'use strict';

/**
 * index.js
 * ---------------------------------------------------------------------------
 * Entry point and composition root for the Engineering Department.
 * Wires together the AI Workforce, processors, builders, adapters, and the
 * constitutional lifecycle modules (manager, runtime, output, input,
 * memory, learning, history, analytics, metrics, engineering health).
 *
 * Platform Memory and the Quality Assurance Director are standalone BAOS
 * departments/services now — Engineering CONNECTS to them as a client,
 * the same way every other department does. It does not own, stub, or
 * bundle private copies of either. If none are injected, this composition
 * root creates real standalone instances of both (imported from their own
 * packages) so Engineering remains runnable in isolation — but they are
 * genuinely the same modules a full BAOS deployment uses, not
 * Engineering-flavored fakes.
 *
 * Callers who just want to run the department standalone can do:
 *
 *   const { createEngineeringDepartment } = require('./index');
 *   const dept = createEngineeringDepartment();
 *   await dept.runtime.start();
 *   const result = await dept.runtime.submitRequest({
 *     businessObjective: 'Create a Procurement Department.',
 *     requestedBy: 'CEO',
 *     capabilities: ['Supplier sourcing', 'Purchase order tracking']
 *   });
 *
 * A full deployment instead shares ONE Platform Memory and ONE QAD
 * instance across every department:
 *
 *   const platformMemory = createPlatformMemory({ storage: new RedisStorage(redis) });
 *   const qad = createQualityAssuranceDirector({ platformMemory });
 *   const engineering = createEngineeringDepartment({ platformMemory, qad });
 * ---------------------------------------------------------------------------
 */

const { DepartmentEventBus } = require('./events');
const { EngineeringManager } = require('./manager');
const { EngineeringRuntime } = require('./runtime');
const { EngineeringOutput } = require('./output');
const { EngineeringInput } = require('./input');
const { EngineeringMemory } = require('./memory');
const { HistoryLog } = require('./history');
const { LearningEngine } = require('./learning');
const { Analytics } = require('./analytics');
const { Metrics } = require('./metrics');
const { EngineeringHealth } = require('./engineering');
const { Registry } = require('./registry');

const { OpenAIAdapter } = require('./adapters/openai');
const { FilesystemAdapter } = require('./adapters/filesystem');
const { ArchiverAdapter } = require('./adapters/archiver');

const { createPlatformMemory } = require('../../platform-memory');
const { createQualityAssuranceDirector } = require('../quality-assurance-director');

const { InMemoryPendingActivations } = require('./pending-activations');

const Agents = require('./agents/index');
const { ROLES } = require('./constants');

function buildAgents({ openai, memory }) {
  const deps = { openai, memory };
  return {
    chiefArchitect: new Agents.ChiefArchitect(deps),
    projectArchitect: new Agents.ProjectArchitect(deps),
    seniorSoftwareEngineer: new Agents.SeniorSoftwareEngineer(deps),
    constitutionalEngineer: new Agents.ConstitutionalEngineer(deps),
    workforceResearchAnalyst: new Agents.WorkforceResearchAnalyst(deps),
    workforceEngineer: new Agents.WorkforceEngineer(deps),
    backendEngineer: new Agents.BackendEngineer(deps),
    frontendEngineer: new Agents.FrontendEngineer(deps),
    fullStackEngineer: new Agents.FullStackEngineer(deps),
    databaseEngineer: new Agents.DatabaseEngineer(deps),
    securityEngineer: new Agents.SecurityEngineer(deps),
    qaEngineer: new Agents.QAEngineer(deps),
    documentationEngineer: new Agents.DocumentationEngineer(deps),
    deploymentEngineer: new Agents.DeploymentEngineer(deps),
    repairEngineer: new Agents.RepairEngineer(deps)
  };
}

/**
 * @param {Object} [overrides]
 * @param {ReturnType<import('../../platform-memory').createPlatformMemory>} [overrides.platformMemory] -
 *   Shared Platform Memory instance. Defaults to a fresh standalone instance
 *   (in-memory storage) if not provided — share ONE instance across every
 *   department in a real deployment.
 * @param {ReturnType<import('../quality-assurance-director').createQualityAssuranceDirector>} [overrides.qad] -
 *   Shared QAD instance. Defaults to a fresh standalone instance wired to
 *   the resolved platformMemory above.
 * @param {boolean} [overrides.autoActivate] - When true (default), certified
 *   artifacts flow straight through to ACTIVE + PACKAGED. When false, they
 *   stop at COMMITTED and wait for an explicit manager.activateDepartment()
 *   call — this is how the Executive Dashboard runs it.
 * @param {Object} [overrides.pendingActivations] - Store for artifacts awaiting
 *   executive activation (e.g. PendingActivationsKV for Vercel). Defaults
 *   to an in-memory store scoped to this process.
 * @param {Object} [overrides.openaiClient] - Real OpenAI SDK client; defaults to offline simulator.
 */
function createEngineeringDepartment(overrides = {}) {
  const events = new DepartmentEventBus();

  const platformMemory = overrides.platformMemory || createPlatformMemory();
  const qad = overrides.qad || createQualityAssuranceDirector({ platformMemory });

  const openai = new OpenAIAdapter({ client: overrides.openaiClient });
  const memory = new EngineeringMemory(platformMemory);
  const filesystem = new FilesystemAdapter();
  const archiver = new ArchiverAdapter();

  const history = new HistoryLog();
  const learning = new LearningEngine({ events });
  const analytics = new Analytics({ history, learning, openaiAdapter: openai });
  const metrics = new Metrics({ analytics, history });

  // qad.runtime.certify(submission) is what output.js calls — QAD's own
  // runtime IS the "qadClient" here, not a stand-in for it.
  const output = new EngineeringOutput({ qadClient: qad.runtime, events });
  const input = new EngineeringInput({ platformMemoryClient: platformMemory, events });

  const agents = buildAgents({ openai, memory });

  const registry = new Registry();
  for (const [name, agent] of Object.entries(agents)) {
    registry.register('agents', name, agent);
  }

  const manager = new EngineeringManager({
    agents, events, output, input, memory, history, learning, filesystem, archiver,
    autoActivate: overrides.autoActivate,
    pendingActivations: overrides.pendingActivations || new InMemoryPendingActivations()
  });

  const runtime = new EngineeringRuntime({ manager, events });

  const health = new EngineeringHealth({ runtime, events, memory, openai, qadClient: qad.runtime });

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
    platformMemory,
    qad,
    adapters: { openai, filesystem, archiver }
  };
}

module.exports = { createEngineeringDepartment, ROLES };
