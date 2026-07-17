/**
 * app/api/prompt-creator/route.js
 * ---------------------------------------------------------------------------
 * The Prompt Creator button. An executive rarely arrives with a
 * perfectly-formed business objective — this turns a rough idea ("we're
 * losing track of supplier invoices") into a clear businessObjective and a
 * short list of capabilities, in the shape the Engineering Department's
 * Contract expects. This is a dashboard convenience feature, distinct from
 * Engineering's own internal knowledge strategy (which consults Platform
 * Memory, then OpenAI, per the platform constitution) — this one step is
 * explicitly Claude-assisted, by design.
 * ---------------------------------------------------------------------------
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You help a startup founder turn a rough idea into a clear business objective and a short list of capabilities for a new department, to be handed to an autonomous AI engineering organization that will build it.

Rules:
- The businessObjective must read like "Create a <Name> Department to <purpose>." — describe PURPOSE, never implementation, architecture, or technology.
- capabilities: 3 to 6 short, business-facing phrases (e.g. "Supplier sourcing", "Purchase order tracking"). No technical jargon, no code, no file names.
- suggestedName: a short department name, Title Case, 1-3 words (e.g. "Procurement", "Affiliate Marketing").
- Respond with ONLY a JSON object, no prose, no markdown fences: {"suggestedName": string, "businessObjective": string, "capabilities": string[]}`;

export async function POST(request) {
  const { roughIdea } = await request.json();

  if (!roughIdea || !roughIdea.trim()) {
    return Response.json({ error: 'roughIdea is required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured on this deployment. Add it in your Vercel project\'s Environment Variables.' },
      { status: 501 }
    );
  }

  try {
    // eslint-disable-next-line global-require
    const Anthropic = require('@anthropic-ai/sdk').default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: roughIdea.trim() }]
    });

    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json({ error: 'Claude returned a response that could not be parsed as JSON.', raw: text }, { status: 502 });
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message || 'Prompt Creator request failed.' }, { status: 500 });
  }
}
