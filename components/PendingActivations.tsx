'use client';

/**
 * components/PendingActivations.tsx
 * ---------------------------------------------------------------------------
 * Button 3 of the department-creation flow. Departments that Engineering
 * has already built and the Quality Assurance Director has already
 * certified and committed to Platform Memory — but which are not yet part
 * of the live platform. Only the executive's click here makes that
 * decision. Activating produces the Marketplace ZIP immediately.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PendingActivation } from '../lib/types';

export default function PendingActivations({ refreshKey }: { refreshKey: number }) {
  const [pending, setPending] = useState<PendingActivation[]>([]);
  const [activating, setActivating] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<{ departmentName: string; packageName: string } | null>(null);

  async function load() {
    const res = await fetch('/api/pending');
    const data = await res.json();
    setPending(data.pending);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  async function activate(artifactId: string) {
    setActivating(artifactId);
    setJustActivated(null);
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId })
      });
      const data = await res.json();
      if (res.ok) {
        setJustActivated({ departmentName: data.result.departmentName, packageName: data.result.package.packageName });
        await load();
      }
    } finally {
      setActivating(null);
    }
  }

  if (pending.length === 0 && !justActivated) return null;

  return (
    <div className="panel p-4 border-good/20">
      <div className="panel-title text-good">Awaiting Your Activation</div>

      <AnimatePresence>
        {justActivated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-good-soft text-good text-[12.5px] rounded-lg p-3 mb-3"
          >
            {justActivated.departmentName} is now live. {justActivated.packageName} is in the Marketplace.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2.5">
        {pending.map((p) => (
          <motion.div
            key={p.artifactId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-base-800 border border-base-700 rounded-lg p-3.5"
          >
            <div>
              <div className="text-[13.5px] font-semibold text-ink capitalize">{p.departmentName}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {p.capabilities.slice(0, 3).map((cap) => (
                  <span className="pill" key={cap}>{cap}</span>
                ))}
              </div>
              <div className="text-[10.5px] text-ink-faint mt-1.5">
                {p.fileCount} files · certified {new Date(p.certifiedAt).toLocaleTimeString([], { hour12: false })}
              </div>
            </div>
            <button
              type="button"
              className="btn-primary shrink-0"
              onClick={() => activate(p.artifactId)}
              disabled={activating === p.artifactId}
            >
              {activating === p.artifactId ? 'Activating…' : 'Activate'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
