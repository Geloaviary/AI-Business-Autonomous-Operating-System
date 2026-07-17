'use client';

/**
 * components/ResultPanel.tsx
 * ---------------------------------------------------------------------------
 * Once a pipeline run completes, shows the tangible outputs of the
 * constitutional lifecycle, pulled directly from manager.js's result
 * object — the generated department's plan, its file manifest, and the
 * final marketplace package.
 * ---------------------------------------------------------------------------
 */

import { motion } from 'framer-motion';
import type { PipelineResult } from '../lib/types';

export default function ResultPanel({
  result,
  error
}: {
  result: PipelineResult | null;
  error: { name: string; message: string } | null;
}) {
  if (error) {
    return (
      <div className="panel p-4 border-bad/30">
        <div className="panel-title text-bad">Pipeline Failed</div>
        <div className="text-[13px] text-ink">
          <span className="font-semibold text-bad">{error.name}:</span> {error.message}
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { plan, artifact, state, package: pkg } = result;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <div className="panel p-4">
        <div className="panel-title">Generated Department</div>
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Department" value={plan.departmentName} />
          <Stat label="Files Generated" value={String(artifact.fileCount)} />
          <Stat label="AI Contributors" value={String(artifact.contributors.length)} />
          <Stat label="Final Status" value={<span className="badge badge-good">{state.status}</span>} />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {artifact.contributors.map((role) => (
            <span className="pill" key={role}>{role}</span>
          ))}
        </div>
      </div>

      {pkg && (
        <div className="panel p-4">
          <div className="panel-title">Marketplace Package</div>
          <div className="font-mono text-[13px] text-ink">{pkg.packageName}</div>
          <div className="text-[11px] text-ink-faint mt-1">{pkg.zipPath}</div>
        </div>
      )}

      {result.pendingActivation && (
        <div className="panel p-4 border-warn/20">
          <div className="panel-title text-warn">Awaiting Activation</div>
          <p className="text-[12.5px] text-ink-muted">
            Certified by the Quality Assurance Director and committed to Platform Memory.
            It will not go live or produce a Marketplace package until you activate it below.
          </p>
        </div>
      )}

      <div className="panel p-4">
        <div className="panel-title">Architecture Plan</div>
        <div className="flex flex-wrap gap-1.5">
          {(plan.capabilities || []).map((cap) => (
            <span className="pill" key={cap}>{cap}</span>
          ))}
        </div>
        <div className="text-[11.5px] text-ink-muted mt-3">
          Optional directories: {plan.optionalDirectories?.join(', ')}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-base-800 border border-base-700 rounded-lg p-3">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint mt-0.5">{label}</div>
    </div>
  );
}
