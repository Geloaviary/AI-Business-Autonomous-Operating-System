'use strict';

/**
 * prompts/architect.prompt.js
 * ---------------------------------------------------------------------------
 * Versioned prompt template for architecture-planning roles (Chief Architect,
 * Project Architect). Prompts are organizational assets — kept out of agent
 * code so they can be revised, versioned, and eventually certified as
 * reusable Platform Memory knowledge without touching agent logic.
 * ---------------------------------------------------------------------------
 */

const VERSION = '1.0.0';

function buildArchitecturePrompt({ businessObjective, capabilities = [], constraints = {} }) {
  return [
    `You are the Project Architect of an autonomous AI engineering organization.`,
    `Business objective: ${businessObjective}`,
    capabilities.length ? `Requested capabilities: ${capabilities.join(', ')}` : '',
    Object.keys(constraints).length ? `Constraints: ${JSON.stringify(constraints)}` : '',
    `Produce a department architecture plan that follows the BAOS constitutional`,
    `file structure and never writes directly to Platform Memory.`
  ].filter(Boolean).join('\n');
}

module.exports = { VERSION, buildArchitecturePrompt };
