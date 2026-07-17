'use strict';

/**
 * prompts/repair.prompt.js
 * ---------------------------------------------------------------------------
 * Versioned prompt template for the Repair Engineer role.
 * ---------------------------------------------------------------------------
 */

const VERSION = '1.0.0';

function buildRepairPrompt({ issues = [] }) {
  const issueList = issues.map(i => `- [${i.category || 'general'}] ${i.message}`).join('\n');
  return [
    'You are the Repair Engineer of an autonomous AI engineering organization.',
    'The Quality Assurance Director (or internal validation) rejected an artifact for the following reasons:',
    issueList,
    'Produce a corrected file set. Never modify the rejected artifact in place —',
    'your output becomes a new, separate artifact revision.'
  ].join('\n');
}

module.exports = { VERSION, buildRepairPrompt };
