import { NextRequest, NextResponse } from 'next/server';
import {
  findCustomerByCredentials,
  getFullArtworksWithSignedUrls,
  getManuals,
  insertAuditLog,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { resolveVipCustomer } from '@/lib/vip-auth';
import { signVipSessionToken, VIP_COOKIE_NAME } from '@/lib/vip-session';

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveVipCustomer(req);
    if (!resolved) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { customer, via } = resolved;
    const forensic = extractClientForensicInfo(req);

    await insertAuditLog({
      customerId: customer.id,
      paypalOrderId: customer.paypal_order_id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'VIP_ACCESS_GRANTED',
      metadata: {
        license_code: customer.license_code,
        email: customer.email,
        access_type: via === 'google_oauth' ? 'GOOGLE_OAUTH_VIP' : 'SESSION_RESTORE',
      },
    });

    const [artworks, manuals] = await Promise.all([
      getFullArtworksWithSignedUrls(),
      getManuals(true),
    ]);

    return NextResponse.json({
      authenticated: true,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
        paypal_order_id: customer.paypal_order_id,
        created_at: customer.created_at,
      },
      artworks,
      manuals,
    });
  } catch (error) {
    console.error('Error GET /api/vip/verify:', error);
    return NextResponse.json(
      { error: 'Error verificando sesión VIP.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Datos de acceso inválidos.' },
        { status: 400 }
      );
    }

    const { email, licenseCode } = body as { email?: string; licenseCode?: string };
    if (!email || !licenseCode) {
      return NextResponse.json(
        { error: 'Ingresa tu correo y código de licencia (ej. AD-XXXX-XXXX).' },
        { status: 400 }
      );
    }

    const customer = await findCustomerByCredentials(email, licenseCode);
    if (!customer) {
      return NextResponse.json(
        {
          error:
            'No encontramos una licencia activa que coincida con ese correo y código. Verifica tus datos o escríbenos a soporte@artedigital.click.',
        },
        { status: 401 }
      );
    }

    const forensic = extractClientForensicInfo(req);
    await insertAuditLog({
      customerId: customer.id,
      paypalOrderId: customer.paypal_order_id,
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'VIP_LOGIN',
      metadata: {
        email: customer.email,
        license_code: customer.license_code,
        vercel_country: forensic.vercelCountry,
      },
    });

    const [artworks, manuals] = await Promise.all([
      getFullArtworksWithSignedUrls(),
      getManuals(true),
    ]);

    const token = signVipSessionToken({
      email: customer.email,
      licenseCode: customer.license_code,
      issuedAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      authenticated: true,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
        paypal_order_id: customer.paypal_order_id,
        created_at: customer.created_at,
      },
      artworks,
      manuals,
    });

    response.cookies.set(VIP_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error('Error POST /api/vip/verify:', error);
    return NextResponse.json({ error: 'Error validando licencia.' }, { status: 500 });
  }
}
