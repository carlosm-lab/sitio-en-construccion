import { NextRequest } from 'next/server';
import {
  findActiveCustomerByEmail,
  findCustomerByCredentials,
} from './data-store';
import { createSupabaseServerClient } from './supabase';
import { getVipSessionFromRequest } from './vip-session';
import { CustomerRecord } from '@/types';

/**
 * Resuelve el cliente VIP activo desde:
 * 1) Cookie firmada `artedigital_vip_session` (emitida tras pago PayPal o código AD-XXXX-XXXX)
 * 2) Sesión Google OAuth en Supabase cuyo email posea una licencia activa en `public.customers`.
 */
export async function resolveVipCustomer(
  req: NextRequest
): Promise<{ customer: CustomerRecord; via: 'cookie' | 'google_oauth' } | null> {
  const session = getVipSessionFromRequest(req);
  if (session) {
    const customer = await findCustomerByCredentials(
      session.email,
      session.licenseCode
    );
    if (customer) {
      return { customer, via: 'cookie' };
    }
  }

  try {
    const supabaseSsr = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseSsr.auth.getUser();

    if (user?.email) {
      const customer = await findActiveCustomerByEmail(user.email);
      if (customer) {
        return { customer, via: 'google_oauth' };
      }
    }
  } catch {
    // Sin sesión Google activa
  }

  return null;
}
