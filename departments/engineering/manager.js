'use strict';

/**
 * manager.js
 * ---------------------------------------------------------------------------
 * The Engineering Manager. This is the ONLY module that orchestrates
 * processors, builders, and the AI Workforce together — per the file
 * dependency rules, processors never import builders directly, and
 * builders never make architectural decisions. manager.js is where those
 * two worlds meet.
 *
 * Full constitutional lifecycle implemented here:
 *   Human Request -> Requirement Analysis -> Architecture Planning ->
 *   AI Workforce -> Generated Department (Artifact) -> Internal Validation ->
 *   Quality Assurance Director -> Platform Memory Commit ->
 *   Department Activation -> Marketplace ZIP Package
 *
 * Repair discipline: generation (calling the AI Workforce) happens exactly
 * ONCE per contract. Every subsequent repair round patches the existing
 * file set in place via RepairEngineer and re-validates THAT patched set —
 * it never throws away work and starts generation over. This matters for
 * two reasons: (1) it's wasteful to re-run a whole workforce over a problem
 * that's already been diagnosed, and (2) re-generating from scratch was
 * previously discarding contributor attribution on every retry, silently
 * making the final artifact's `contributors` list wrong.
 * ---------------------------------------------------------------------------
 */

const { Contract } = require('./contract');
const { ExecutionState } = require('./state');
const { validateArtifactCandidate } = require('./validators');
const { STATUS } = require('./constants');
const { RepairExhaustedError } = require('./errors');
const config = require('./config');
const knowledge = require('./knowledge');
const views = require('./views');

const {
  PlanningProcessor, ArchitectureProcessor, GenerationProcessor,
  ValidationProcessor, RefactoringProcessor, TestingProcessor
} = require('./processors/index');

const { DepartmentBuilder, PackageBuilder, TestBuilder, ArchitectureBuilder } = require('./builders/index');
const { UIOrchestrator } = require('./ui-builder');
const { RepairCoordinator } = require('./repair');

class EngineeringManager {
  /**
   * @param {Object} deps - Fully wired dependencies (see index.js for composition root).
   */
  constructor(deps) {
    this.agents = deps.agents;
    this.events = deps.events;
    this.output = deps.output;       // EngineeringOutput -> QAD
    this.input = deps.input;         // EngineeringInput  -> Platform Memory confirmation
    this.memory = deps.memory;       // EngineeringMemory -> Platform Memory reads
    this.history = deps.history;
    this.learning = deps.learning;
    this.filesystem = deps.filesystem;
    this.archiver = deps.archiver;
    this.pendingActivations = deps.pendingActivations;
    // When true (the default, used by the standalone test suite and CLI
    // demo), certification flows straight through to ACTIVE + PACKAGED —
    // convenient for running Engineering in isolation. When false (how the
    // dashboard runs it), a certified + committed artifact stops at
    // COMMITTED and waits in pendingActivations for the executive to
    // explicitly activate it via activateDepartment().
    this.autoActivate = deps.autoActivate !== undefined ? deps.autoActivate : true;

    this.planningProcessor = new PlanningProcessor();
    this.architectureProcessor = new ArchitectureProcessor();
    this.generationProcessor = new GenerationProcessor();
    this.validationProcessor = new ValidationProcessor();
    this.refactoringProcessor = new RefactoringProcessor();
    this.testingProcessor = new TestingProcessor();

    this.departmentBuilder = new DepartmentBuilder();
    this.testBuilder = new TestBuilder();
    this.architectureBuilder = new ArchitectureBuilder();
    this.packageBuilder = new PackageBuilder({ filesystem: deps.filesystem, archiver: deps.archiver });
    this.uiOrchestrator = new UIOrchestrator();

    this.repairCoordinator = new RepairCoordinator({
      repairEngineer: this.agents.repairEngineer,
      events: this.events
    });
  }

  /** Requirement Analysis: turns a raw human business request into a Contract. */
  async intake(requestSpec) {
    this.events.publish('RequestReceived', { requestSpec });
    const contract = new Contract(requestSpec);
    const state = new ExecutionState(contract.id);
    state.transition(STATUS.RECEIVED);
    return { contract, execution: { state } };
  }

