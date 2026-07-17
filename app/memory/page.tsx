'use client';

/**
 * app/memory/page.tsx — Platform Memory Explorer
 * ---------------------------------------------------------------------------
 * Browses the organization's certified institutional knowledge. Read-only,
 * by design — matching the constitutional rule that only the Quality
 * Assurance Director may write to Platform Memory. Data comes straight
 * from the standalone PlatformMemoryClientStub via /api/memory.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react';
import type { MemoryEntry } from '../../lib/types';

export default function MemoryExplorer() {
  const [knowledge, setKnowledge] = useState<MemoryEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (!cancelled) setKnowledge(data.knowledge);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return knowledge;
    const q = query.toLowerCase();
    return knowledge.filter((k) => JSON.stringify(k).toLowerCase().includes(q));
  }, [knowledge, query]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const k of knowledge) counts[k.category] = (counts[k.category] || 0) + 1;
    return counts;
  }, [knowledge]);

  return (
    <main className="px-8 py-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-[19px] font-semibold">Platform Memory</h1>
        <p className="text-ink-muted text-[13px] mt-0.5">
          The organization's institutional brain — certified knowledge only, contributed to and read by every department.
        </p>
      </header>

      <div className="grid grid-cols-[220px_1fr] gap-5 items-start">
        <div className="panel p-4">
          <div className="panel-title">Knowledge Categories</div>
          {Object.keys(categories).length === 0 ? (
            <p className="text-[11.5px] text-ink-faint">No certified knowledge yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {Object.entries(categories).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-muted">{type}</span>
                  <span className="pill">{count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="panel-title mt-6">Growth</div>
          <div className="text-2xl font-bold text-accent">{knowledge.length}</div>
          <div className="text-[10.5px] text-ink-faint">certified entries</div>
        </div>

        <div className="flex flex-col gap-4">
          <input
            className="input-field"
            placeholder="Search certified knowledge…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {filtered.length === 0 ? (
            <div className="panel p-8 text-center text-ink-faint text-[12.5px]">
              {knowledge.length === 0
                ? 'Platform Memory is empty. It grows every time an artifact is certified by the Quality Assurance Director.'
                : 'No entries match your search.'}
            </div>
          ) : (
            filtered.map((entry, i) => (
              <div key={i} className="panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-accent">{entry.category}</span>
                  <span className="text-[10.5px] text-ink-faint font-mono">{entry.certificateId}</span>
                </div>
                <p className="text-[13px] text-ink">{entry.summary}</p>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-ink-muted">
                  <span>Source: {entry.departmentName}</span>
                  <span>·</span>
                  <span>{new Date(entry.committedAt).toLocaleString([], { hour12: false })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
