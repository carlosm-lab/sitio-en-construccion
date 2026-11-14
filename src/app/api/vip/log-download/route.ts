import { NextRequest, NextResponse } from 'next/server';
import { insertAuditLog } from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { resolveVipCustomer } from '@/lib/vip-auth';

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveVipCustomer(req);
    if (!resolved) {
      return NextResponse.json({ error: 'Sesión VIP no autorizada.' }, { status: 401 });
    }

    const { customer } = resolved;
    const body = await req.json().catch(() => ({}));
    const { resourceId, resourceType, resourceTitle } = body as {
      resourceId?: string;
      resourceType?: string;
      resourceTitle?: string;
    };

    const forensic = extractClientForensicInfo(req);
    const log = await insertAuditLog({
      customerId: customer.id,
      paypalOrderId: customer.paypal_order_id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ASSET_DOWNLOADED',
      metadata: {
        license_code: customer.license_code,
        email: customer.email,
        resource_id: resourceId || 'unknown',
        resource_type: resourceType || 'prompt_copy',
        resource_title: resourceTitle || 'Recurso VIP',
        downloaded_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ logged: true, logId: log.id });
  } catch (error) {
    console.error('Error en /api/vip/log-download:', error);
    return NextResponse.json({ error: 'Error registrando descarga.' }, { status: 500 });
  }
}
