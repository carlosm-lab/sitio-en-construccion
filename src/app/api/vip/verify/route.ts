import { NextRequest, NextResponse } from 'next/server';
import {
  findCustomerByCredentials,
  getFullArtworksWithSignedUrls,
  getManuals,
  insertAuditLog,
  isValidCleanEmail,
  isValidLicenseCodeFormat,
} from '@/lib/data-store';
import { checkRateLimit, extractClientForensicInfo } from '@/lib/request-info';
import { createSupabaseServerClient } from '@/lib/supabase';
import { resolveVipCustomer } from '@/lib/vip-auth';
import {
  signVipSessionToken,
  VIP_COOKIE_NAME,
  VIP_SESSION_MAX_AGE_SECONDS,
} from '@/lib/vip-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveVipCustomer(req);
    if (!resolved) {
      let oauthEmailWithoutLicense: string | null = null;
      try {
        const supabaseSsr = createSupabaseServerClient();
        const {
          data: { user },
        } = await supabaseSsr.auth.getUser();
        if (user?.email) {
          oauthEmailWithoutLicense = user.email;
        }
      } catch {
        // Sin sesión OAuth
      }

      return NextResponse.json(
        {
          authenticated: false,
          oauthEmailWithoutLicense,
        },
        { status: 401 }
      );
    }

    const { customer, via } = resolved;
    const isSummaryOnly = req.nextUrl.searchParams.get('summary') === '1';

    if (isSummaryOnly) {
      const summaryResponse = NextResponse.json({
        authenticated: true,
        customer: {
          email: customer.email,
          license_code: customer.license_code,
          created_at: customer.created_at,
        },
      });

      if (via === 'google_oauth') {
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

    if (via === 'google_oauth') {
      const forensic = extractClientForensicInfo(req);
      await insertAuditLog({
        customerId: customer.id,
        paypalOrderId: customer.paypal_order_id,
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'VIP_LOGIN',
        metadata: {
          license_code: customer.license_code,
          email: customer.email,
          access_type: 'GOOGLE_OAUTH_VIP',
          vercel_country: forensic.vercelCountry,
        },
      });
    }

    const [artworks, manuals] = await Promise.all([
      getFullArtworksWithSignedUrls(),
      getManuals(true),
    ]);

    const response = NextResponse.json({
      authenticated: true,
      customer: {
        email: customer.email,
        license_code: customer.license_code,
        created_at: customer.created_at,
      },
      artworks,
      manuals,
    });

    if (via === 'google_oauth') {
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
        { error: 'Ingresa tu correo y código de licencia (formato AD-XXXX-XXXX).' },
        { status: 400 }
      );
    }

    if (!isValidCleanEmail(email) || !isValidLicenseCodeFormat(licenseCode)) {
      return NextResponse.json(
        {
          error:
            'Formato de correo o código de licencia inválido. Usa el formato AD-XXXX-XXXX.',
        },
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
      { error: 'Error validando licencia.' },
      { status: 500 }
    );
  }
}
