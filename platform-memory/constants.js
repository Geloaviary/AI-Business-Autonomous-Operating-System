'use strict';

/**
 * constants.js
 * ---------------------------------------------------------------------------
 * Platform Memory is the institutional brain of BAOS — the single source
 * of organizational truth every department reads from and contributes to,
 * but no department owns. KNOWLEDGE_CATEGORY below is a SUGGESTED,
 * non-exhaustive vocabulary departments may tag their knowledge with when
 * committing — Platform Memory itself does not enforce, validate, or
 * understand these categories in any way. That's deliberate: teaching
 * Platform Memory a fixed business taxonomy would mean it "understands"
 * business meaning, which contradicts its actual job (Store, Retrieve,
 * Version, Search, Relationships, Security — nothing else). Each
 * department's own knowledge.js decides what categories mean for its
 * domain; these are just common ones worth reusing where they fit.
 * ---------------------------------------------------------------------------
 */

const KNOWLEDGE_CATEGORY = Object.freeze({
  ENGINEERING_ARTIFACT: 'EngineeringArtifact',
  RESEARCH_REPORT: 'ResearchReport',
  BUSINESS_STRATEGY: 'BusinessStrategy',
  CONTENT: 'Content',
  ANALYTICS: 'Analytics',
  REVENUE_INTELLIGENCE: 'RevenueIntelligence',
  UI_STANDARD: 'UIStandard',
  ARCHITECTURE_PATTERN: 'ArchitecturePattern',
  SUPPLIER_INTELLIGENCE: 'SupplierIntelligence',
  PRODUCT_INTELLIGENCE: 'ProductIntelligence',
  MARKET_INTELLIGENCE: 'MarketIntelligence',
  LESSON_LEARNED: 'LessonLearned',
  BEST_PRACTICE: 'BestPractice',
  DEPARTMENT_DEFINITION: 'DepartmentDefinition'
});

const SERVICE_NAME = 'platform-memory';
const SERVICE_VERSION = '0.1.0';

module.exports = { KNOWLEDGE_CATEGORY, SERVICE_NAME, SERVICE_VERSION };
