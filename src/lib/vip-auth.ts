import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { isEmailAuthorizedAdmin } from './admin-auth';
import { MEMBERSHIP_PRICE_USD } from './constants';
import {
  findActiveCustomerByEmail,
  findCustomerByCredentials,
} from './data-store';
import { createSupabaseServerClient } from './supabase';
import {
  getVipSessionFromRequest,
  verifyVipSessionToken,
  VIP_COOKIE_NAME,
} from './vip-session';
import { CustomerRecord } from '@/types';

export interface GoogleUserSummary {
  email: string;
  name: string | null;
}

export interface ServerAccessResult {
  hasFullAccess: boolean;
  isAdmin: boolean;
  via: 'cookie' | 'google_oauth' | 'admin' | null;
  customer: CustomerRecord | null;
  hasCustomerRow: boolean;
  googleUser: GoogleUserSummary | null;
}

function buildAdminVirtualCustomer(email: string, userId?: string): CustomerRecord {
  return {
    id: userId || '00000000-0000-0000-0000-000000000000',
    email: email.trim().toLowerCase(),
    license_code: 'ADMIN-MASTER',
    paypal_order_id: 'ADMIN-AUTH',
    paypal_payer_id: null,
    amount_usd: parseFloat(MEMBERSHIP_PRICE_USD),
    terms_version: 'v1.0',
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

/**
 * Resuelve de forma unificada el estado de acceso total (VIP o Administrador)
 * tanto en Server Components como en Route Handlers.
 * Reconoce:
 * 1) Sesión Google OAuth de Administrador (public.admin_users o ADMIN_ALLOWED_EMAILS)
 * 2) Sesión Google OAuth de Cliente con compra activa en public.customers
 * 3) Cookie firmada artedigital_vip_session emitida tras compra PayPal o login OAuth
 */
export async function resolveServerAccess(
  req?: NextRequest
): Promise<ServerAccessResult> {
  let googleUser: GoogleUserSummary | null = null;
  let oauthUserId: string | undefined;

  try {
    const supabaseSsr = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseSsr.auth.getUser();

    if (user?.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      oauthUserId = user.id;
      const metaName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null;
      googleUser = {
        email: cleanEmail,
        name: metaName,
      };

      const [isAdmin, existingCustomer] = await Promise.all([
        isEmailAuthorizedAdmin(cleanEmail),
        findActiveCustomerByEmail(cleanEmail).catch(() => null),
      ]);

      if (isAdmin) {
        return {
          hasFullAccess: true,
          isAdmin: true,
          via: 'admin',
          customer:
            existingCustomer || buildAdminVirtualCustomer(cleanEmail, oauthUserId),
          hasCustomerRow: Boolean(existingCustomer),
          googleUser,
        };
      }

      if (existingCustomer) {
        return {
          hasFullAccess: true,
          isAdmin: false,
          via: 'google_oauth',
          customer: existingCustomer,
          hasCustomerRow: true,
          googleUser,
        };
      }
    }
  } catch {
    // Sin sesión Google OAuth activa
  }

  // Verificar cookie firmada artedigital_vip_session
  try {
    const session = req
      ? getVipSessionFromRequest(req)
      : verifyVipSessionToken(cookies().get(VIP_COOKIE_NAME)?.value);

    if (session) {
      const cleanCookieEmail = session.email.trim().toLowerCase();
      if (session.licenseCode === 'ADMIN-MASTER') {
        const isAdmin = await isEmailAuthorizedAdmin(cleanCookieEmail);
        if (isAdmin) {
          const existingCustomer = await findActiveCustomerByEmail(
            cleanCookieEmail
          ).catch(() => null);
          return {
            hasFullAccess: true,
            isAdmin: true,
            via: 'admin',
            customer:
              existingCustomer || buildAdminVirtualCustomer(cleanCookieEmail),
            hasCustomerRow: Boolean(existingCustomer),
            googleUser: googleUser || { email: cleanCookieEmail, name: null },
          };
        }
      }

      const customer = await findCustomerByCredentials(
        session.email,
        session.licenseCode
      );
      if (customer) {
        const isAdmin = await isEmailAuthorizedAdmin(customer.email);
        return {
          hasFullAccess: true,
          isAdmin,
          via: 'cookie',
          customer,
          hasCustomerRow: true,
          googleUser: googleUser || { email: customer.email, name: null },
        };
      }
    }
  } catch {
    // Cookie ausente o inválida
  }

  return {
    hasFullAccess: false,
    isAdmin: false,
    via: null,
    customer: null,
    hasCustomerRow: false,
    googleUser,
  };
}

/**
 * Resuelve el cliente VIP o Administrador activo para endpoints de API (/api/vip/*).
 */
export async function resolveVipCustomer(
  req: NextRequest
): Promise<{
  customer: CustomerRecord;
  via: 'cookie' | 'google_oauth' | 'admin';
  isAdmin: boolean;
  hasCustomerRow: boolean;
  googleUser: GoogleUserSummary | null;
} | null> {
  const access = await resolveServerAccess(req);
  if (!access.hasFullAccess || !access.customer || !access.via) {
    return null;
  }

  return {
    customer: access.customer,
    via: access.via,
    isAdmin: access.isAdmin,
    hasCustomerRow: access.hasCustomerRow,
    googleUser: access.googleUser,
  };
}
