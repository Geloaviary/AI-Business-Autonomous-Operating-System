'use strict';

/**
 * agents/workforce-archetypes.js
 * ---------------------------------------------------------------------------
 * Engineering's own institutional knowledge of how real business units are
 * staffed — consulted by WorkforceResearchAnalyst BEFORE it ever looks at
 * what an executive typed into a capabilities box. This is the direct fix
 * for a real design mistake: deriving a department's workforce mechanically
 * from executive-provided text isn't organizational design, it's string
 * manipulation. A real CTO staffing a new Marketing department doesn't ask
 * the founder to list job titles — they already know what a Marketing
 * department needs and how many people fill each role, and research it
 * when they don't.
 *
 * Knowledge priority (matches the platform's own knowledge strategy):
 *   1. Platform Memory — a previously certified staffing pattern for this
 *      exact or a similar department (checked in workforce-research.js,
 *      not here — this file has no knowledge of runtime state).
 *   2. This archetype library — Engineering's own built-in expertise,
 *      matched by keyword against the department name and business
 *      objective. Not AI-generated per request; authored once, reused
 *      every time, exactly like a real org-design playbook would be.
 *   3. OpenAI — provisional, used only when nothing here matches either,
 *      i.e. a genuinely novel kind of department.
 * ---------------------------------------------------------------------------
 */

/**
 * Each archetype: keywords used to match a department name/objective, and
 * the staffing roster a real, lean version of that department would need.
 * Counts reflect a lean AI-native unit, not a large traditional company —
 * BAOS departments are meant to be small, specialized teams.
 */
