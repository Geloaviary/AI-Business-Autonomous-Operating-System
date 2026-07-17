'use client';

/**
 * app/engineering/page.tsx — Engineering Workspace
 * ---------------------------------------------------------------------------
 * The department's own dashboard: workforce, a way to submit work directly
 * to Engineering, live build activity, and the resulting artifact —
 * following the common department layout (Overview / Current Work /
 * Health / Metrics) described in the platform constitution.
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import ActivityFeed from '../../components/ActivityFeed';
import ResultPanel from '../../components/ResultPanel';
import WorkforcePanel from '../../components/WorkforcePanel';
import StatusStrip from '../../components/StatusStrip';
import PendingActivations from '../../components/PendingActivations';
import { useStatus } from '../../lib/useStatus';
import { usePipelineRun } from '../../lib/usePipelineRun';

export default function EngineeringWorkspace() {
  const status = useStatus();
  const { events, isRunning, result, error, run, activeRoles } = usePipelineRun();
  const [objective, setObjective] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim()) return;
    await run({
      businessObjective: objective.trim(),
      requestedBy: 'Executive',
      capabilities: capabilities.split(',').map((c) => c.trim()).filter(Boolean)
    });
    setPendingRefreshKey((k) => k + 1);
  }

  return (
    <main className="px-8 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-[19px] font-semibold">Engineering Department</h1>
        <p className="text-ink-muted text-[13px] mt-0.5">
          The AI Engineering Organization — builds every department of AIBAOS.
        </p>
      </header>

      <div className="mb-6">
        <StatusStrip health={status?.health ?? null} metrics={status?.metrics ?? null} />
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5 items-start">
        <WorkforcePanel workforce={status?.workforce || []} activeRoles={activeRoles} />

        <div className="flex flex-col gap-5">
          <form onSubmit={handleSubmit} className="panel p-4">
            <div className="panel-title">Assign Work to Engineering</div>
            <textarea
              className="input-field"
              rows={2}
              placeholder='e.g. "Create a Procurement Department."'
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
            <input
              className="input-field mt-3"
              placeholder="Capabilities, comma-separated"
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
            />
            <button type="submit" className="btn-primary mt-3" disabled={isRunning || !objective.trim()}>
              {isRunning ? 'Engineering is working…' : 'Submit to Engineering'}
            </button>
          </form>

          <div className="panel p-4">
            <div className="panel-title">Live Implementation Progress</div>
            <ActivityFeed events={events} />
          </div>

          <ResultPanel result={result} error={error} />

          <PendingActivations refreshKey={pendingRefreshKey} />
        </div>
      </div>
    </main>
  );
}
