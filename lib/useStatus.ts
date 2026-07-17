'use client';

/**
 * lib/useStatus.ts
 * ---------------------------------------------------------------------------
 * Polls /api/status for workforce, health, metrics, and history. Shared by
 * every executive page so the organization's vital signs stay current
 * without each page re-implementing the polling loop.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import type { StatusResponse } from './types';

export function useStatus(intervalMs = 4000) {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // Best-effort polling; the page still renders without live status.
      }
    }

    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return status;
}
