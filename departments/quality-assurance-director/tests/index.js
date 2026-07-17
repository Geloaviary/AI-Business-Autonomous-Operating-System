'use strict';

/**
 * tests/index.js
 * Run with: node tests/index.js
 */

const assert = require('assert');
const crypto = require('crypto');
const { createPlatformMemory } = require('../../../platform-memory');
const { createQualityAssuranceDirector } = require('../index');

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.stack}`);
    process.exitCode = 1;
  }
}

function checksum(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

async function main() {
  console.log('Quality Assurance Director — tests\n');

  await check('requires a platformMemory instance to be constructed', () => {
    assert.throws(() => createQualityAssuranceDirector({}));
  });

  await check('certifies a well-formed submission from a department QAD has never seen', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    const payload = { findings: 'Japanese market shows strong demand' };
    const verdict = await qad.runtime.certify({
      departmentName: 'research', // QAD has no hardcoded knowledge of this department
      artifactId: 'artifact_1',
      payload,
      checksum: checksum(payload)
    });

    assert.strictEqual(verdict.verdict, 'PASS');
    assert.ok(verdict.certificateId);

    const confirmed = await platformMemory.confirmCommit(verdict.certificateId);
    assert.strictEqual(confirmed.committed, true);
  });

  await check('rejects a submission missing a payload, with a repair plan', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    const verdict = await qad.runtime.certify({
      departmentName: 'strategy',
      artifactId: 'artifact_2',
      checksum: 'abc'
      // payload deliberately omitted
    });

    assert.strictEqual(verdict.verdict, 'FAIL');
    assert.ok(verdict.issues.length > 0);
    assert.ok(verdict.repairPlan.actionableSteps.length > 0);
    assert.strictEqual(verdict.escalated, false);
  });

  await check('escalates after repeated failure on the same artifact', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    let lastVerdict;
    for (let i = 0; i < 4; i++) {
      lastVerdict = await qad.runtime.certify({
        departmentName: 'content',
        artifactId: 'artifact_3', // same artifact each time
        checksum: 'abc'
        // still missing payload every time
      });
    }

    assert.strictEqual(lastVerdict.verdict, 'FAIL');
    assert.strictEqual(lastVerdict.escalated, true);
  });

  await check('a department can register its own rules without QAD hardcoding its name', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    qad.registerDepartmentRules('revenue', (submission) => {
      if (submission.payload && submission.payload.amount < 0) {
        return [{ category: 'business-rule', message: 'Revenue amount cannot be negative' }];
      }
      return [];
    });

    const badPayload = { amount: -500 };
    const verdict = await qad.runtime.certify({
      departmentName: 'revenue',
      artifactId: 'artifact_4',
      payload: badPayload,
      checksum: checksum(badPayload)
    });

    assert.strictEqual(verdict.verdict, 'FAIL');
    assert.ok(verdict.issues.some((i) => i.category === 'business-rule'));
  });

  await check('certifies an Engineering-style file-map submission using the mandatory file list', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    const files = { 'index.js': 'module.exports = {};', 'README.md': '# test' };
    const verdict = await qad.runtime.certify({
      departmentName: 'engineering',
      artifactId: 'artifact_5',
      files,
      checksum: checksum(files),
      mandatoryFiles: ['index.js', 'README.md']
    });

    assert.strictEqual(verdict.verdict, 'PASS');
  });

  await check('metrics.snapshot() reflects certification history accurately', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    const goodPayload = { ok: true };
    await qad.runtime.certify({ departmentName: 'analytics', artifactId: 'a1', payload: goodPayload, checksum: checksum(goodPayload) });
    await qad.runtime.certify({ departmentName: 'analytics', artifactId: 'a2', checksum: 'x' }); // missing payload -> fails

    const snapshot = qad.metrics.snapshot();
    assert.strictEqual(snapshot.totalSubmissions, 2);
    assert.strictEqual(snapshot.certified, 1);
    assert.strictEqual(snapshot.rejected, 1);
    assert.strictEqual(snapshot.approvalRate, 0.5);
  });

  await check('QAD holds itself to its own standard: publishQualityPattern uses knowledge.js/views.js and commits via its own authority', async () => {
    const platformMemory = createPlatformMemory();
    const qad = createQualityAssuranceDirector({ platformMemory });
    await qad.runtime.start();

    const goodPayload = { ok: true };
    await qad.runtime.certify({ departmentName: 'marketing', artifactId: 'm1', payload: goodPayload, checksum: checksum(goodPayload) });
    await qad.runtime.certify({ departmentName: 'marketing', artifactId: 'm2', checksum: 'x' }); // missing payload -> rejected

    const pattern = await qad.manager.publishQualityPattern('marketing');
    assert.strictEqual(pattern.type, 'QualityPattern');
    assert.strictEqual(pattern.approvalRate, 0.5);

    const stored = await platformMemory.latestVersion('quality-pattern:marketing');
    assert.ok(stored, 'expected the quality pattern to actually be committed to Platform Memory');
    assert.strictEqual(stored.content.knowledge.type, 'QualityPattern');
    assert.ok(stored.content.views.engineering, 'expected an engineering-consumable view to be included');
  });

  console.log(`\n${passed} check(s) passed.`);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exitCode = 1;
});
