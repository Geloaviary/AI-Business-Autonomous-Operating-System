'use strict';

/**
 * agents/index.js
 * ---------------------------------------------------------------------------
 * The complete AI Workforce roster for the Engineering Department.
 * Each class below is one specialized employee with a single responsibility.
 * manager.js assigns work to these agents; they never invoke one another
 * directly — all collaboration is orchestrated.
 *
 * ConstitutionalEngineer was added after auditing generated output: without
 * it, departments Engineering built got empty stub versions of contract.js,
 * artifact.js, validators.js, etc. — file-structure-complete but not
 * functionally complete. ConstitutionalEngineer generates the same kind of
 * real, working infrastructure Engineering's own constitutional files
 * contain, adapted per department. See agents/constitutional-templates.js.
 * ---------------------------------------------------------------------------
 */

const { BaseAgent } = require('./base-agent');
const { ROLES, MANDATORY_FILES, selfHealthFile } = require('../constants');
const { generateConstitutionalFiles } = require('./constitutional-templates');
const { matchArchetype, GENERIC_FALLBACK_ROLES } = require('./workforce-archetypes');

function pascalCase(name) {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

/** Turns a business capability like "Supplier sourcing" into a role name like "SupplierSourcingSpecialist" — used only as a supplemental role for executive-requested capabilities not covered by the researched staffing pattern. */
function roleNameFromCapability(capability) {
  const words = String(capability).replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/);
  const pascal = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  return `${pascal}Specialist`;
}

/** Sets overall technical direction and approves the architecture plan. */
class ChiefArchitect extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.CHIEF_ARCHITECT }); }
  async perform(task) {
    const { knowledge, source } = await this.consultKnowledge(task.businessObjective, {
      promptBuilder: (topic) => `As Chief Architect, define guiding technical principles for: ${topic}`
    });
    return this.contribution({
      principles: [
        'Preserve constitutional file structure',
        'No department writes directly to Platform Memory',
        'Prefer composition over monolith',
        'Every module has a single responsibility'
      ],
      knowledgeSource: source,
      notes: knowledge
    });
  }
}

/** Translates the Contract into a concrete department architecture plan. */
class ProjectArchitect extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.PROJECT_ARCHITECT }); }
  async perform(task) {
    const { contract } = task;
    const departmentName = contract.targetDepartmentName || this._deriveName(contract.businessObjective);
    const plan = {
      departmentName,
      // Every department requires the shared mandatory set PLUS its own
      // self-named health file (e.g. `research.js` for Research), matching
      // the pattern Engineering itself follows with `engineering.js`.
      mandatoryFiles: [...MANDATORY_FILES, selfHealthFile(departmentName)],
      optionalDirectories: this._selectOptionalDirectories(contract),
      capabilities: contract.capabilities,
      dataModels: this._deriveDataModels(contract)
    };
    return this.contribution({ plan });
  }
  _deriveName(objective) {
    const match = /create an?\s+(.+?)\s+department/i.exec(objective || '');
    const raw = match ? match[1] : 'NewDepartment';
    return raw.trim().replace(/\s+/g, '-').toLowerCase();
  }
  _selectOptionalDirectories(contract) {
    const dirs = new Set(['adapters', 'agents', 'schemas', 'tests']);
    if ((contract.capabilities || []).some(c => /ui|dashboard|frontend/i.test(c))) {
      dirs.add('ui');
    }
    dirs.add('learning');
    return Array.from(dirs);
  }
  _deriveDataModels(contract) {
    return (contract.capabilities || []).map(cap => ({
      name: cap.replace(/\s+/g, ''),
      description: `Data model supporting capability: ${cap}`
    }));
  }
}

/** Senior technical reviewer — sanity-checks the plan before build begins. */
class SeniorSoftwareEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.SENIOR_SOFTWARE_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const issues = [];
    if (!plan.mandatoryFiles || plan.mandatoryFiles.length === 0) {
      issues.push('Plan is missing mandatory constitutional files');
    }
    if (!plan.departmentName) issues.push('Plan is missing a department name');
    return this.contribution({
      approved: issues.length === 0,
      issues,
      reviewedPlan: plan
    });
  }
}

/**
 * Generates the real constitutional plumbing (contract, artifact, events,
 * validators, repair, learning, memory, history, analytics, metrics, state,
 * registry, config, constants, errors, output, input, ui-builder, self-health)
 * for the department being built. See constitutional-templates.js.
 */
class ConstitutionalEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.CONSTITUTIONAL_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = generateConstitutionalFiles(plan);
    return this.contribution({ files });
  }
}

/**
 * Determines what a new department's workforce should actually be —
 * researched from Engineering's own knowledge of how that kind of business
 * unit operates, NOT mechanically derived from whatever an executive typed
 * into a capabilities box. That distinction matters: a founder saying
 * "Create a Marketing Department" shouldn't need to also specify job
 * titles for it to be staffed correctly, any more than a real CEO hiring
 * a marketing lead would ask the founder to design the team structure.
 *
 * Knowledge priority, matching the platform's own strategy:
 *   1. Platform Memory — has a similar department's staffing pattern
 *      already been certified? Reuse institutional precedent first.
 *   2. workforce-archetypes.js — Engineering's own built-in expertise
 *      about common department types, matched by keyword.
 *   3. OpenAI — provisional research, only for a genuinely novel
 *      department type neither of the above recognizes.
 *
 * Executive-specified capabilities are consulted LAST, and only
 * additively: if something the executive explicitly asked for isn't
 * covered by the researched roster, one supplemental role is added for
 * it. They are never the primary mechanism for deciding headcount or
 * role composition.
 */
class WorkforceResearchAnalyst extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.WORKFORCE_RESEARCH_ANALYST }); }

  async research({ departmentName, businessObjective, capabilities }) {
    const precedent = await this._checkPlatformMemoryPrecedent(departmentName);
    if (precedent) return this._finalize(precedent.roles, 'PLATFORM_MEMORY', capabilities);

    const archetypeMatch = matchArchetype(departmentName, businessObjective);
    if (archetypeMatch) return this._finalize(archetypeMatch.roles, 'ARCHETYPE_LIBRARY', capabilities);

    const researched = await this._researchViaOpenAI(departmentName, businessObjective);
    return this._finalize(researched, 'OPENAI', capabilities);
  }

  async _checkPlatformMemoryPrecedent(departmentName) {
    if (!this.memory) return null;
    try {
      const pattern = await this.memory.findStaffingPattern(departmentName);
      return pattern && Array.isArray(pattern.roles) && pattern.roles.length > 0
        ? { roles: pattern.roles.map((r) => ({ ...r })) }
        : null;
    } catch {
      return null;
    }
  }

  async _researchViaOpenAI(departmentName, businessObjective) {
    const prompt = `Research what specialized roles a real, lean "${departmentName}" business ` +
      `department needs, and how many workers per role. Business objective: ${businessObjective}. ` +
      `Respond as JSON: {"roles":[{"title":string,"responsibility":string,"count":number}]}`;
    try {
      const result = await this.openai.completeJSON(prompt, { role: this.role });
      if (Array.isArray(result?.roles) && result.roles.length > 0) return result.roles;
    } catch {
      // fall through to generic fallback below
    }
    return GENERIC_FALLBACK_ROLES.map((r) => ({ ...r }));
  }

  /** Executive capabilities are additive-only: filled in where the researched roster has a genuine gap. */
  _finalize(roles, source, capabilities) {
    const coveredText = roles.map((r) => `${r.title} ${r.responsibility}`.toLowerCase()).join(' | ');
    const supplementalRoles = [];

    for (const capability of (capabilities || [])) {
      const words = String(capability).toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const matchedWords = words.filter((word) => coveredText.includes(word));
      // Require a genuine majority overlap, not a single incidental shared
      // word (e.g. "tracking" appearing in an unrelated role's description
      // shouldn't count "blockchain provenance tracking" as covered).
      const alreadyCovered = words.length > 0 && matchedWords.length / words.length > 0.5;
      if (!alreadyCovered) {
        supplementalRoles.push({
          title: roleNameFromCapability(capability),
          responsibility: `Handles: ${capability} (executive-requested; not covered by the researched staffing pattern)`,
          count: 1
        });
      }
    }

    return {
      roles: [...roles, ...supplementalRoles],
      source,
      researchedRoleCount: roles.length,
      supplementalRoleCount: supplementalRoles.length
    };
  }
}