  /** Executes the full lifecycle for an intaken contract. */
  async execute(contract, execution) {
    const { state } = execution;
    const startedAt = Date.now();

    try {
      state.transition(STATUS.ANALYZING).setProcessor('PlanningProcessor');
      this.events.publish('AnalysisStarted', { contractId: contract.id });
      const plan = await this.planningProcessor.run({ contract, agents: this.agents });
      this.events.publish('AnalysisCompleted', { contractId: contract.id, plan });

      state.transition(STATUS.PLANNING).setProcessor('ArchitectureProcessor');
      const approvedPlan = await this.architectureProcessor.run({ plan, agents: this.agents });
      this.events.publish('ArchitecturePlanned', { contractId: contract.id, plan: approvedPlan });

      const generation = await this._generate(contract, approvedPlan, state);
      const artifact = await this._validateAndCertify(contract, approvedPlan, generation, state);

      const durationMs = Date.now() - startedAt;
      this.history.recordBuild({ contractId: contract.id, outcome: 'SUCCESS', durationMs, qadVerdict: 'PASS' });
      this.learning.recordSuccess({ contractId: contract.id, artifactId: artifact.id, plan: approvedPlan, durationMs });

      return this._finalizeResult(contract, approvedPlan, artifact, state);
    } catch (err) {
      this.history.recordBuild({ contractId: contract.id, outcome: 'FAILURE', qadVerdict: 'FAIL' });
      this.learning.recordFailure({ contractId: contract.id, error: err });
      this.events.publish('Failure', { contractId: contract.id, error: err.message });
      state.transition(STATUS.FAILED, { error: err.message });
      throw err;
    }
  }

  /** Runs the AI Workforce exactly once to produce the initial file set. */
  async _generate(contract, plan, state) {
    state.transition(STATUS.BUILDING).setProcessor('GenerationProcessor');
    this.events.publish('BuildStarted', { contractId: contract.id });

    const { files: generatedFiles, contributors } = await this.generationProcessor.run({
      plan, agents: this.agents, concurrency: config.workforce.maxParallelWorkers
    });

    const uiFiles = this.uiOrchestrator.generate(plan);
    const testFiles = this.testBuilder.build(plan);
    const architectureFiles = this.architectureBuilder.build(plan);

    const files = await this.refactoringProcessor.run({
      files: { ...generatedFiles, ...uiFiles, ...testFiles, ...architectureFiles }
    });

    this.events.publish('BuildCompleted', { contractId: contract.id, fileCount: Object.keys(files).length });

    return { files, contributors };
  }

  /**
   * Validates the current file set. On failure, repairs it IN PLACE
   * (patching only what's wrong, preserving contributor attribution) and
   * re-validates the patched result — looping until it passes or repair
   * attempts are exhausted. Never re-invokes the AI Workforce.
   */
  async _validateAndCertify(contract, plan, generation, state, attempt = 0) {
    let { files, contributors } = generation;

    state.transition(STATUS.VALIDATING).setProcessor('ValidationProcessor');
    this.events.publish('ValidationStarted', { contractId: contract.id, attempt });

    const testReport = await this.testingProcessor.run({ plan, files, agents: this.agents });
    const validationReport = await this.validationProcessor.run({
      validate: (p, f) => validateArtifactCandidate({ contract, plan: p, files: f }),
      plan, files
    });

    const passed = validationReport.passed && testReport.testsPassed;

    if (!passed) {
      this.events.publish('ValidationFailed', { contractId: contract.id, issues: validationReport.issues, attempt });

      if (attempt >= config.execution.maxRepairAttempts) {
        throw new RepairExhaustedError('Internal validation failed and repair attempts exhausted', {
          contractId: contract.id, issues: validationReport.issues
        });
      }

      state.transition(STATUS.REPAIRING).incrementRepairAttempt();
      const provisional = this.departmentBuilder.build({ contract, plan, files, contributors });
      const { artifact: repaired, actions } = await this.repairCoordinator.repair({
        artifact: provisional,
        rejectionReport: { issues: validationReport.issues },
        attempt: attempt + 1
      });
      this.learning.recordRepairLesson({ artifactId: repaired.id, actions });
      this.history.recordRepair({ contractId: contract.id, actions, attempt: attempt + 1 });

      return this._validateAndCertify(
        contract, plan,
        { files: repaired.files, contributors: repaired.contributors },
        state, attempt + 1
      );
    }

    this.events.publish('ValidationPassed', { contractId: contract.id, attempt });

    const artifact = this.departmentBuilder.build({ contract, plan, files, contributors });
    return this._submitAndCommit(contract, plan, artifact, state, attempt);
  }

