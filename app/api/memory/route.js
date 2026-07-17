export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { getCertifiedKnowledge } = require('../../../lib/engineering-bridge');

export async function GET() {
  const knowledge = await getCertifiedKnowledge();
  return Response.json({ knowledge });
}
