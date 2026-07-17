/**
 * lib/types.ts
 * ---------------------------------------------------------------------------
 * Shared shapes passed between the live backend (departments/engineering)
 * and the Executive Interface. These mirror the real objects manager.js,
 * events.js, and metrics.js produce — the UI never invents fields the
 * backend doesn't actually emit.
 * ---------------------------------------------------------------------------
 */

export interface WorkforceMember {
  key: string;
  role: string;
}

export interface HealthSnapshot {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  runtime: { status: string; activeExecutions: number };
  openai: { ok: boolean; reason?: string };
  platformMemory: { ok: boolean; reason?: string };
  qualityAssuranceDirector: { ok: boolean; reason?: string };
  resources: { rssMB: number; heapUsedMB: number; uptimeSec: number };
  failureCount: number;
  checkedAt: string;
}

export interface MetricsSnapshot {
  buildSuccessRate: number | null;
  averageGenerationTimeMs: number | null;
  qadApprovalRate: number | null;
  portabilityScore: number | null;
  maintainabilityScore: number | null;
  generatedAt: string;
}

export interface HistoryRecord {
  id: string;
  kind: 'BUILD' | 'GENERATION' | 'UPGRADE' | 'REPAIR';
  payload: Record<string, any>;
  at: string;
}

export interface StatusResponse {
  workforce: WorkforceMember[];
  health: HealthSnapshot;
  metrics: MetricsSnapshot;
  history: HistoryRecord[];
}

export interface LifecycleEvent {
  type: 'event';
  event: string;
  payload: Record<string, any>;
  at: string;
}

export interface PipelineResult {
  contract: { id: string; businessObjective: string; requestedBy: string };
  plan: {
    departmentName: string;
    capabilities: string[];
    optionalDirectories: string[];
    dataModels: { name: string; description: string }[];
  };
  artifact: {
    id: string;
    departmentName: string;
    fileCount: number;
    contributors: string[];
    checksum: string;
    createdAt: string;
  };
  state: { status: string };
  package: { packageName: string; zipPath: string } | null;
  pendingActivation?: boolean;
}

export interface CertificationRecord {
  submission: { artifactId: string; departmentName: string; contractId?: string; checksum?: string };
  verdict: 'PASS' | 'FAIL';
  certificateId?: string;
  issues?: { category: string; message: string }[];
  escalated?: boolean;
  certifiedAt: string;
}

export interface MemoryEntry {
  category: string;
  departmentName: string;
  certificateId: string;
  artifactId: string | null;
  summary: string;
  committedAt: string;
}

