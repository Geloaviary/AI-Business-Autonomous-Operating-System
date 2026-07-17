'use client';

/**
 * components/StatusStrip.tsx
 * ---------------------------------------------------------------------------
 * A compact, always-visible summary of organization health and key
 * performance indicators — the executive doesn't have to go looking for
 * whether the company is functioning normally.
 * ---------------------------------------------------------------------------
 */

import type { HealthSnapshot, MetricsSnapshot } from '../lib/types';

export default function StatusStrip({
  health,
  metrics
}: {
  health: HealthSnapshot | null;
  metrics: MetricsSnapshot | null;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card
        label="Company Health"
        value={health?.status || '—'}
        tone={health?.status === 'HEALTHY' ? 'good' : health?.status === 'DEGRADED' ? 'warn' : health ? 'bad' : 'muted'}
      />
      <Card
        label="Build Success Rate"
        value={formatPct(metrics?.buildSuccessRate)}
        tone="accent"
      />
      <Card
        label="QAD Approval Rate"
        value={formatPct(metrics?.qadApprovalRate)}
        tone="accent"
      />
      <Card
        label="Active Executions"
        value={String(health?.runtime?.activeExecutions ?? 0)}
        tone="accent"
      />
    </div>
  );
}

function formatPct(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value * 100)}%`;
}

function Card({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'accent' | 'muted' }) {
  const toneClass: Record<string, string> = {
    good: 'text-good',
    warn: 'text-warn',
    bad: 'text-bad',
    accent: 'text-accent',
    muted: 'text-ink-muted'
  };
  return (
    <div className="panel p-3.5">
      <div className={`text-lg font-bold ${toneClass[tone]}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint mt-0.5">{label}</div>
    </div>
  );
}
