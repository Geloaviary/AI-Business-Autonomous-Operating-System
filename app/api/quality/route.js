export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { getCertificationHistory } = require('../../../lib/engineering-bridge');

export async function GET() {
  const certifications = await getCertificationHistory();
  const total = certifications.length;
  const passed = certifications.filter((c) => c.verdict === 'PASS').length;
  return Response.json({
    certifications,
    metrics: {
      total,
      passed,
      failed: total - passed,
      approvalRate: total > 0 ? passed / total : null
    }
  });
}