/**
 * Hires the specialized workforce for the department being built, based
 * entirely on WorkforceResearchAnalyst's researched roster (plan.workforcePlan)
 * — never on raw executive-typed capability text. Also gives the department
 * its own OpenAI adapter, so its workforce can consult provisional
 * knowledge the same way Engineering's own agents do.
 */
class WorkforceEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.WORKFORCE_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['adapters/openai.js'] = workforceOpenAITemplate();
    files['agents/base-agent.js'] = workforceBaseAgentTemplate();
    files['agents/index.js'] = workforceIndexTemplate(plan);
    const roleCount = (plan.workforcePlan?.roles || []).reduce((sum, r) => sum + (r.count || 1), 0);
    return this.contribution({ files, employeeCount: roleCount, workforceSource: plan.workforcePlan?.source });
  }
}


class BackendEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.BACKEND_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['manager.js'] = backendManagerTemplate(plan);
    files['runtime.js'] = backendRuntimeTemplate(plan);
    files['service.js'] = backendServiceTemplate(plan);
    return this.contribution({ files });
  }
}

/** Implements the department's UI/dashboard layer. */
class FrontendEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.FRONTEND_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['ui/dashboard.js'] = frontendDashboardTemplate(plan.departmentName);
    return this.contribution({ files });
  }
}

/** Wires the department's composition root — the entry point everything else is assembled from. */
class FullStackEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.FULL_STACK_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['index.js'] = indexTemplate(plan);
    return this.contribution({ files });
  }
}

/** Designs data models for the department's capabilities (memory.js itself is Constitutional Engineer's responsibility). */
class DatabaseEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.DATABASE_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['schemas/data-models.json'] = JSON.stringify({
      department: plan.departmentName,
      models: plan.dataModels
    }, null, 2);
    return this.contribution({ files, dataModels: plan.dataModels });
  }
}

/** Reviews the artifact for security concerns before QAD submission. */
class SecurityEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.SECURITY_ENGINEER }); }
  async perform(task) {
    const { files } = task;
    const findings = [];
    for (const [path, content] of Object.entries(files)) {
      if (/eval\(|child_process|process\.env\.[A-Z_]*SECRET/i.test(content)) {
        findings.push({ path, severity: 'HIGH', issue: 'Potentially unsafe or credential-leaking pattern detected' });
      }
    }
    return this.contribution({ findings, passed: findings.length === 0 });
  }
}

/** Writes and runs internal quality checks prior to QAD submission. */
class QAEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.QA_ENGINEER }); }
  async perform(task) {
    const { plan, files } = task;
    const missing = (plan.mandatoryFiles || []).filter(f => !(f in files));
    return this.contribution({
      testsPassed: missing.length === 0,
      missingMandatoryFiles: missing,
      fileCount: Object.keys(files).length
    });
  }
}

/** Produces README and public API documentation for the artifact. */
class DocumentationEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.DOCUMENTATION_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['README.md'] = readmeTemplate(plan);
    return this.contribution({ files });
  }
}

/** Prepares packaging/installation manifest for marketplace distribution. */
class DeploymentEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.DEPLOYMENT_ENGINEER }); }
  async perform(task) {
    const { plan } = task;
    const files = {};
    files['package.json'] = packageJsonTemplate(plan.departmentName);
    return this.contribution({ files });
  }
}

/**
 * Last-resort repair. With ConstitutionalEngineer now generating real
 * constitutional files up front, this should rarely trigger — it remains
 * as a safety net for genuinely unanticipated gaps, and still never
 * mutates the rejected artifact in place (a new artifact is always built
 * from its output by manager.js).
 */
class RepairEngineer extends BaseAgent {
  constructor(deps) { super({ ...deps, role: ROLES.REPAIR_ENGINEER }); }
  async perform(task) {
    const { rejectionReport, files } = task;
    const repairedFiles = { ...files };
    const actions = [];
    for (const issue of rejectionReport.issues || []) {
      if (issue.missingFile) {
        repairedFiles[issue.missingFile] = `'use strict';\n// Last-resort repair stub for: ${issue.missingFile}\n// This file was still missing after the Constitutional Engineer's pass —\n// investigate why (see agents/constitutional-templates.js).\nmodule.exports = {};\n`;
        actions.push(`Generated missing mandatory file: ${issue.missingFile}`);
      } else {
        actions.push(`Noted for manual/architectural review: ${issue.message || JSON.stringify(issue)}`);
      }
    }
    return this.contribution({ repairedFiles, actions });
  }
}

