import { NextRequest, NextResponse } from 'next/server';
import {
  insertAuditLog,
  isValidCleanEmail,
  upsertCustomerAfterPayment,
} from '@/lib/data-store';
import { capturePayPalOrder } from '@/lib/paypal';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';
import { MEMBERSHIP_PRICE_USD, TERMS_VERSION } from '@/lib/constants';
import {
  signVipSessionToken,
  VIP_COOKIE_NAME,
  VIP_SESSION_MAX_AGE_SECONDS,
} from '@/lib/vip-session';

export async function POST(req: NextRequest) {
  try {
    const forensic = extractClientForensicInfo(req);
    const rate = checkRateLimit(`paypal-capture:${forensic.ipAddress}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de confirmación. Espera unos segundos.' },
        { status: 429 }
      );
    }

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

    if (!orderId || typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{5,64}$/.test(orderId)) {
      return NextResponse.json({ error: 'orderId de PayPal inválido.' }, { status: 400 });
    }

    if (termsAccepted !== true || termsVersion !== TERMS_VERSION) {
      return NextResponse.json(
        { error: 'Validación legal incompleta. No se puede procesar la entrega digital.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !isValidCleanEmail(email)) {
      return NextResponse.json(
        { error: 'Formato de correo electrónico inválido.' },
        { status: 400 }
      );
    }

    const capture = await capturePayPalOrder(orderId);

    if (
      capture.status !== 'COMPLETED' ||
      capture.captureStatus !== 'COMPLETED' ||
      capture.captureAmount !== MEMBERSHIP_PRICE_USD ||
      capture.captureCurrency !== 'USD'
    ) {
      return NextResponse.json(
        {
          error: 'El pago en PayPal no pudo verificarse como completado por $20.00 USD.',
        },
        { status: 402 }
      );
    }

    const requestedEmail = email.trim().toLowerCase();
    const customIdEmail = capture.customId ? capture.customId.trim().toLowerCase() : '';
    const payerEmail = capture.payerEmail ? capture.payerEmail.trim().toLowerCase() : '';

    if (!customIdEmail || requestedEmail !== customIdEmail) {
      return NextResponse.json(
        {
          error:
            'El correo proporcionado no coincide con el titular registrado al crear la orden.',
        },
        { status: 400 }
      );
    }

    const customerEmail = customIdEmail;

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
        payer_email: payerEmail || customer.email,
        payer_id: capture.payerId,
        capture_id: capture.captureId,
        amount_usd: capture.captureAmount,
        currency: capture.captureCurrency,
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
        created_at: customer.created_at,
      },
    });

    response.cookies.set(VIP_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: VIP_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error en /api/paypal/capture-order:', error);
    return NextResponse.json(
      { error: 'Error procesando la confirmación de pago con PayPal.' },
      { status: 500 }
    );
  }
}
