'use client';

/**
 * components/WorkforcePanel.tsx
 * ---------------------------------------------------------------------------
 * Visualizes the AI Workforce roster (agents/index.js) and highlights which
 * employees are currently contributing, based on real WorkerAssigned /
 * WorkerCompleted-shaped signals inferred from the live event stream.
 * ---------------------------------------------------------------------------
 */

import type { WorkforceMember } from '../lib/types';

const ROLE_TITLES: Record<string, string> = {
  ChiefArchitect: 'Sets technical direction',
  ProjectArchitect: 'Plans department architecture',
  SeniorSoftwareEngineer: 'Reviews the architecture plan',
  ConstitutionalEngineer: 'Builds the constitutional plumbing',
  WorkforceResearchAnalyst: 'Researches how the new department should be staffed',
  WorkforceEngineer: "Hires the new department's own specialized staff",
  BackendEngineer: 'Builds runtime & services',
  FrontendEngineer: 'Builds the dashboard',
  FullStackEngineer: 'Wires the composition root',
  DatabaseEngineer: 'Designs data models',
  SecurityEngineer: 'Reviews for vulnerabilities',
  QAEngineer: 'Runs internal tests',
  DocumentationEngineer: 'Writes the README',
  DeploymentEngineer: 'Prepares the package manifest',
  RepairEngineer: 'Resolves validation issues'
};

export default function WorkforcePanel({
  workforce,
  activeRoles
}: {
  workforce: WorkforceMember[];
  activeRoles: Set<string>;
}) {
  return (
    <div className="panel p-4">
      <div className="panel-title">AI Workforce</div>
      <div className="flex flex-col gap-1">
        {workforce.map((employee) => {
          const isActive = activeRoles.has(employee.role);
          return (
            <div
              key={employee.key}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-[12.5px] transition-colors ${
                isActive ? 'bg-accent-soft' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-accent animate-pulseSoft' : 'bg-base-600'
                  }`}
                />
                <span className="flex flex-col">
                  <span className={isActive ? 'text-ink font-medium' : 'text-ink-muted'}>
                    {employee.role.replace(/([a-z])([A-Z])/g, '$1 $2')}
                  </span>
                  <span className="text-[10px] text-ink-faint">{ROLE_TITLES[employee.role]}</span>
                </span>
              </div>
              {isActive && <span className="badge badge-accent">working</span>}
            </div>
          );
        })}
      </div>
      {!activeRoles.size && (
        <p className="text-[11px] text-ink-faint mt-3 leading-relaxed">
          Idle. Submit a business objective to assign work.
        </p>
      )}
    </div>
  );
}