// --- lightweight in-file templates -----------------------------------------

function indexTemplate(plan) {
  const name = plan.departmentName;
  const pascal = pascalCase(name);
  return `'use strict';

/**
 * index.js — composition root for the ${name} department, generated by
 * the Full Stack Engineer. Mirrors Engineering's own composition root
 * pattern exactly: receives the platform's shared QAD and Platform Memory
 * instances (the same ones every other department uses — this department
 * does not bundle private copies of either) and wires its own constitutional
 * modules around them.
 */

const { Runtime } = require('./runtime');
const { DepartmentEventBus } = require('./events');
const { DepartmentOutput } = require('./output');
const { DepartmentInput } = require('./input');
const { DepartmentMemory } = require('./memory');
const { ${pascal}Health } = require('./${name}');

/**
 * @param {Object} deps
 * @param {Object} deps.qad - The platform's shared Quality Assurance Director instance.
 * @param {Object} deps.platformMemory - The platform's shared Platform Memory instance.
 */
function create${pascal}Department({ qad, platformMemory } = {}) {
  if (!qad || !platformMemory) {
    throw new Error(
      'create${pascal}Department requires qad and platformMemory — the same shared ' +
      'Quality Assurance Director and Platform Memory instances every BAOS department ' +
      'uses. See departments/quality-assurance-director and platform-memory.'
    );
  }

  const events = new DepartmentEventBus();
  const output = new DepartmentOutput({ qadClient: qad.runtime, events });
  const input = new DepartmentInput({ platformMemoryClient: platformMemory, events });
  const memory = new DepartmentMemory(platformMemory);
  const runtime = new Runtime({ output, input, events, memory });
  const health = new ${pascal}Health({ events, memory, qadClient: qad.runtime });

  return { runtime, events, memory, health };
}

module.exports = { create${pascal}Department };
`;
}

