'use client';

/**
 * app/page.tsx — Executive Command Center
 * ---------------------------------------------------------------------------
 * The heart of AIBAOS. Three actions, matching how a founder actually
 * runs this: (1) Prompt Creator — Claude helps turn a rough idea into a
 * clear objective, (2) Create Department — submit that objective to
 * Engineering and watch it build, certify, and commit to Platform Memory,
 * (3) Activate — the executive's own approval step before a department
 * goes live and produces its Marketplace package. Nothing here is a mockup
 * of that flow; every action hits the real Engineering Department.
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import DepartmentCreator from '../components/DepartmentCreator';
import PendingActivations from '../components/PendingActivations';
import ActivityFeed from '../components/ActivityFeed';
import ResultPanel from '../components/ResultPanel';
import StatusStrip from '../components/StatusStrip';
import { useStatus } from '../lib/useStatus';
import { usePipelineRun } from '../lib/usePipelineRun';

export default function CommandCenter() {
  const status = useStatus();
  const { events, isRunning, result, error, run } = usePipelineRun();
  const [pendingRefreshKey, setPendingRefreshKey] = useState(0);

  async function handleSubmit(spec: { businessObjective: string; capabilities: string[]; targetDepartmentName?: string }) {
    await run({
      businessObjective: spec.businessObjective,
      requestedBy: 'Executive',
      capabilities: spec.capabilities,
      targetDepartmentName: spec.targetDepartmentName
    });
    setPendingRefreshKey((k) => k + 1);
  }

  return (
    <main className="max-w-3xl mx-auto px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-[24px] font-semibold text-ink mb-1.5">Executive Command Center</h1>
        <p className="text-ink-muted text-[13px]">
          Tell your AI organization what you need. It decides how to build it.
        </p>
      </motion.div>

      <div className="mb-6">
        <StatusStrip health={status?.health ?? null} metrics={status?.metrics ?? null} />
      </div>

      <div className="flex flex-col gap-5">
        <DepartmentCreator onSubmit={handleSubmit} isRunning={isRunning} />

        {(events.length > 0 || result || error) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel p-4">
            <div className="panel-title">Live Engineering Activity</div>
            <ActivityFeed events={events} />
          </motion.div>
        )}

        <ResultPanel result={result} error={error} />

        <PendingActivations refreshKey={pendingRefreshKey} />

        {!events.length && !result && (
          <div className="panel p-4">
            <div className="panel-title">Recent Company Activity</div>
            {status?.history?.length ? (
              <ul className="flex flex-col gap-2">
                {status.history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-muted">
                      {h.kind === 'BUILD' && h.payload.outcome === 'SUCCESS' && 'Engineering completed a department'}
                      {h.kind === 'BUILD' && h.payload.outcome === 'FAILURE' && 'Engineering build failed'}
                      {h.kind === 'REPAIR' && 'Repair Engineer resolved validation issues'}
                      {h.kind === 'GENERATION' && 'Engineering generated new files'}
                      {h.kind === 'UPGRADE' && 'Executive activated a department'}
                    </span>
                    <span className="text-ink-faint font-mono text-[11px]">
                      {new Date(h.at).toLocaleTimeString([], { hour12: false })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-ink-faint">No history yet. This is where your company's story begins.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
