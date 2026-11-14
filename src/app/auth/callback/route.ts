import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { isEmailAuthorizedAdmin } from '@/lib/admin-auth';
import { findActiveCustomerByEmail } from '@/lib/data-store';
import {
  signVipSessionToken,
  VIP_COOKIE_NAME,
  VIP_SESSION_MAX_AGE_SECONDS,
} from '@/lib/vip-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');

  let cookieNext = '';
  const rawCookieNext = req.cookies.get('artedigital_oauth_next')?.value;
  if (rawCookieNext) {
    try {
      cookieNext = decodeURIComponent(rawCookieNext);
    } catch {
      cookieNext = rawCookieNext;
    }
  }

  const nextParam = searchParams.get('next') || cookieNext || '/';
  const safeNext =
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.includes('\\')
      ? nextParam
      : '/';

  if (code) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anonKey) {
        throw new Error('Variables de Supabase no configuradas.');
      }

      const cookieStore = cookies();
      const pendingCookies: Array<{
        name: string;
        value: string;
        options?: Record<string, unknown>;
      }> = [];

      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options });
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Aplicado directamente sobre NextResponse abajo
              }
            });
          },
        },
      });

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const redirectResponse = NextResponse.redirect(new URL(safeNext, origin));
        redirectResponse.cookies.set('artedigital_oauth_next', '', {
          path: '/',
          maxAge: 0,
        });

        for (const c of pendingCookies) {
          redirectResponse.cookies.set(c.name, c.value, c.options as never);
        }

        const userEmail = data.user.email?.trim().toLowerCase();
        if (userEmail) {
          const [isAdmin, activeCustomer] = await Promise.all([
            isEmailAuthorizedAdmin(userEmail),
            findActiveCustomerByEmail(userEmail).catch(() => null),
          ]);

          if (isAdmin || activeCustomer) {
            const licenseCode = activeCustomer
              ? activeCustomer.license_code
              : 'ADMIN-MASTER';
            const token = signVipSessionToken({
              email: userEmail,
              licenseCode,
              issuedAt: new Date().toISOString(),
            });
            redirectResponse.cookies.set(VIP_COOKIE_NAME, token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: VIP_SESSION_MAX_AGE_SECONDS,
            });
          }
        }

        return redirectResponse;
      }

      console.error('Error intercambiando código OAuth:', error?.message);
    } catch (err) {
      console.error('Excepción en /auth/callback:', err);
    }
  }

  const errorUrl = new URL(safeNext, origin);
  errorUrl.searchParams.set('auth_error', 'oauth_failed');
  const errorRedirect = NextResponse.redirect(errorUrl);
  errorRedirect.cookies.set('artedigital_oauth_next', '', {
    path: '/',
    maxAge: 0,
  });
  return errorRedirect;
}
