import { NextRequest, NextResponse } from 'next/server';
import { insertAuditLog, verifyVipResourceExists } from '@/lib/data-store';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';
import { resolveVipCustomer } from '@/lib/vip-auth';

export async function POST(req: NextRequest) {
  try {
    const resolved = await resolveVipCustomer(req);
    if (!resolved) {
      return NextResponse.json({ error: 'Sesión VIP no autorizada.' }, { status: 401 });
    }

    const forensic = extractClientForensicInfo(req);
    const rate = checkRateLimit(`vip-log:${forensic.ipAddress}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Límite de eventos alcanzado.' }, { status: 429 });
    }

    const { customer, hasCustomerRow } = resolved;
    const body = await req.json().catch(() => ({}));
    const { resourceId, resourceType } = body as {
      resourceId?: string;
      resourceType?: string;
    };

    if (!resourceId || typeof resourceId !== 'string') {
      return NextResponse.json({ error: 'resourceId válido requerido.' }, { status: 400 });
    }

    const allowedType =
      resourceType === 'manual_pdf'
        ? 'manual_pdf'
        : resourceType === 'high_res_artwork'
        ? 'high_res_artwork'
        : 'prompt_copy';

    const verification = await verifyVipResourceExists(resourceId, allowedType);
    if (!verification.exists) {
      return NextResponse.json(
        { error: 'El recurso solicitado no existe en el catálogo.' },
        { status: 404 }
      );
    }

    const log = await insertAuditLog({
      customerId: hasCustomerRow ? customer.id : null,
      paypalOrderId: hasCustomerRow ? customer.paypal_order_id : null,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ASSET_DOWNLOADED',
      metadata: {
        license_code: customer.license_code,
        email: customer.email,
        resource_id: resourceId.trim(),
        resource_type: allowedType,
        resource_title: verification.title,
        downloaded_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ logged: true, logId: log.id });
  } catch (error) {
    console.error('Error en /api/vip/log-download:', error);
    return NextResponse.json({ error: 'Error registrando evento.' }, { status: 500 });
  }
}
