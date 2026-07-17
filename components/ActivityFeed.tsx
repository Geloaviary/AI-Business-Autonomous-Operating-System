'use client';

/**
 * components/ActivityFeed.tsx
 * ---------------------------------------------------------------------------
 * Renders the live stream of constitutional lifecycle events exactly as
 * events.js emits them. Every entry here is a real event.publish() call
 * from the backend — nothing is synthesized for effect.
 * ---------------------------------------------------------------------------
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { LifecycleEvent } from '../lib/types';

export default function ActivityFeed({ events }: { events: LifecycleEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-ink-muted text-[12.5px] py-10">
        No activity yet. Submit a business objective from the Command Center to watch the company work.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {events.map((evt, i) => (
          <motion.div
            key={`${evt.at}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-[70px_16px_1fr] gap-2.5 items-start py-1.5"
          >
            <div className="text-[10.5px] text-ink-faint font-mono pt-0.5">{formatTime(evt.at)}</div>
            <div className="flex flex-col items-center h-full">
              <div className="w-2 h-2 rounded-full mt-1" style={{ background: colorFor(evt.event) }} />
              {i < events.length - 1 && <div className="flex-1 w-px bg-base-700 mt-1" />}
            </div>
            <div className="pb-1">
              <div className="text-[12.5px] font-semibold text-ink">{humanize(evt.event)}</div>
              {summarize(evt) && (
                <div className="text-[11px] text-ink-muted font-mono mt-0.5">{summarize(evt)}</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour12: false });
}

function humanize(eventName: string) {
  return eventName.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function colorFor(eventName: string) {
  if (/Failed|Rejected|Failure/.test(eventName)) return '#f0616d';
  if (/Passed|Certified|Committed|Activated|Generated|Completed/.test(eventName)) return '#3ecf8e';
  return '#5b8cff';
}

function summarize(evt: LifecycleEvent) {
  const p = evt.payload || {};
  if (p.plan?.departmentName) return `department: ${p.plan.departmentName}`;
  if (p.fileCount !== undefined) return `${p.fileCount} files`;
  if (p.issues) return `${p.issues.length} issue(s)`;
  if (p.certificateId) return p.certificateId;
  if (p.packageName) return p.packageName;
  if (p.contractId) return p.contractId;
  return null;
}