const ARCHETYPES = [
  {
    keywords: ['marketing', 'brand', 'demand-generation', 'growth-marketing'],
    roles: [
      { title: 'MarketingStrategist', responsibility: 'Overall positioning, campaign strategy, and messaging', count: 1 },
      { title: 'ContentMarketingSpecialist', responsibility: 'Marketing content creation across channels', count: 1 },
      { title: 'SEOGrowthSpecialist', responsibility: 'Organic acquisition and search visibility', count: 1 },
      { title: 'SocialMediaSpecialist', responsibility: 'Social channel presence and engagement', count: 1 },
      { title: 'MarketingAnalyticsSpecialist', responsibility: 'Campaign performance measurement and attribution', count: 1 }
    ]
  },
  {
    keywords: ['affiliate', 'partnership', 'partner-program'],
    roles: [
      { title: 'PartnershipManager', responsibility: 'Recruiting and managing affiliate/partner relationships', count: 1 },
      { title: 'AffiliateProgramCoordinator', responsibility: 'Day-to-day program operations and payouts', count: 1 },
      { title: 'PerformanceMarketingAnalyst', responsibility: 'Tracking conversion and ROI per partner channel', count: 1 }
    ]
  },
  {
    keywords: ['sales', 'business-development', 'account-executive'],
    roles: [
      { title: 'SalesDevelopmentRepresentative', responsibility: 'Prospecting and qualifying new leads', count: 2 },
      { title: 'AccountExecutive', responsibility: 'Closing deals and managing the sales cycle', count: 1 },
      { title: 'SalesOperationsAnalyst', responsibility: 'Pipeline reporting and sales process efficiency', count: 1 }
    ]
  },
  {
    keywords: ['procurement', 'purchasing', 'sourcing', 'supplier'],
    roles: [
      { title: 'SupplierSourcingSpecialist', responsibility: 'Identifying and qualifying suppliers', count: 1 },
      { title: 'PurchaseOrderCoordinator', responsibility: 'Issuing and tracking purchase orders', count: 1 },
      { title: 'VendorRelationshipManager', responsibility: 'Ongoing supplier relationship and performance management', count: 1 },
      { title: 'ContractNegotiationSpecialist', responsibility: 'Negotiating pricing and supply terms', count: 1 }
    ]
  },
  {
    keywords: ['research', 'market-research', 'competitive-intelligence'],
    roles: [
      { title: 'MarketResearchAnalyst', responsibility: 'Analyzing market size, demand, and opportunity', count: 1 },
      { title: 'CompetitorIntelligenceAnalyst', responsibility: 'Tracking competitor moves and positioning', count: 1 },
      { title: 'TrendAnalyst', responsibility: 'Identifying emerging trends relevant to the business', count: 1 },
      { title: 'DataCollectionSpecialist', responsibility: 'Sourcing and structuring raw research data', count: 1 }
    ]
  },
  {
    keywords: ['strategy', 'corporate-strategy', 'strategic-planning'],
    roles: [
      { title: 'StrategyAnalyst', responsibility: 'Synthesizing research into strategic recommendations', count: 1 },
      { title: 'CompetitivePositioningSpecialist', responsibility: 'Defining differentiation and market position', count: 1 },
      { title: 'BusinessDevelopmentAnalyst', responsibility: 'Evaluating new business opportunities', count: 1 }
    ]
  },
  {
    keywords: ['content', 'editorial', 'copywriting'],
    roles: [
      { title: 'ContentStrategist', responsibility: 'Editorial calendar and content strategy', count: 1 },
      { title: 'ContentWriter', responsibility: 'Producing written content', count: 2 },
      { title: 'ContentEditor', responsibility: 'Editing and quality control of published content', count: 1 }
    ]
  },
  {
    keywords: ['publisher', 'publishing', 'distribution', 'syndication'],
    roles: [
      { title: 'PublishingCoordinator', responsibility: 'Scheduling and coordinating releases', count: 1 },
      { title: 'DistributionSpecialist', responsibility: 'Managing distribution across channels', count: 1 },
      { title: 'ChannelManager', responsibility: 'Relationship and performance management per channel', count: 1 }
    ]
  },
  {
    keywords: ['production', 'manufacturing', 'fulfillment-ops'],
    roles: [
      { title: 'ProductionCoordinator', responsibility: 'Scheduling and coordinating production runs', count: 1 },
      { title: 'QualityControlSpecialist', responsibility: 'Inspecting output against quality standards', count: 1 },
      { title: 'WorkflowOptimizationSpecialist', responsibility: 'Improving production throughput and efficiency', count: 1 }
    ]
  },
  {
    keywords: ['approval', 'authorization', 'sign-off'],
    roles: [
      { title: 'ApprovalWorkflowSpecialist', responsibility: 'Routing requests through the correct approval chain', count: 1 },
      { title: 'ComplianceReviewer', responsibility: 'Checking requests against policy before approval', count: 1 },
      { title: 'RiskAssessmentSpecialist', responsibility: 'Flagging high-risk requests for extra scrutiny', count: 1 }
    ]
  },
  {
    keywords: ['analytics', 'business-intelligence', 'reporting', 'data'],
    roles: [
      { title: 'DataAnalyst', responsibility: 'Ad hoc analysis and reporting', count: 1 },
      { title: 'BusinessIntelligenceSpecialist', responsibility: 'Building dashboards and recurring reports', count: 1 },
      { title: 'MetricsEngineer', responsibility: 'Instrumenting systems to produce reliable metrics', count: 1 }
    ]
  },
  {
    keywords: ['revenue', 'billing', 'forecasting', 'pricing'],
    roles: [
      { title: 'RevenueAnalyst', responsibility: 'Tracking and explaining revenue performance', count: 1 },
      { title: 'ForecastingSpecialist', responsibility: 'Building and maintaining revenue forecasts', count: 1 },
      { title: 'BillingReconciliationSpecialist', responsibility: 'Ensuring billing accuracy and resolving discrepancies', count: 1 },
      { title: 'PricingStrategist', responsibility: 'Setting and testing pricing strategy', count: 1 }
    ]
  },
  {
    keywords: ['customer-support', 'customer-success', 'help-desk', 'technical-support'],
    roles: [
      { title: 'CustomerSupportSpecialist', responsibility: 'Handling inbound customer questions and issues', count: 2 },
      { title: 'CustomerSuccessManager', responsibility: 'Proactive account health and retention', count: 1 },
      { title: 'SupportOperationsAnalyst', responsibility: 'Support metrics, staffing, and process improvement', count: 1 }
    ]
  },
  {
    keywords: ['human-resources', 'recruiting', 'talent', 'people'],
    roles: [
      { title: 'RecruitingSpecialist', responsibility: 'Sourcing and screening candidates', count: 1 },
      { title: 'EmployeeRelationsSpecialist', responsibility: 'Handling employee concerns and engagement', count: 1 },
      { title: 'CompensationBenefitsAnalyst', responsibility: 'Managing pay and benefits programs', count: 1 },
      { title: 'LearningDevelopmentSpecialist', responsibility: 'Training and career development programs', count: 1 }
    ]
  },
  {
    keywords: ['finance', 'accounting', 'accounts-payable', 'accounts-receivable', 'budgeting'],
    roles: [
      { title: 'FinancialAnalyst', responsibility: 'Financial modeling and analysis', count: 1 },
      { title: 'AccountsPayableSpecialist', responsibility: 'Processing outgoing payments', count: 1 },
      { title: 'AccountsReceivableSpecialist', responsibility: 'Collecting incoming payments', count: 1 },
      { title: 'BudgetingForecastingAnalyst', responsibility: 'Budget planning and variance analysis', count: 1 }
    ]
  },
  {
    keywords: ['legal', 'compliance', 'regulatory', 'contract-review'],
    roles: [
      { title: 'ContractReviewSpecialist', responsibility: 'Reviewing and redlining contracts', count: 1 },
      { title: 'ComplianceAnalyst', responsibility: 'Monitoring regulatory compliance', count: 1 },
      { title: 'RegulatoryAffairsSpecialist', responsibility: 'Tracking regulatory changes affecting the business', count: 1 }
    ]
  },
  {
    keywords: ['operations', 'process-improvement', 'logistics'],
    roles: [
      { title: 'OperationsAnalyst', responsibility: 'Monitoring and improving operational processes', count: 1 },
      { title: 'ProcessImprovementSpecialist', responsibility: 'Identifying and eliminating inefficiencies', count: 1 },
      { title: 'LogisticsCoordinator', responsibility: 'Coordinating movement of goods/resources', count: 1 }
    ]
  },
  {
    keywords: ['product', 'product-management', 'ux-research'],
    roles: [
      { title: 'ProductManager', responsibility: 'Defining product requirements and roadmap', count: 1 },
      { title: 'ProductAnalyst', responsibility: 'Analyzing product usage and performance', count: 1 },
      { title: 'UXResearchSpecialist', responsibility: 'Understanding user needs and behavior', count: 1 }
    ]
  },
  {
    keywords: ['security', 'cybersecurity', 'threat-intelligence'],
    roles: [
      { title: 'SecurityAnalyst', responsibility: 'Monitoring for and responding to security incidents', count: 1 },
      { title: 'ThreatIntelligenceSpecialist', responsibility: 'Tracking emerging threats relevant to the business', count: 1 },
      { title: 'ComplianceRiskSpecialist', responsibility: 'Security compliance and risk assessment', count: 1 }
    ]
  },
  {
    keywords: ['ecommerce', 'merchandising', 'catalog'],
    roles: [
      { title: 'MerchandisingSpecialist', responsibility: 'Product assortment and presentation strategy', count: 1 },
      { title: 'CatalogManager', responsibility: 'Maintaining accurate, complete product listings', count: 1 },
      { title: 'ConversionOptimizationSpecialist', responsibility: 'Improving on-site conversion rate', count: 1 }
    ]
  }
];

/** Generic fallback for a department type with no matching archetype — deliberately small and honest about being provisional. */
const GENERIC_FALLBACK_ROLES = [
  { title: 'OperationsLead', responsibility: 'Overall coordination of the department\'s work', count: 1 },
  { title: 'OperationsAnalyst', responsibility: 'Day-to-day execution and analysis', count: 1 },
  { title: 'QualityCoordinator', responsibility: 'Ensuring output meets a consistent standard', count: 1 }
];

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Matches a department name + business objective against the archetype
 * library by keyword. Returns null if nothing matches (caller falls back
 * to OpenAI research, then the generic roster as a last resort).
 */
function matchArchetype(departmentName, businessObjective) {
  const haystack = `${normalize(departmentName)}-${normalize(businessObjective)}`;
  for (const archetype of ARCHETYPES) {
    if (archetype.keywords.some((kw) => haystack.includes(kw))) {
      return { roles: archetype.roles.map((r) => ({ ...r })), matchedKeywords: archetype.keywords };
    }
  }
  return null;
}

module.exports = { matchArchetype, GENERIC_FALLBACK_ROLES };
