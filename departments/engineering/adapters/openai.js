'use strict';

/**
 * adapters/openai.js
 * ---------------------------------------------------------------------------
 * Isolates the third-party OpenAI integration behind a stable interface.
 * Per platform constitution: OpenAI is a provisional knowledge source.
 * Nothing it returns is treated as certified truth — everything it produces
 * must still pass through validators.js and the Quality Assurance Director
 * before Platform Memory will accept it.
 *
 * Three tiers, in priority order:
 *   1. An explicitly injected `client` (tests, custom providers) — always wins.
 *   2. A real call to OpenAI's API when OPENAI_API_KEY is set in the
 *      environment — uses Node's built-in global fetch, no SDK dependency,
 *      consistent with this department's zero-dependency design.
 *   3. A deterministic offline simulator — so the department remains fully
 *      runnable with no network access at all (tests, demos, air-gapped
 *      environments), clearly labeled as provisional either way.
 * ---------------------------------------------------------------------------
 */

const config = require('../config');
const { PromptError } = require('../errors');

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

class OpenAIAdapter {
  /**
   * @param {Object} [opts]
   * @param {Function} [opts.client] - Injected client with a `.complete(prompt, options)`
   *   method. Takes priority over everything else.
   * @param {string} [opts.apiKey] - Defaults to process.env.OPENAI_API_KEY.
   */
  constructor(opts = {}) {
    this.enabled = config.knowledge.openaiEnabled;
    this.model = opts.model || config.knowledge.openaiModel;
    this.client = opts.client || null;
    this.apiKey = opts.apiKey || process.env.OPENAI_API_KEY || null;
    this.callCount = 0;
  }

  async complete(prompt, options = {}) {
    if (!prompt) throw new PromptError('OpenAIAdapter.complete requires a prompt');
    this.callCount += 1;

    if (this.client) {
      return this.client.complete(prompt, { model: this.model, ...options });
    }
    if (this.apiKey) {
      return this._callRealAPI(prompt, options);
    }
    // Offline simulator: deterministic, structured, clearly-labeled provisional output.
    return this._simulate(prompt, options);
  }

  async completeJSON(prompt, options = {}) {
    const raw = await this.complete(prompt, { ...options, expectJSON: true });
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new PromptError('OpenAIAdapter received non-JSON response for a JSON request', {
        raw, cause: err.message
      });
    }
  }

  /**
   * A real call to OpenAI's Chat Completions API via global fetch (Node
   * 18+). No SDK — this department stays dependency-free whether or not
   * a real key is configured.
   */
  async _callRealAPI(prompt, options) {
    const body = {
      model: options.model || this.model,
      messages: [{ role: 'user', content: prompt }]
    };
    if (options.expectJSON) {
      body.response_format = { type: 'json_object' };
    }

    let response;
    try {
      response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      throw new PromptError('OpenAI API request failed (network error)', { cause: err.message });
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      throw new PromptError(`OpenAI API request failed (${response.status})`, { body: errorBody });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return options.expectJSON ? JSON.parse(content) : content;
  }

  _simulate(prompt, options) {
    const label = options.role || 'general';
    if (options.expectJSON) {
      return {
        provisional: true,
        source: 'OPENAI_SIMULATED',
        role: label,
        summary: `Simulated provisional reasoning for role "${label}"`,
        promptEcho: String(prompt).slice(0, 160)
      };
    }
    return `[PROVISIONAL:OPENAI_SIMULATED role=${label}] ${String(prompt).slice(0, 240)}`;
  }

  stats() {
    const mode = this.client ? 'INJECTED_CLIENT' : this.apiKey ? 'LIVE_API' : 'SIMULATED';
    return { enabled: this.enabled, model: this.model, mode, callCount: this.callCount };
  }
}

module.exports = { OpenAIAdapter };
