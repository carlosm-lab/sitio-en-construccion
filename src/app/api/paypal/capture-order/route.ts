import { NextRequest, NextResponse } from 'next/server';
import { insertAuditLog, upsertCustomerAfterPayment } from '@/lib/data-store';
import { capturePayPalOrder } from '@/lib/paypal';
import { extractClientForensicInfo } from '@/lib/request-info';
import { TERMS_VERSION } from '@/lib/constants';
import { signVipSessionToken, VIP_COOKIE_NAME } from '@/lib/vip-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const { orderId, email, termsAccepted, termsVersion, termsAcceptedAt } = body as {
      orderId?: string;
      email?: string;
      termsAccepted?: boolean;
      termsVersion?: string;
      termsAcceptedAt?: string;
    };

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId de PayPal requerido.' }, { status: 400 });
    }

    if (termsAccepted !== true || termsVersion !== TERMS_VERSION) {
      return NextResponse.json(
        { error: 'Validación legal incompleta. No se puede procesar la entrega digital.' },
        { status: 400 }
      );
    }

    const forensic = extractClientForensicInfo(req);
    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          error: `El pago aún no figura como COMPLETED en PayPal (estado actual: ${capture.status}).`,
        },
        { status: 402 }
      );
    }

    const customerEmail = (email || capture.payerEmail || '').trim().toLowerCase();
    if (!customerEmail) {
      return NextResponse.json(
        { error: 'No se pudo determinar el correo electrónico del comprador.' },
        { status: 400 }
      );
    }

    const customer = await upsertCustomerAfterPayment({
      email: customerEmail,
      paypalOrderId: capture.orderId,
      paypalPayerId: capture.payerId,
      termsVersion: TERMS_VERSION,
    });

    const verifiedTimestamp = new Date().toISOString();

    await insertAuditLog({
      customerId: customer.id,
      paypalOrderId: customer.paypal_order_id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'PAYMENT_CAPTURED',
      metadata: {
        payer_email: capture.payerEmail || customer.email,
        payer_id: capture.payerId,
        capture_id: capture.captureId,
        amount_usd: '20.00',
        currency: 'USD',
        category: 'DIGITAL_GOODS',
        terms_accepted_at: termsAcceptedAt || verifiedTimestamp,
        terms_version: TERMS_VERSION,
        license_code: customer.license_code,
        vercel_country: forensic.vercelCountry,
      },
    });

    await insertAuditLog({
      customerId: customer.id,
      paypalOrderId: customer.paypal_order_id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'VIP_ACCESS_GRANTED',
      metadata: {
        email: customer.email,
        license_code: customer.license_code,
        granted_at: verifiedTimestamp,
      },
    });

    const sessionToken = signVipSessionToken({
      email: customer.email,
      licenseCode: customer.license_code,
      issuedAt: verifiedTimestamp,
    });

    const response = NextResponse.json({
      success: true,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
        paypal_order_id: customer.paypal_order_id,
        created_at: customer.created_at,
      },
    });

    response.cookies.set(VIP_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error('Error en /api/paypal/capture-order:', error);
    const message =
      error instanceof Error ? error.message : 'Error capturando el pago en PayPal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