  /**
   * Submits to QAD. On rejection, repairs in place and resubmits — never
   * regenerates. Before submission, transforms the artifact into
   * organizational knowledge (knowledge.js) and consumer-specific views
   * (views.js) — QAD certifies this already-formed knowledge without
   * needing to understand what it means, and Platform Memory stores it
   * without transforming it further. Engineering is the only thing that
   * understands what's reusable about a department it just built.
   */
  async _submitAndCommit(contract, plan, artifact, state, attempt) {
    state.transition(STATUS.SUBMITTED_TO_QAD).setProcessor(null);

    const knowledgeObject = knowledge.transform({ plan, artifact });
    const knowledgeViews = views.buildViews(knowledgeObject);

    const verdict = await this.output.submit(artifact, contract, { knowledge: knowledgeObject, views: knowledgeViews });

    if (verdict.verdict !== 'PASS') {
      if (attempt >= config.execution.maxRepairAttempts) {
        throw new RepairExhaustedError('QAD rejected artifact and repair attempts exhausted', {
          contractId: contract.id, issues: verdict.issues
        });
      }
      state.transition(STATUS.REPAIRING).incrementRepairAttempt();
      const { artifact: repaired, actions } = await this.repairCoordinator.repair({
        artifact, rejectionReport: verdict, attempt: attempt + 1
      });
      this.learning.recordRepairLesson({ artifactId: repaired.id, actions });
      this.history.recordRepair({ contractId: contract.id, actions, attempt: attempt + 1 });
      return this._submitAndCommit(contract, plan, repaired, state, attempt + 1);
    }

    state.transition(STATUS.CERTIFIED, { certificateId: verdict.certificateId });

    const commitConfirmation = await this.input.awaitCommitConfirmation(verdict.certificateId);
    if (!commitConfirmation.committed) {
      throw new RepairExhaustedError('Platform Memory did not confirm commit after QAD certification', {
        contractId: contract.id, certificateId: verdict.certificateId
      });
    }
    state.transition(STATUS.COMMITTED);

    return artifact;
  }

  async _finalizeResult(contract, plan, artifact, state) {
    if (!this.autoActivate) {
      await this.pendingActivations.add({
        artifactId: artifact.id,
        departmentName: plan.departmentName,
        contractId: contract.id,
        plan,
        files: artifact.files,
        certifiedAt: new Date().toISOString()
      });
      this.events.publish('AwaitingActivation', { departmentName: plan.departmentName, artifactId: artifact.id });

      return {
        contract: contract.toJSON(),
        plan,
        artifact: artifact.summary(),
        state: state.snapshot(),
        package: null,
        pendingActivation: true
      };
    }

    state.transition(STATUS.ACTIVE);
    this.events.publish('DepartmentActivated', { departmentName: plan.departmentName, artifactId: artifact.id });

    const packageInfo = await this.packageBuilder.build({ artifact, outputDir: config.packaging.outputDir });
    state.transition(STATUS.PACKAGED, packageInfo);
    this.events.publish('PackageGenerated', { departmentName: plan.departmentName, ...packageInfo });

    return {
      contract: contract.toJSON(),
      plan,
      artifact: artifact.summary(),
      state: state.snapshot(),
      package: packageInfo
    };
  }

  /** Lists artifacts that are certified and committed, awaiting the executive's activation decision. */
  async listPendingActivations() {
    return this.pendingActivations.list();
  }

  /**
   * The executive's explicit approval step. Only after this does a
   * certified, Platform-Memory-committed artifact become ACTIVE and get
   * packaged for the Marketplace — certification proves the artifact is
   * correct; activation is a business decision, and the two are
   * deliberately not the same event.
   */
  async activateDepartment(artifactId) {
    const pending = await this.pendingActivations.get(artifactId);
    if (!pending) {
      throw new RepairExhaustedError(`No pending activation found for artifact ${artifactId}`, { artifactId });
    }

    const artifact = this.departmentBuilder.build({
      contract: { id: pending.contractId },
      plan: pending.plan,
      files: pending.files,
      contributors: []
    });

    this.events.publish('DepartmentActivated', { departmentName: pending.departmentName, artifactId: pending.artifactId });

    const packageInfo = await this.packageBuilder.build({ artifact, outputDir: config.packaging.outputDir });
    this.events.publish('PackageGenerated', { departmentName: pending.departmentName, ...packageInfo });

    this.history.recordUpgrade({ contractId: pending.contractId, event: 'ACTIVATED', artifactId: pending.artifactId });
    await this.pendingActivations.remove(artifactId);

    return { departmentName: pending.departmentName, artifactId: pending.artifactId, package: packageInfo };
  }
}

module.exports = { EngineeringManager };
