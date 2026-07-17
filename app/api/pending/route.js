export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { getPendingActivations } = require('../../../lib/engineering-bridge');

export async function GET() {
  const pending = await getPendingActivations();
  return Response.json({ pending });
}
