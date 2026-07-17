export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { activateDepartment } = require('../../../lib/engineering-bridge');

export async function POST(request) {
  const { artifactId } = await request.json();
  if (!artifactId) {
    return Response.json({ error: 'artifactId is required' }, { status: 400 });
  }

  try {
    const result = await activateDepartment(artifactId);
    return Response.json({ result });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}
