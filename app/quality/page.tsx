'use client';

/**
 * app/quality/page.tsx — Quality Assurance Center
 * ---------------------------------------------------------------------------
 * The certification center for the constitutional guardian of AIBAOS.
 * Every artifact any department ever produces passes through here before
 * it can become organizational truth. Data comes from the standalone
 * QADClientStub via /api/quality.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import type { CertificationRecord } from '../../lib/types';

export default function QualityAssuranceCenter() {
  const [certifications, setCertifications] = useState<CertificationRecord[]>([]);
  const [metrics, setMetrics] = useState<{ total: number; passed: number; failed: number; approvalRate: number | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/quality');
      const data = await res.json();
      if (!cancelled) {
        setCertifications(data.certifications);
        setMetrics(data.metrics);
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <main className="px-8 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-[19px] font-semibold">Quality Assurance Director</h1>
        <p className="text-ink-muted text-[13px] mt-0.5">
          The constitutional guardian of AIBAOS. Only certified artifacts become organizational truth.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Metric label="Total Submissions" value={String(metrics?.total ?? 0)} tone="accent" />
        <Metric label="Certified" value={String(metrics?.passed ?? 0)} tone="good" />
        <Metric label="Rejected" value={String(metrics?.failed ?? 0)} tone="bad" />
        <Metric
          label="Approval Rate"
          value={metrics?.approvalRate != null ? `${Math.round(metrics.approvalRate * 100)}%` : '—'}
          tone="accent"
        />
      </div>

      <div className="panel p-4">
        <div className="panel-title">Certification History</div>
        {certifications.length === 0 ? (
          <p className="text-[12.5px] text-ink-faint py-6 text-center">
            No submissions yet. This is where every Engineering artifact will be certified or rejected.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {certifications.map((c, i) => (
              <div key={i} className="flex items-start justify-between border-b border-base-700 last:border-0 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${c.verdict === 'PASS' ? 'badge-good' : 'badge-bad'}`}>
                      {c.verdict === 'PASS' ? 'CERTIFIED' : 'REJECTED'}
                    </span>
                    {c.escalated && <span className="badge badge-warn">ESCALATED</span>}
                    <span className="text-[13px] text-ink font-medium">{c.submission.departmentName}</span>
                  </div>
                  <div className="text-[11px] text-ink-faint font-mono mt-1">
                    {c.certificateId || c.submission.artifactId}
                  </div>
                  {c.issues && c.issues.length > 0 && (
                    <ul className="mt-1.5 text-[11.5px] text-bad list-disc list-inside">
                      {c.issues.slice(0, 3).map((issue, idx) => (
                        <li key={idx}>{issue.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-[11px] text-ink-faint whitespace-nowrap">
                  {new Date(c.certifiedAt).toLocaleString([], { hour12: false })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'good' | 'bad' | 'accent' }) {
  const toneClass = { good: 'text-good', bad: 'text-bad', accent: 'text-accent' }[tone];
  return (
    <div className="panel p-3.5">
      <div className={`text-lg font-bold ${toneClass}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-ink-faint mt-0.5">{label}</div>
    </div>
  );
}