export interface MarketplacePackage {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

export interface PendingActivation {
  artifactId: string;
  departmentName: string;
  capabilities: string[];
  fileCount: number;
  certifiedAt: string;
}

export interface PromptCreatorResult {
  suggestedName: string;
  businessObjective: string;
  capabilities: string[];
}

export interface DepartmentDefinition {
  name: string;
  title: string;
  status: 'ACTIVE' | 'NOT_CREATED';
  category: string;
}

/**
 * Researched from standard business function taxonomy (finance, HR,
 * marketing, operations, IT, legal, R&D — the functions every corporate
 * structure converges on regardless of industry) combined with the
 * functions vertical AI agent companies are actually building for today
 * (customer support, sales/SDR, legal & compliance, recruiting, RevOps,
 * trust & safety) — i.e. not just the 8 originally named, but the
 * departments a real online business across any industry actually runs.
 */
export const KNOWN_DEPARTMENTS: DepartmentDefinition[] = [
  { name: 'engineering', title: 'Engineering', status: 'ACTIVE', category: 'Product & Technology' },

  // Revenue & Growth
  { name: 'sales', title: 'Sales', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'marketing', title: 'Marketing', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'growth', title: 'Growth & Demand Generation', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'customer-success', title: 'Customer Success', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'revenue', title: 'Revenue', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'revenue-operations', title: 'Revenue Operations', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'affiliate-partnerships', title: 'Affiliate & Partnerships', status: 'NOT_CREATED', category: 'Revenue & Growth' },
  { name: 'ecommerce', title: 'E-Commerce & Merchandising', status: 'NOT_CREATED', category: 'Revenue & Growth' },

  // Customer Experience
  { name: 'customer-support', title: 'Customer Support', status: 'NOT_CREATED', category: 'Customer Experience' },
  { name: 'community', title: 'Community Management', status: 'NOT_CREATED', category: 'Customer Experience' },
  { name: 'trust-safety', title: 'Trust & Safety', status: 'NOT_CREATED', category: 'Customer Experience' },

  // Research & Strategy
  { name: 'research', title: 'Research', status: 'NOT_CREATED', category: 'Research & Strategy' },
  { name: 'strategy', title: 'Strategy', status: 'NOT_CREATED', category: 'Research & Strategy' },
  { name: 'business-development', title: 'Business Development', status: 'NOT_CREATED', category: 'Research & Strategy' },
  { name: 'competitive-intelligence', title: 'Competitive Intelligence', status: 'NOT_CREATED', category: 'Research & Strategy' },

  // Content & Brand
  { name: 'content', title: 'Content', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'publisher', title: 'Publisher', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'seo', title: 'SEO & Organic Growth', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'social-media', title: 'Social Media', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'public-relations', title: 'Public Relations & Communications', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'brand-creative', title: 'Brand & Creative', status: 'NOT_CREATED', category: 'Content & Brand' },
  { name: 'localization', title: 'Localization & Translation', status: 'NOT_CREATED', category: 'Content & Brand' },

  // Product & Technology
  { name: 'product', title: 'Product Management', status: 'NOT_CREATED', category: 'Product & Technology' },
  { name: 'data-engineering', title: 'Data Engineering', status: 'NOT_CREATED', category: 'Product & Technology' },
  { name: 'devops', title: 'DevOps & Infrastructure', status: 'NOT_CREATED', category: 'Product & Technology' },
  { name: 'cybersecurity', title: 'Cybersecurity', status: 'NOT_CREATED', category: 'Product & Technology' },

  // Operations
  { name: 'operations', title: 'Operations', status: 'NOT_CREATED', category: 'Operations' },
  { name: 'production', title: 'Production', status: 'NOT_CREATED', category: 'Operations' },
  { name: 'procurement', title: 'Procurement', status: 'NOT_CREATED', category: 'Operations' },
  { name: 'supply-chain', title: 'Supply Chain & Logistics', status: 'NOT_CREATED', category: 'Operations' },
  { name: 'vendor-management', title: 'Facilities & Vendor Management', status: 'NOT_CREATED', category: 'Operations' },

  // People & Culture
  { name: 'human-resources', title: 'Human Resources', status: 'NOT_CREATED', category: 'People & Culture' },
  { name: 'recruiting', title: 'Recruiting & Talent Acquisition', status: 'NOT_CREATED', category: 'People & Culture' },
  { name: 'learning-development', title: 'Learning & Development', status: 'NOT_CREATED', category: 'People & Culture' },

  // Finance & Legal
  { name: 'finance', title: 'Finance & Accounting', status: 'NOT_CREATED', category: 'Finance & Legal' },
  { name: 'legal-compliance', title: 'Legal & Compliance', status: 'NOT_CREATED', category: 'Finance & Legal' },
  { name: 'risk-management', title: 'Risk Management', status: 'NOT_CREATED', category: 'Finance & Legal' },
  { name: 'investor-relations', title: 'Investor Relations', status: 'NOT_CREATED', category: 'Finance & Legal' },

  // Data & Intelligence
  { name: 'analytics', title: 'Analytics', status: 'NOT_CREATED', category: 'Data & Intelligence' },
  { name: 'business-intelligence', title: 'Business Intelligence', status: 'NOT_CREATED', category: 'Data & Intelligence' },
  { name: 'market-intelligence', title: 'Market Intelligence', status: 'NOT_CREATED', category: 'Data & Intelligence' },

  // Governance
  { name: 'approval', title: 'Approval', status: 'NOT_CREATED', category: 'Governance' },
  { name: 'privacy', title: 'Privacy & Data Protection', status: 'NOT_CREATED', category: 'Governance' }
];

export function departmentsByCategory(): { category: string; departments: DepartmentDefinition[] }[] {
  const categories: string[] = [];
  const grouped = new Map<string, DepartmentDefinition[]>();
  for (const dept of KNOWN_DEPARTMENTS) {
    if (dept.status !== 'NOT_CREATED') continue;
    if (!grouped.has(dept.category)) {
      grouped.set(dept.category, []);
      categories.push(dept.category);
    }
    grouped.get(dept.category)!.push(dept);
  }
  return categories.map((category) => ({ category, departments: grouped.get(category)! }));
}
