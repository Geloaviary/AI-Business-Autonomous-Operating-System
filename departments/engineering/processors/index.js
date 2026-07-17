'use strict';

/**
 * processors/index.js
 * ---------------------------------------------------------------------------
 * Processors THINK. They decide what should be built, in what order, and
 * whether it is good enough — but they never write files themselves
 * (that's builders/ job). manager.js orchestrates processors and builders;
 * processors never import builders directly (constitutional rule, see
 * Chapter 7.41 — File Dependency Rules).
 * ---------------------------------------------------------------------------
 */

const { ValidationError } = require('../errors');

/** Turns a Contract into a structured requirement breakdown, including a researched (not executive-dictated) staffing plan. */
class PlanningProcessor {
  async run({ contract, agents }) {
    const architectContribution = await agents.projectArchitect.perform({ contract });
    const plan = architectContribution.plan;

    const workforcePlan = await agents.workforceResearchAnalyst.research({
      departmentName: plan.departmentName,
      businessObjective: contract.businessObjective,
      capabilities: contract.capabilities
    });

    return { ...plan, workforcePlan };
  }
}

/** Validates the plan's architectural soundness via senior review. */
class ArchitectureProcessor {
  async run({ plan, agents }) {
    const review = await agents.seniorSoftwareEngineer.perform({ plan });
    if (!review.approved) {
      throw new ValidationError('Architecture review failed', { issues: review.issues });
    }
    return plan;
  }
}

/** Coordinates workforce output into a single file map (does not write files itself). */
class GenerationProcessor {
  async run({ plan, agents, concurrency = 4 }) {
    const jobs = [
      () => agents.constitutionalEngineer.perform({ plan }),
      () => agents.workforceEngineer.perform({ plan }),
      () => agents.backendEngineer.perform({ plan }),
      () => agents.databaseEngineer.perform({ plan }),
      () => agents.documentationEngineer.perform({ plan }),
      () => agents.deploymentEngineer.perform({ plan }),
      () => agents.fullStackEngineer.perform({ plan })
    ];
    if (plan.optionalDirectories.includes('ui')) {
      jobs.push(() => agents.frontendEngineer.perform({ plan }));
    }

    const results = await runWithConcurrency(jobs, concurrency);
    const files = {};
    const contributors = [];
    for (const result of results) {
      Object.assign(files, result.files || {});
      contributors.push(result.role);
    }
    return { files, contributors };
  }
}

/** Confirms every mandatory file dependency is present and importable-shaped. */
class DependencyProcessor {
  async run({ plan, files }) {
    const missing = plan.mandatoryFiles.filter(f => !(f in files));
    return { satisfied: missing.length === 0, missing };
  }
}

/** Runs internal validation (delegates to validators.js at the manager level). */
class ValidationProcessor {
  async run({ validate, plan, files }) {
    return validate(plan, files);
  }
}

/** Looks for redundant or oversized generated files and flags them. */
class OptimizationProcessor {
  async run({ files }) {
    const suggestions = [];
    for (const [path, content] of Object.entries(files)) {
      if (content.length > 20000) {
        suggestions.push(`${path} is unusually large (${content.length} chars) — consider splitting`);
      }
    }
    return { suggestions };
  }
}

/** Applies safe, mechanical refactors (e.g. normalizing 'use strict', trimming). */
class RefactoringProcessor {
  async run({ files }) {
    const refactored = {};
    for (const [path, content] of Object.entries(files)) {
      let next = content.trimEnd() + '\n';
      if (path.endsWith('.js') && !next.startsWith("'use strict'")) {
        next = `'use strict';\n\n${next}`;
      }
      refactored[path] = next;
    }
    return refactored;
  }
}

/** Confirms QA agent sign-off before submission to QAD. */
class TestingProcessor {
  async run({ plan, files, agents }) {
    return agents.qaEngineer.perform({ plan, files });
  }
}

async function runWithConcurrency(jobs, limit) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < jobs.length) {
      const current = index++;
      results[current] = await jobs[current]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

module.exports = {
  PlanningProcessor,
  ArchitectureProcessor,
  GenerationProcessor,
  DependencyProcessor,
  ValidationProcessor,
  OptimizationProcessor,
  RefactoringProcessor,
  TestingProcessor
};