function backendManagerTemplate(plan) {
  const name = plan.departmentName;
  return `'use strict';

/**
 * manager.js — orchestration manager for the ${name} department, generated
 * by the Backend Engineer. Runs the same shape of lifecycle Engineering's
 * own manager.js runs: intake -> dispatch to specialized workforce ->
 * validate -> (repair loop) -> submit to QAD -> confirm Platform Memory
 * commit.
 *
 * Every work item submitted to this department is dispatched to its own
 * specialized employees (see agents/index.js — one per requested
 * capability, hired by the Workforce Engineer when this department was
 * built) rather than passed straight through as a bare payload. Each
 * employee consults Platform Memory before OpenAI, same knowledge
 * discipline as every other BAOS department.
 */

const { Contract } = require('./contract');
const { Artifact } = require('./artifact');
const { ExecutionState } = require('./state');
const { validateArtifactCandidate } = require('./validators');
const { RepairCoordinator } = require('./repair');
const { RepairExhaustedError } = require('./errors');
const { STATUS } = require('./constants');
const { OpenAIAdapter } = require('./adapters/openai');
const { buildWorkforce } = require('./agents/index');
const knowledge = require('./knowledge');
const views = require('./views');
const config = require('./config');

class Manager {
  constructor({ events, output, input, history, learning, memory }) {
    this.events = events;
    this.output = output;
    this.input = input;
    this.history = history;
    this.learning = learning;
    this.memory = memory;
    this.repairCoordinator = new RepairCoordinator({ events });

    this.openai = new OpenAIAdapter();
    this.workforce = buildWorkforce({ openai: this.openai, memory: this.memory });
  }

  async intake(requestSpec) {
    this.events.publish('RequestReceived', { requestSpec });
    const contract = new Contract(requestSpec);
    const state = new ExecutionState(contract.id);
    state.transition(STATUS.RECEIVED);
    return { contract, state };
  }

  /** Dispatches the incoming work item to every specialized employee (flattening multi-count roles) and aggregates their contributions. */
  async _dispatchToWorkforce(workItem) {
    const employees = Object.values(this.workforce).flat();
    const contributions = await Promise.all(
      employees.map((employee) => employee.perform({ workItem }))
    );
    return contributions;
  }

  async execute(contract, state, workItem = {}) {
    const startedAt = Date.now();
    try {
      state.transition(STATUS.PROCESSING);
      this.events.publish('ProcessingStarted', { contractId: contract.id });

      const contributions = await this._dispatchToWorkforce(workItem);
      const payload = { workItem, contributions };

      const artifact = new Artifact({ contractId: contract.id, payload });
      const certified = await this._validateAndCertify(contract, artifact, state, 0);

      this.history.record('RUN', { contractId: contract.id, outcome: 'SUCCESS', durationMs: Date.now() - startedAt });
      this.learning.recordSuccess({ contractId: contract.id, artifactId: certified.id });
      this.events.publish('ProcessingCompleted', { contractId: contract.id, artifactId: certified.id });
      state.transition(STATUS.COMPLETE);
      return certified;
    } catch (err) {
      this.history.record('RUN', { contractId: contract.id, outcome: 'FAILURE' });
      this.learning.recordFailure({ contractId: contract.id, error: err.message });
      this.events.publish('Failure', { contractId: contract.id, error: err.message });
      state.transition(STATUS.FAILED, { error: err.message });
      throw err;
    }
  }

  async _validateAndCertify(contract, artifact, state, attempt) {
    state.transition(STATUS.VALIDATING);
    const report = validateArtifactCandidate({ contract, artifact });

    if (!report.passed) {
      this.events.publish('ValidationFailed', { contractId: contract.id, issues: report.issues, attempt });
      if (attempt >= config.execution.maxRepairAttempts) {
        throw new RepairExhaustedError('Validation failed and repair attempts exhausted', { issues: report.issues });
      }
      state.transition(STATUS.REPAIRING).incrementRepairAttempt();
      const { artifact: repaired } = await this.repairCoordinator.repair({ artifact, rejectionReport: report, attempt: attempt + 1 });
      return this._validateAndCertify(contract, repaired, state, attempt + 1);
    }
    this.events.publish('ValidationPassed', { contractId: contract.id, attempt });

    state.transition(STATUS.SUBMITTED_TO_QAD);
    const knowledgeObject = knowledge.transform({ contract, artifact });
    const knowledgeViews = views.buildViews(knowledgeObject);
    const verdict = await this.output.submit(artifact, contract, { knowledge: knowledgeObject, views: knowledgeViews });

    if (verdict.verdict !== 'PASS') {
      if (attempt >= config.execution.maxRepairAttempts) {
        throw new RepairExhaustedError('QAD rejected artifact and repair attempts exhausted', { issues: verdict.issues });
      }
      state.transition(STATUS.REPAIRING).incrementRepairAttempt();
      const { artifact: repaired } = await this.repairCoordinator.repair({ artifact, rejectionReport: verdict, attempt: attempt + 1 });
      return this._validateAndCertify(contract, repaired, state, attempt + 1);
    }

    state.transition(STATUS.CERTIFIED);
    const commitConfirmation = await this.input.awaitCommitConfirmation(verdict.certificateId);
    if (!commitConfirmation.committed) {
      throw new RepairExhaustedError('Platform Memory did not confirm commit', { certificateId: verdict.certificateId });
    }
    state.transition(STATUS.COMMITTED);
    return artifact;
  }
}

module.exports = { Manager };
`;
}

function backendRuntimeTemplate(plan) {
  const name = plan.departmentName;
  return `'use strict';

/**
 * runtime.js — runtime lifecycle for the ${name} department, generated by
 * the Backend Engineer. Boots the manager and its supporting modules;
 * this is the single public entry point external callers use.
 */

const { Manager } = require('./manager');
const { HistoryLog } = require('./history');
const { LearningEngine } = require('./learning');

class Runtime {
  constructor({ output, input, events, memory }) {
    this.events = events;
    this.history = new HistoryLog();
    this.learning = new LearningEngine({ events: this.events });
    this.manager = new Manager({ events: this.events, output, input, history: this.history, learning: this.learning, memory });
    this.status = 'STOPPED';
  }

  async start() { this.status = 'RUNNING'; return this.status; }
  async stop() { this.status = 'STOPPED'; return this.status; }

  /** Submit a business request to this department. */
  async submitRequest(requestSpec, payload = {}) {
    if (this.status !== 'RUNNING') await this.start();
    const { contract, state } = await this.manager.intake(requestSpec);
    return this.manager.execute(contract, state, payload);
  }
}

module.exports = { Runtime };
`;
}

