'use strict';

/**
 * tests/index.js
 * ---------------------------------------------------------------------------
 * Minimal dependency-free smoke/integration test suite. Exercises the full
 * constitutional lifecycle end-to-end using the standalone stub adapters,
 * plus targeted unit checks on the immutability and validation guarantees.
 * Run with: node tests/index.js
 * ---------------------------------------------------------------------------
 */

const assert = require('assert');
const path = require('path');
const os = require('os');

const { createEngineeringDepartment } = require('../index');
const { Artifact } = require('../artifact');
const { Contract } = require('../contract');
const { validateArtifactCandidate } = require('../validators');
const { MANDATORY_FILES } = require('../constants');

let passed = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log(`  ok - ${name}`); })
    .catch(err => {
      console.error(`  FAIL - ${name}`);
      console.error(`    ${err.message}`);
      process.exitCode = 1;
    });
}

async function main() {
  console.log('Engineering Department — smoke tests\n');

  await check('Contract requires businessObjective and requestedBy', () => {
    assert.throws(() => new Contract({}));
    const c = new Contract({ businessObjective: 'Create a Test Department.', requestedBy: 'CEO' });
    assert.ok(c.id.startsWith('contract_'));
  });

  await check('Artifact is immutable and computes a stable checksum', () => {
    const a = new Artifact({ departmentName: 'test', files: { 'a.js': 'x' } });
    assert.throws(() => { a.status = 'HACKED'; }, /Cannot assign/);
    const b = new Artifact({ departmentName: 'test', files: { 'a.js': 'x' } });
    assert.strictEqual(a.checksum, b.checksum);
  });

  await check('validators.js flags missing mandatory files', () => {
    const contract = new Contract({ businessObjective: 'Create a Test Department.', requestedBy: 'CEO' });
    const plan = { departmentName: 'test', mandatoryFiles: MANDATORY_FILES, optionalDirectories: [] };
    const report = validateArtifactCandidate({ contract, plan, files: {} });
    assert.strictEqual(report.passed, false);
    assert.ok(report.issues.length >= MANDATORY_FILES.length);
  });

  await check('Full lifecycle: request -> certified, activated, packaged department', async () => {
    process.env.ENGINEERING_PACKAGE_OUTPUT = path.join(os.tmpdir(), `baos-eng-test-${Date.now()}`);
    // Re-require config-dependent module fresh isn't necessary; config reads env at import time,
    // so set the env var before creating the department.
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('../index')];
    delete require.cache[require.resolve('../manager')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');

    const dept = freshCreate();
    await dept.runtime.start();

    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Procurement Department.',
      requestedBy: 'CEO',
      capabilities: ['Supplier sourcing', 'Purchase order tracking']
    });

    assert.strictEqual(result.state.status, 'PACKAGED');
    assert.ok(result.artifact.checksum);
    assert.ok(result.package && result.package.packageName.startsWith('Procurement-'));

    const metricsSnapshot = dept.metrics.snapshot();
    assert.strictEqual(metricsSnapshot.buildSuccessRate, 1);

    const health = await dept.health.runDiagnostics();
    assert.strictEqual(health.status, 'HEALTHY');
  });

  await check('Generated departments require zero repair cycles (Constitutional Engineer covers all mandatory files)', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');
    const dept = freshCreate();
    await dept.runtime.start();

    const seen = [];
    dept.events.on('*', (r) => seen.push(r.event));

    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Research Department.',
      requestedBy: 'CEO',
      capabilities: ['Market research']
    });

    assert.strictEqual(result.state.status, 'PACKAGED');
    assert.strictEqual(seen.filter((e) => e === 'RepairStarted').length, 0, 'expected zero repair cycles on first-pass generation');
    assert.strictEqual(seen.filter((e) => e === 'BuildStarted').length, 1, 'expected the AI Workforce to run exactly once');
    assert.ok(result.artifact.contributors.includes('ConstitutionalEngineer'));
  });

  await check('A generated department is not just file-structure-complete — it actually runs', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');
    const { createPlatformMemory } = require('../../../platform-memory');
    const { createQualityAssuranceDirector } = require('../../quality-assurance-director');
    const { execSync } = require('child_process');
    const fs = require('fs');

    const dept = freshCreate();
    await dept.runtime.start();
    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Revenue Department.',
      requestedBy: 'CEO',
      capabilities: ['Revenue forecasting']
    });

    assert.ok(result.package, 'expected a marketplace package to be produced');

    // Extract the real marketplace ZIP — exactly what installing this
    // department in a full BAOS deployment would involve.
    const tmpDir = path.join(os.tmpdir(), `baos-generated-check-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o -q "${result.package.zipPath}" -d "${tmpDir}"`);

    const { createRevenueDepartment } = require(tmpDir);

    // A fresh, independent platform-memory + QAD pair — proving the
    // generated department works against ANY conforming platform-memory/QAD
    // implementation, not just the ones that built it.
    const childPlatformMemory = createPlatformMemory();
    const childQad = createQualityAssuranceDirector({ platformMemory: childPlatformMemory });
    const childDept = createRevenueDepartment({ qad: childQad, platformMemory: childPlatformMemory });
    await childDept.runtime.start();

    const artifact = await childDept.runtime.submitRequest(
      { objective: 'Forecast Q3 revenue', requestedBy: 'CFO' },
      { forecast: { q3: 1250000, currency: 'USD' } }
    );

    assert.ok(artifact.checksum);
    const childHealth = await childDept.health.runDiagnostics();
    assert.strictEqual(childHealth.status, 'HEALTHY');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  await check('A generated department is staffed from RESEARCH, not mechanically from executive-typed capability text', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');
    const { createPlatformMemory } = require('../../../platform-memory');
    const { createQualityAssuranceDirector } = require('../../quality-assurance-director');
    const { execSync } = require('child_process');
    const fs = require('fs');

    const dept = freshCreate();
    await dept.runtime.start();

    // Deliberately vague capabilities text an executive might actually type —
    // NOT the exact phrases the procurement archetype's role titles use.
    // If staffing were still mechanically derived from this text, none of
    // the archetype's real role names would appear.
    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Procurement Department.',
      requestedBy: 'CEO',
      capabilities: ['handle vendors and buying stuff']
    });

    assert.ok(result.artifact.contributors.includes('WorkforceEngineer'));
    assert.strictEqual(result.plan.workforcePlan.source, 'ARCHETYPE_LIBRARY', 'expected staffing to come from Engineering\'s researched archetype, not executive text');

    const tmpDir = path.join(os.tmpdir(), `baos-workforce-check-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o -q "${result.package.zipPath}" -d "${tmpDir}"`);

    // The researched procurement archetype's real roles should be present —
    // titles the executive never typed anywhere in the request.
    const agentsSource = fs.readFileSync(path.join(tmpDir, 'agents', 'index.js'), 'utf8');
    assert.ok(agentsSource.includes('SupplierSourcingSpecialist'), 'expected the researched procurement archetype, not capability text, to drive staffing');
    assert.ok(agentsSource.includes('PurchaseOrderCoordinator'));
    assert.ok(agentsSource.includes('VendorRelationshipManager'));
    assert.ok(/researched by engineering/i.test(agentsSource), 'expected the generated file to document that staffing was researched');

    const { createProcurementDepartment } = require(tmpDir);
    const childPlatformMemory = createPlatformMemory();
    const childQad = createQualityAssuranceDirector({ platformMemory: childPlatformMemory });
    const childDept = createProcurementDepartment({ qad: childQad, platformMemory: childPlatformMemory });
    await childDept.runtime.start();

    const artifact = await childDept.runtime.submitRequest(
      { objective: 'Source packaging materials', requestedBy: 'COO' },
      { item: 'packaging materials' }
    );

    const roles = artifact.payload.contributions.map((c) => c.role);
    assert.ok(roles.includes('SupplierSourcingSpecialist'));
    assert.ok(roles.includes('VendorRelationshipManager'));
  });

  await check('An executive-requested capability genuinely uncovered by research is added as a SUPPLEMENTAL role, not the primary driver', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');

    const dept = freshCreate();
    await dept.runtime.start();

    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Procurement Department.',
      requestedBy: 'CEO',
      // "Blockchain provenance tracking" has no overlap with any procurement
      // archetype role — it should be added additively, not replace the
      // researched roster.
      capabilities: ['Blockchain provenance tracking']
    });

    const { execSync } = require('child_process');
    const fs = require('fs');
    const tmpDir = path.join(os.tmpdir(), `baos-supplemental-check-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o -q "${result.package.zipPath}" -d "${tmpDir}"`);
    const agentsSource = fs.readFileSync(path.join(tmpDir, 'agents', 'index.js'), 'utf8');

    // Researched roles are still present...
    assert.ok(agentsSource.includes('SupplierSourcingSpecialist'));
    // ...AND the genuinely uncovered capability was added on top, not instead of them.
    assert.ok(agentsSource.includes('BlockchainProvenanceTrackingSpecialist'));
  });

  await check('Certified knowledge accumulates: a second call to the same specialist cites real precedent, not OpenAI again', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');
    const { createPlatformMemory } = require('../../../platform-memory');
    const { createQualityAssuranceDirector } = require('../../quality-assurance-director');
    const { execSync } = require('child_process');
    const fs = require('fs');

    const dept = freshCreate();
    await dept.runtime.start();
    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Marketing Department.',
      requestedBy: 'CEO'
    });

    const tmpDir = path.join(os.tmpdir(), `baos-precedent-check-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o -q "${result.package.zipPath}" -d "${tmpDir}"`);

    const { createMarketingDepartment } = require(tmpDir);
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    const childDept = createMarketingDepartment({ qad, platformMemory });
    await childDept.runtime.start();

    const artifact1 = await childDept.runtime.submitRequest(
      { objective: 'Plan Q3 campaign strategy', requestedBy: 'CMO' },
      { quarter: 'Q3' }
    );
    const strategist1 = artifact1.payload.contributions.find((c) => c.role === 'MarketingStrategist');
    assert.strictEqual(strategist1.knowledgeSource, 'OPENAI', 'expected no precedent on the first call');

    const artifact2 = await childDept.runtime.submitRequest(
      { objective: 'Plan Q4 campaign strategy', requestedBy: 'CMO' },
      { quarter: 'Q4' }
    );
    const strategist2 = artifact2.payload.contributions.find((c) => c.role === 'MarketingStrategist');
    assert.strictEqual(strategist2.knowledgeSource, 'PLATFORM_MEMORY', 'expected the second call to cite certified precedent, not consult OpenAI again');
    assert.ok(Array.isArray(strategist2.result) && strategist2.result[0].certificateId, 'expected the cited precedent to reference a real certificate');
  });

  await check('OpenAIAdapter makes a real API call (not the simulator) when an API key is configured', async () => {
    const { OpenAIAdapter } = require('../adapters/openai');

    const originalFetch = global.fetch;
    let capturedRequest = null;
    global.fetch = async (url, opts) => {
      capturedRequest = { url, body: JSON.parse(opts.body), headers: opts.headers };
      const isJSON = !!capturedRequest.body.response_format;
      const content = isJSON ? JSON.stringify({ ok: true }) : 'real response';
      return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
    };

    try {
      const adapter = new OpenAIAdapter({ apiKey: 'sk-test-key' });
      const textResult = await adapter.complete('hello');
      assert.strictEqual(textResult, 'real response');
      assert.strictEqual(capturedRequest.url, 'https://api.openai.com/v1/chat/completions');
      assert.ok(capturedRequest.headers.Authorization.includes('sk-test-key'));

      const jsonResult = await adapter.completeJSON('give me json');
      assert.deepStrictEqual(jsonResult, { ok: true });
      assert.strictEqual(adapter.stats().mode, 'LIVE_API');
    } finally {
      global.fetch = originalFetch;
    }
  });

  await check('Engineering itself learns: a second department of the same type cites its own certified staffing precedent', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');

    const dept = freshCreate();
    await dept.runtime.start();

    const result1 = await dept.runtime.submitRequest({
      businessObjective: 'Create a Sales Department.',
      requestedBy: 'CEO'
    });
    assert.strictEqual(result1.plan.workforcePlan.source, 'ARCHETYPE_LIBRARY', 'expected no precedent on the first build');

    const knowledge = await dept.memory.findStaffingPattern('sales');
    assert.strictEqual(knowledge.type, 'DepartmentStaffingPattern');
    assert.ok(knowledge.roles.some((r) => r.title === 'AccountExecutive'));

    const result2 = await dept.runtime.submitRequest({
      businessObjective: 'Create a Sales Department.',
      requestedBy: 'CEO'
    });
    assert.strictEqual(result2.plan.workforcePlan.source, 'PLATFORM_MEMORY', 'expected the second build to cite its own certified precedent');
  });

  await check('A generated department ships with real knowledge.js and views.js, not just contract/artifact/validators', async () => {
    delete require.cache[require.resolve('../index')];
    // eslint-disable-next-line global-require
    const { createEngineeringDepartment: freshCreate } = require('../index');
    const { execSync } = require('child_process');
    const fs = require('fs');

    const dept = freshCreate();
    await dept.runtime.start();
    const result = await dept.runtime.submitRequest({
      businessObjective: 'Create a Support Department.',
      requestedBy: 'CEO'
    });

    const tmpDir = path.join(os.tmpdir(), `baos-knowledge-views-check-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o -q "${result.package.zipPath}" -d "${tmpDir}"`);

    assert.ok(fs.existsSync(path.join(tmpDir, 'knowledge.js')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'views.js')));

    const knowledgeSource = fs.readFileSync(path.join(tmpDir, 'knowledge.js'), 'utf8');
    assert.ok(knowledgeSource.includes('DepartmentKnowledge'));
    const viewsSource = fs.readFileSync(path.join(tmpDir, 'views.js'), 'utf8');
    assert.ok(viewsSource.includes('buildViews'));
  });

  console.log(`\n${passed} check(s) passed.`);
}

main().catch(err => {
  console.error('Test run crashed:', err);
  process.exitCode = 1;
});
