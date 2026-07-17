export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { getMarketplacePackages } = require('../../../lib/engineering-bridge');

export async function GET() {
  const packages = await getMarketplacePackages();
  return Response.json({ packages });
}
