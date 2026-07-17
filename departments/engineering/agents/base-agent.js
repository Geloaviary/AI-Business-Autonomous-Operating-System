'use strict';

/**
 * agents/base-agent.js
 * ---------------------------------------------------------------------------
 * Base class for every AI employee in the Engineering workforce. Each
 * concrete agent (ProjectArchitect, BackendEngineer, QAEngineer, ...) is a
 * specialized worker with ONE clearly-defined responsibility — avoid the
 * temptation to build one monolithic "do everything" prompt. Agents
 * collaborate through manager.js; they never call each other directly.
 * ---------------------------------------------------------------------------
 */

const { PromptError } = require('../errors');

class BaseAgent {
  /**
   * @param {Object} deps
   * @param {string} deps.role - One of constants.ROLES
   * @param {import('../adapters/openai').OpenAIAdapter} deps.openai
   * @param {import('../memory').EngineeringMemory} [deps.memory]
   */
  constructor({ role, openai, memory = null }) {
    if (!role) throw new PromptError('Agent requires a role');
    this.role = role;
    this.openai = openai;
    this.memory = memory;
  }

  /**
   * Consult Platform Memory first (certified organizational knowledge),
   * and only fall back to OpenAI (provisional) when memory has nothing.
   * This is the concrete implementation of the platform's knowledge strategy.
   */
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

  /**
   * Every concrete agent implements perform(task) -> contribution.
   */
  async perform(_task) {
    throw new PromptError(`Agent role "${this.role}" did not implement perform()`);
  }

  contribution(payload) {
    return {
      role: this.role,
      producedAt: new Date().toISOString(),
      ...payload
    };
  }
}

module.exports = { BaseAgent };