function backendServiceTemplate(plan) {
  const name = plan.departmentName;
  return `'use strict';

/**
 * service.js — shared utility services for the ${name} department,
 * generated by the Backend Engineer.
 */

function ping() {
  return { department: '${name}', ok: true, at: new Date().toISOString() };
}

module.exports = { ping };
`;
}

function workforceOpenAITemplate() {
  return `'use strict';

/**
 * adapters/openai.js — generated by the Workforce Engineer.
 * Same knowledge-strategy pattern every BAOS department follows: consult
 * Platform Memory first (certified), fall back to OpenAI (provisional)
 * only when nothing certified exists yet. Three tiers:
 *   1. An injected client (tests, custom providers) — always wins.
 *   2. A real call to OpenAI's API when OPENAI_API_KEY is set — via
 *      Node's built-in global fetch, no SDK dependency, so this
 *      department stays dependency-free either way.
 *   3. A deterministic offline simulator — so this department works with
 *      zero external configuration.
 */

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

class OpenAIAdapter {
  constructor(opts = {}) {
    this.client = opts.client || null;
    this.model = opts.model || 'gpt-4.1';
    this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || null;
    this.callCount = 0;
  }

  async complete(prompt, options = {}) {
    this.callCount += 1;
    if (this.client) return this.client.complete(prompt, { model: this.model, ...options });
    if (this.apiKey) return this._callRealAPI(prompt, options);
    return this._simulate(prompt, options);
  }

  async completeJSON(prompt, options = {}) {
    const raw = await this.complete(prompt, { ...options, expectJSON: true });
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch { return { provisional: true, summary: String(raw).slice(0, 200) }; }
  }

  async _callRealAPI(prompt, options) {
    const body = { model: options.model || this.model, messages: [{ role: 'user', content: prompt }] };
    if (options.expectJSON) body.response_format = { type: 'json_object' };

    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${this.apiKey}\` },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      throw new Error(\`OpenAI API request failed (\${response.status}): \${errorBody}\`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return options.expectJSON ? JSON.parse(content) : content;
  }

  _simulate(prompt, options) {
    const label = options.role || 'general';
    if (options.expectJSON) {
      return { provisional: true, source: 'OPENAI_SIMULATED', role: label, summary: \`Simulated provisional reasoning for role "\${label}"\` };
    }
    return \`[PROVISIONAL:OPENAI_SIMULATED role=\${label}] \${String(prompt).slice(0, 240)}\`;
  }

  stats() {
    const mode = this.client ? 'INJECTED_CLIENT' : this.apiKey ? 'LIVE_API' : 'SIMULATED';
    return { model: this.model, mode, callCount: this.callCount };
  }
}

module.exports = { OpenAIAdapter };
`;
}

function workforceBaseAgentTemplate() {
  return `'use strict';

/**
 * agents/base-agent.js — generated by the Workforce Engineer.
 * Base class every specialized employee in this department extends.
 * Mirrors Engineering's own agents/base-agent.js: consult certified
 * Platform Memory before provisional OpenAI, never the other way around.
 */

class BaseAgent {
  constructor({ role, openai, memory }) {
    this.role = role;
    this.openai = openai;
    this.memory = memory;
  }

  async consultKnowledge(topic, { promptBuilder }) {
    if (this.memory) {
      const certified = await this.memory.findRelevantKnowledge(topic);
      if (certified && certified.length > 0) {
        return { source: 'PLATFORM_MEMORY', knowledge: certified };
      }
    }
    const prompt = promptBuilder(topic);
    const result = await this.openai.completeJSON(prompt, { role: this.role });
    return { source: 'OPENAI', knowledge: result };
  }

  async perform(_task) {
    throw new Error(\`Employee role "\${this.role}" did not implement perform()\`);
  }

  contribution(payload) {
    return { role: this.role, producedAt: new Date().toISOString(), ...payload };
  }
}

module.exports = { BaseAgent };
`;
}

