import { NextRequest, NextResponse } from 'next/server';
import { isEmailAuthorizedAdmin } from '@/lib/admin-auth';
import {
  findCustomerByCredentials,
  getFullArtworksWithSignedUrls,
  getManuals,
  insertAuditLog,
  isValidCleanEmail,
  isValidLicenseCodeFormat,
} from '@/lib/data-store';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';
import { resolveServerAccess } from '@/lib/vip-auth';
import {
  signVipSessionToken,
  VIP_COOKIE_NAME,
  VIP_SESSION_MAX_AGE_SECONDS,
} from '@/lib/vip-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const access = await resolveServerAccess(req);
    if (!access.hasFullAccess || !access.customer) {
      return NextResponse.json(
        {
          authenticated: false,
          hasFullAccess: false,
          isAdmin: false,
          googleUser: access.googleUser,
          oauthEmailWithoutLicense: access.googleUser?.email || null,
        },
        { status: 200 }
      );
    }

    const { customer, via, isAdmin, hasCustomerRow, googleUser } = access;
    const isSummaryOnly = req.nextUrl.searchParams.get('summary') === '1';

    if (isSummaryOnly) {
      const summaryResponse = NextResponse.json({
        authenticated: true,
        hasFullAccess: true,
        isAdmin,
        googleUser,
        customer: {
          email: customer.email,
          license_code: customer.license_code,
          created_at: customer.created_at,
        },
      });

      if (via === 'google_oauth' || via === 'admin') {
        const token = signVipSessionToken({
          email: customer.email,
          licenseCode: customer.license_code,
          issuedAt: new Date().toISOString(),
        });
        summaryResponse.cookies.set(VIP_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: VIP_SESSION_MAX_AGE_SECONDS,
        });
      }

      return summaryResponse;
    }

    if (via === 'google_oauth' || via === 'admin') {
      const forensic = extractClientForensicInfo(req);
      await insertAuditLog({
        customerId: hasCustomerRow ? customer.id : null,
        paypalOrderId: hasCustomerRow ? customer.paypal_order_id : null,
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'VIP_LOGIN',
        metadata: {
          license_code: customer.license_code,
          email: customer.email,
          access_type: via === 'admin' ? 'GOOGLE_OAUTH_ADMIN' : 'GOOGLE_OAUTH_VIP',
          vercel_country: forensic.vercelCountry,
        },
      }).catch(() => {});
    }

    const [artworks, manuals] = await Promise.all([
      getFullArtworksWithSignedUrls(),
      getManuals(true),
    ]);

    const response = NextResponse.json({
      authenticated: true,
      hasFullAccess: true,
      isAdmin,
      googleUser,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
        created_at: customer.created_at,
      },
      artworks,
      manuals,
    });

    if (via === 'google_oauth' || via === 'admin') {
      const token = signVipSessionToken({
        email: customer.email,
        licenseCode: customer.license_code,
        issuedAt: new Date().toISOString(),
      });
      response.cookies.set(VIP_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: VIP_SESSION_MAX_AGE_SECONDS,
      });
    }

    return response;
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
    const forensic = extractClientForensicInfo(req);
    const rate = checkRateLimit(`vip-verify:${forensic.ipAddress}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Demasiados intentos de verificación. Espera ${rate.retryAfterSeconds} segundos antes de reintentar.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Datos de acceso inválidos.' },
        { status: 400 }
      );
    }

    const { email, licenseCode } = body as {
      email?: string;
      licenseCode?: string;
    };

    if (!email || !licenseCode) {
      return NextResponse.json(
        { error: 'Datos de acceso incompletos.' },
        { status: 400 }
      );
    }

    if (!isValidCleanEmail(email) || !isValidLicenseCodeFormat(licenseCode)) {
      return NextResponse.json(
        {
          error: 'Formato de credenciales inválido.',
        },
        { status: 400 }
      );
    }

    const customer = await findCustomerByCredentials(email, licenseCode);
    if (!customer) {
      return NextResponse.json(
        {
          error:
            'No encontramos un Pase de Acceso Total activo con esos datos. Inicia sesión directamente con tu cuenta de Google o escríbenos en la sección de Contacto.',
        },
        { status: 401 }
      );
    }

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

    const [artworks, manuals, isAdmin] = await Promise.all([
      getFullArtworksWithSignedUrls(),
      getManuals(true),
      isEmailAuthorizedAdmin(customer.email),
    ]);

    const token = signVipSessionToken({
      email: customer.email,
      licenseCode: customer.license_code,
      issuedAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      authenticated: true,
      hasFullAccess: true,
      isAdmin,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
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
      maxAge: VIP_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Error POST /api/vip/verify:', error);
    return NextResponse.json(
      { error: 'Error validando acceso.' },
      { status: 500 }
    );
  }
}
