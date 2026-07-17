'use client';

/**
 * lib/usePipelineRun.ts
 * ---------------------------------------------------------------------------
 * Drives a single submission through /api/submit-request and consumes the
 * Server-Sent Event stream, exposing the live event list, running state,
 * final result, and any error. Shared by the Command Center and the
 * Engineering Workspace so both surfaces watch the same real execution.
 * ---------------------------------------------------------------------------
 */

import { useRef, useState } from 'react';
import type { LifecycleEvent, PipelineResult } from './types';

export interface RequestSpec {
  businessObjective: string;
  requestedBy?: string;
  capabilities?: string[];
  targetDepartmentName?: string;
}

export function usePipelineRun() {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<{ name: string; message: string } | null>(null);
  const activeRoles = useRef<Set<string>>(new Set());

  async function run(requestSpec: RequestSpec) {
    setIsRunning(true);
    setEvents([]);
    setResult(null);
    setError(null);
    activeRoles.current = new Set();

    const res = await fetch('/api/submit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestSpec)
    });

    if (!res.body) {
      setIsRunning(false);
      setError({ name: 'StreamError', message: 'No response stream from server' });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const line = part.replace(/^data: /, '').trim();
        if (!line) continue;
        const msg = JSON.parse(line);

        if (msg.type === 'event') {
          setEvents((prev) => [...prev, msg]);
          const role = msg.payload?.role;
          if (role && /Assigned|Started/.test(msg.event)) activeRoles.current.add(role);
          if (role && /Completed/.test(msg.event)) activeRoles.current.delete(role);
        } else if (msg.type === 'complete') {
          setResult(msg.result);
        } else if (msg.type === 'error') {
          setError(msg);
        }
      }
    }

    setIsRunning(false);
  }

  return { events, isRunning, result, error, run, activeRoles: activeRoles.current };
}