function workforceIndexTemplate(plan) {
  const roles = (plan.workforcePlan?.roles && plan.workforcePlan.roles.length > 0)
    ? plan.workforcePlan.roles
    : [{ title: 'OperationsLead', responsibility: 'Overall coordination of the department\'s work', count: 1 }];

  const classBlocks = roles.map((role) => {
    const className = role.title;
    const escapedResponsibility = String(role.responsibility).replace(/'/g, "\\'");
    return `/** ${role.responsibility} */
class ${className} extends BaseAgent {
  constructor(deps, instanceNumber) {
    super({ ...deps, role: instanceNumber ? \`${className}#\${instanceNumber}\` : '${className}' });
  }
  async perform(task) {
    const { workItem = {} } = task;
    const { source, knowledge } = await this.consultKnowledge('${escapedResponsibility}', {
      promptBuilder: (topic) => \`As the ${className}, handle this request related to "\${topic}": \${JSON.stringify(workItem)}\`
    });
    return this.contribution({
      responsibility: '${escapedResponsibility}',
      knowledgeSource: source,
      result: knowledge
    });
  }
}`;
  }).join('\n\n');

  const exportEntries = roles.map((role) => role.title).join(', ');

  // Roles with count > 1 produce an array of that many uniquely-identified
  // instances (e.g. ContentWriter#1, ContentWriter#2); the generated
  // department's manager.js flattens Object.values(workforce) when
  // dispatching, so this is transparent to callers either way.
  const factoryEntries = roles.map((role) => {
    const key = role.title.charAt(0).toLowerCase() + role.title.slice(1);
    const count = Math.max(1, role.count || 1);
    if (count === 1) {
      return `    ${key}: new ${role.title}(deps)`;
    }
    return `    ${key}: Array.from({ length: ${count} }, (_, i) => new ${role.title}(deps, i + 1))`;
  }).join(',\n');

  const rosterSummary = roles.map((r) => `${r.title} x${r.count || 1} — ${r.responsibility}`).join('\n * ');

  return `'use strict';

/**
 * agents/index.js — generated by the Workforce Engineer for the
 * ${plan.departmentName} department.
 *
 * This roster was RESEARCHED by Engineering's Workforce Research Analyst
 * (source: ${plan.workforcePlan?.source || 'UNKNOWN'}) — it reflects how a
 * real, lean ${plan.departmentName} department is actually staffed, not a
 * mechanical translation of whatever text the executive typed into a
 * capabilities box. That's what makes this department genuinely
 * plug-and-play: the roles here are the roles this kind of business unit
 * needs, researched the same way a real CTO staffing a new department
 * would, before any code was generated.
 *
 * Roster:
 * ${rosterSummary}
 */

const { BaseAgent } = require('./base-agent');

${classBlocks}

function buildWorkforce(deps) {
  return {
${factoryEntries}
  };
}

module.exports = { buildWorkforce, ${exportEntries} };
`;
}

function frontendDashboardTemplate(name) {
  return `'use strict';
// Minimal dashboard bootstrap for the ${name} department.
module.exports = { title: '${name} Dashboard' };
`;
}

function readmeTemplate(plan) {
  return `# ${plan.departmentName}

Generated by the BAOS Engineering Department.

## Capabilities
${(plan.capabilities || []).map(c => `- ${c}`).join('\n') || '- (none specified)'}

## Constitutional Compliance
This department implements the mandatory BAOS file structure and never
writes directly to Platform Memory. All artifacts are certified by the
Quality Assurance Director before activation.

## Running This Department
This department's \`index.js\` requires \`qad\` and \`platformMemory\`
to be injected — the same shared Quality Assurance Director and Platform
Memory instances every BAOS department uses:

\`\`\`js
const { create${plan.departmentName.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')}Department } = require('./index');
const dept = create${plan.departmentName.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')}Department({ qad, platformMemory });
await dept.runtime.start();
const artifact = await dept.runtime.submitRequest(
  { objective: 'describe the work', requestedBy: 'Executive' },
  { /* work payload */ }
);
\`\`\`
`;
}

function packageJsonTemplate(name) {
  return JSON.stringify({
    name: `@baos/${name}`,
    version: '0.1.0',
    private: true,
    main: 'index.js',
    scripts: { test: 'node tests/index.js' }
  }, null, 2);
}

module.exports = {
  ChiefArchitect,
  ProjectArchitect,
  SeniorSoftwareEngineer,
  ConstitutionalEngineer,
  WorkforceResearchAnalyst,
  WorkforceEngineer,
  BackendEngineer,
  FrontendEngineer,
  FullStackEngineer,
  DatabaseEngineer,
  SecurityEngineer,
  QAEngineer,
  DocumentationEngineer,
  DeploymentEngineer,
  RepairEngineer
};
