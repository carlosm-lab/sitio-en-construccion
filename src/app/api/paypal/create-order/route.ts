import { NextRequest, NextResponse } from 'next/server';
import { insertAuditLog, isValidCleanEmail } from '@/lib/data-store';
import { createPayPalOrder } from '@/lib/paypal';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';
import { TERMS_VERSION } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const forensic = extractClientForensicInfo(req);
    const rate = checkRateLimit(`paypal-create:${forensic.ipAddress}`, 12, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Demasiadas solicitudes. Por favor espera ${rate.retryAfterSeconds} segundos.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Payload JSON inválido.' },
        { status: 400 }
      );
    }

    const { email, termsAccepted, termsVersion } = body as {
      email?: string;
      termsAccepted?: boolean;
      termsVersion?: string;
    };

    if (termsAccepted !== true || termsVersion !== TERMS_VERSION) {
      return NextResponse.json(
        {
          error:
            'Debes aceptar explícitamente los Términos de Servicio y Política de Reembolsos (v1.0) antes de continuar.',
          code: 'TERMS_NOT_ACCEPTED',
        },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !isValidCleanEmail(email)) {
      return NextResponse.json(
        {
          error:
            'Introduce una dirección de correo electrónico válida para emitir tu licencia.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const termsAcceptedAt = new Date().toISOString();

    const order = await createPayPalOrder(normalizedEmail);

    await insertAuditLog({
      paypalOrderId: order.id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'TERMS_ACCEPTED',
      metadata: {
        email: normalizedEmail,
        terms_version: termsVersion,
        terms_accepted: true,
        terms_accepted_at: termsAcceptedAt,
        paypal_env: order.env,
        vercel_country: forensic.vercelCountry,
        vercel_region: forensic.vercelRegion,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      termsAcceptedAt,
    });
  } catch (error) {
    console.error('Error en /api/paypal/create-order:', error);
    return NextResponse.json(
      { error: 'No fue posible crear la orden en PayPal en este momento.' },
      { status: 500 }
    );
  }
}
