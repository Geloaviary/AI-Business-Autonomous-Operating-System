/**
 * app/api/submit-request/route.js
 * ---------------------------------------------------------------------------
 * Accepts a business request from the Executive Dashboard and streams the
 * real, live lifecycle of the Engineering Department back to the browser
 * over Server-Sent Events — Requirement Analysis, Architecture Planning,
 * AI Workforce execution, Validation, QAD certification, Platform Memory
 * commit, Activation, and Marketplace packaging, in the order they actually
 * happen. Nothing here is simulated for display purposes; these are the
 * same events.js records the backend emits during a real run.
 * ---------------------------------------------------------------------------
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { submitRequestWithProgress } = require('../../../lib/engineering-bridge');

export async function POST(request) {
  const body = await request.json();

  const encoder = new TextEncoder();
  let controllerRef;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    }
  });

  function send(type, data) {
    const payload = `data: ${JSON.stringify({ type, ...data })}\n\n`;
    controllerRef.enqueue(encoder.encode(payload));
  }

  (async () => {
    try {
      const result = await submitRequestWithProgress(
        {
          businessObjective: body.businessObjective,
          requestedBy: body.requestedBy || 'Executive',
          capabilities: body.capabilities || [],
          targetDepartmentName: body.targetDepartmentName || undefined
        },
        (record) => send('event', record)
      );
      send('complete', { result });
    } catch (err) {
      send('error', { message: err.message, name: err.name, details: err.details || null });
    } finally {
      controllerRef.close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
