'use strict';

/**
 * ui-builder.js
 * ---------------------------------------------------------------------------
 * Top-level orchestration entry point for UI generation. Delegates actual
 * construction to builders/index.js (UIBuilder, MenuBuilder) — this file's
 * job is simply to decide *whether* a UI is needed for a given plan and to
 * merge the resulting UI-related files into the artifact's file map.
 * ---------------------------------------------------------------------------
 */

const { UIBuilder, MenuBuilder } = require('./builders/index');
const config = require('./config');

class UIOrchestrator {
  constructor() {
    this.uiBuilder = new UIBuilder();
    this.menuBuilder = new MenuBuilder();
  }

  /**
   * @param {Object} plan - Architecture plan from processors/planning.
   * @returns {Object} fileMap of UI-related files (may be empty).
   */
  generate(plan) {
    if (!config.featureFlags.enableUiBuilder) return {};
    if (!plan.optionalDirectories?.includes('ui')) return {};

    return {
      ...this.uiBuilder.build(plan),
      ...this.menuBuilder.build(plan)
    };
  }
}

module.exports = { UIOrchestrator };
