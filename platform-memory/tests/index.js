'use strict';

/**
 * tests/index.js
 * Run with: node tests/index.js
 */

const assert = require('assert');
const { createPlatformMemory } = require('../index');
const { UnauthorizedCommitError } = require('../errors');

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('Platform Memory — tests\n');

  await check('commit() without a token is rejected', async () => {
    const pm = createPlatformMemory();
    await assert.rejects(
      () => pm.commit({ certificateId: 'c1', departmentName: 'research' }),
      UnauthorizedCommitError
    );
  });

  await check('commit() with a forged token is rejected', async () => {
    const pm = createPlatformMemory();
    pm.grantCommitAuthority();
    await assert.rejects(
      () => pm.commit({ certificateId: 'c1', departmentName: 'research', authorityToken: 'forged' }),
      UnauthorizedCommitError
    );
  });

  await check('grantCommitAuthority() can only be called once', () => {
    const pm = createPlatformMemory();
    pm.grantCommitAuthority();
    assert.throws(() => pm.grantCommitAuthority(), UnauthorizedCommitError);
  });

  await check('a valid token allows commit, and the result is queryable', async () => {
    const pm = createPlatformMemory();
    const token = pm.grantCommitAuthority();

    await pm.commit({
      certificateId: 'cert_1',
      departmentName: 'research',
      category: pm.categories.RESEARCH_REPORT,
      summary: 'Certified market analysis',
      authorityToken: token
    });

    const confirmed = await pm.confirmCommit('cert_1');
    assert.strictEqual(confirmed.committed, true);

    const results = await pm.query({ departmentName: 'research' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].summary, 'Certified market analysis');
  });

  await check('query() with no matches returns an empty array, not an error', async () => {
    const pm = createPlatformMemory();
    const results = await pm.query({ departmentName: 'nonexistent' });
    assert.deepStrictEqual(results, []);
  });

  await check('growth() summarizes entries by category and department', async () => {
    const pm = createPlatformMemory();
    const token = pm.grantCommitAuthority();
    await pm.commit({ certificateId: 'c1', departmentName: 'research', category: pm.categories.RESEARCH_REPORT, authorityToken: token });
    await pm.commit({ certificateId: 'c2', departmentName: 'engineering', category: pm.categories.ARCHITECTURE_PATTERN, authorityToken: token });

    const growth = await pm.growth();
    assert.strictEqual(growth.totalEntries, 2);
    assert.strictEqual(growth.byDepartment.research, 1);
    assert.strictEqual(growth.byDepartment.engineering, 1);
  });

  await check('Version: repeated commits under the same subjectKey are tracked as versions, not unrelated entries', async () => {
    const pm = createPlatformMemory();
    const token = pm.grantCommitAuthority();

    await pm.commit({ certificateId: 'c1', departmentName: 'research', subjectKey: 'market-analysis:japan', summary: 'v1', authorityToken: token });
    await pm.commit({ certificateId: 'c2', departmentName: 'research', subjectKey: 'market-analysis:japan', summary: 'v2', authorityToken: token });
    await pm.commit({ certificateId: 'c3', departmentName: 'research', subjectKey: 'market-analysis:japan', summary: 'v3', authorityToken: token });

    const history = await pm.versionHistory('market-analysis:japan', 'research');
    assert.strictEqual(history.length, 3);
    assert.deepStrictEqual(history.map((h) => h.version), [1, 2, 3]);

    const latest = await pm.latestVersion('market-analysis:japan', 'research');
    assert.strictEqual(latest.version, 3);
    assert.strictEqual(latest.summary, 'v3');
  });

  await check('Search: finds knowledge by free text without knowing department/category in advance', async () => {
    const pm = createPlatformMemory();
    const token = pm.grantCommitAuthority();
    await pm.commit({ certificateId: 'c1', departmentName: 'research', summary: 'Japanese market shows strong demand for eco-packaging', authorityToken: token });
    await pm.commit({ certificateId: 'c2', departmentName: 'revenue', summary: 'Q3 revenue forecast', authorityToken: token });

    const results = await pm.search('eco-packaging');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].certificateId, 'c1');
  });

  await check('Relationships: two knowledge entries can be linked and found from either side', async () => {
    const pm = createPlatformMemory();
    const token = pm.grantCommitAuthority();
    await pm.commit({ certificateId: 'trend-1', departmentName: 'research', summary: 'Rising demand trend', authorityToken: token });
    await pm.commit({ certificateId: 'market-1', departmentName: 'research', summary: 'Japan market sizing', authorityToken: token });

    await pm.relate('trend-1', 'market-1', 'supports');

    const relatedToTrend = await pm.getRelated('trend-1');
    assert.strictEqual(relatedToTrend.length, 1);
    assert.strictEqual(relatedToTrend[0].entry.certificateId, 'market-1');
    assert.strictEqual(relatedToTrend[0].relationshipType, 'supports');

    // Symmetric lookup from the other side of the relationship
    const relatedToMarket = await pm.getRelated('market-1');
    assert.strictEqual(relatedToMarket[0].entry.certificateId, 'trend-1');
  });

  console.log(`\n${passed} check(s) passed.`);
}

main().catch((err) => {
  console.error('Test run crashed:', err);
  process.exitCode = 1;
});
