/**
 * app/api/status/route.js
 * ---------------------------------------------------------------------------
 * Read-only snapshot endpoint: AI workforce roster, current health
 * diagnostics, KPI metrics, and recent execution history. Polled by the
 * dashboard sidebar so the "company" feels alive even between submissions.
 * ---------------------------------------------------------------------------
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const {
  getWorkforceRoster, getHealthSnapshot, getMetricsSnapshot, getRecentHistory
} = require('../../../lib/engineering-bridge');

export async function GET() {
  const [workforce, health, metrics, history] = await Promise.all([
    getWorkforceRoster(),
    getHealthSnapshot(),
    getMetricsSnapshot(),
    getRecentHistory(15)
  ]);

  return Response.json({ workforce, health, metrics, history });
}
