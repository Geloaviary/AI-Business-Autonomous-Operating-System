'use strict';

/**
 * tests/demo-run.js
 * ---------------------------------------------------------------------------
 * Human-readable walkthrough of the constitutional lifecycle, simulating an
 * executive submitting: "Create a Procurement Department."
 * Run with: node tests/demo-run.js
 * ---------------------------------------------------------------------------
 */

const { createEngineeringDepartment } = require('../index');

async function main() {
  const dept = createEngineeringDepartment();

  dept.events.on('*', (record) => {
    console.log(`[${record.at}] ${record.event}`);
  });

  await dept.runtime.start();
  console.log('\nEngineering Department runtime: RUNNING\n');

  console.log('Executive submits: "Create a Procurement Department."\n');

  const result = await dept.runtime.submitRequest({
    businessObjective: 'Create a Procurement Department.',
    requestedBy: 'CEO',
    capabilities: [
      'Supplier sourcing',
      'Purchase order tracking',
      'Approval workflows',
      'Spend analytics dashboard'
    ]
  });

  console.log('\n--- Result ---');
  console.log('Department:', result.plan.departmentName);
  console.log('Artifact ID:', result.artifact.id);
  console.log('Files generated:', result.artifact.fileCount);
  console.log('Contributors:', result.artifact.contributors.join(', '));
  console.log('Final status:', result.state.status);
  if (result.package) {
    console.log('Marketplace package:', result.package.packageName);
    console.log('Package path:', result.package.zipPath);
  }

  console.log('\n--- Engineering Metrics ---');
  console.log(dept.metrics.snapshot());

  console.log('\n--- Engineering Health ---');
  console.log(await dept.health.runDiagnostics());
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exitCode = 1;
});
