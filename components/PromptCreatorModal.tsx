'use client';

/**
 * components/PromptCreatorModal.tsx
 * ---------------------------------------------------------------------------
 * Button 1 of the department-creation flow. The executive describes a
 * rough idea in their own words; Claude refines it into a clear business
 * objective and capability list shaped for the Engineering Department's
 * Contract. "Use This" hands the result to the Department Creator form.
 * ---------------------------------------------------------------------------
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromptCreatorResult } from '../lib/types';

export default function PromptCreatorModal({
  onUse
}: {
  onUse: (result: PromptCreatorResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [roughIdea, setRoughIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptCreatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!roughIdea.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/prompt-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roughIdea })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  }

  function useResult() {
    if (!result) return;
    onUse(result);
    setOpen(false);
    setRoughIdea('');
    setResult(null);
  }

  return (
    <>
      <button type="button" className="pill hover:text-ink hover:border-accent/40 transition-colors" onClick={() => setOpen(true)}>
        ✨ Prompt Creator
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="panel p-5 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="panel-title">Prompt Creator</div>
              <p className="text-[12.5px] text-ink-muted mb-3">
                Describe what you need in your own words. Claude will turn it into a clear
                business objective for Engineering.
              </p>

              <textarea
                className="input-field"
                rows={3}
                placeholder={'e.g. "we keep losing track of which suppliers we\'ve paid and when"'}
                value={roughIdea}
                onChange={(e) => setRoughIdea(e.target.value)}
                autoFocus
              />

              <button type="button" className="btn-primary mt-3" onClick={generate} disabled={loading || !roughIdea.trim()}>
                {loading ? 'Thinking…' : 'Generate'}
              </button>

              {error && <p className="text-[12px] text-bad mt-3">{error}</p>}

              {result && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-base-800 border border-base-700 rounded-lg p-3.5">
                  <div className="text-[13px] font-semibold text-ink mb-1">{result.suggestedName} Department</div>
                  <p className="text-[12.5px] text-ink-muted mb-2">{result.businessObjective}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {result.capabilities.map((cap) => (
                      <span className="pill" key={cap}>{cap}</span>
                    ))}
                  </div>
                  <button type="button" className="btn-primary" onClick={useResult}>
                    Use This
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
