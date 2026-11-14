import { createSupabaseServerClient, getSupabaseAdmin } from './supabase';

export interface VerifiedAdmin {
  userId: string;
  email: string;
}

/**
 * Verifica si un correo electrónico está autorizado como administrador
 * en la variable de entorno ADMIN_ALLOWED_EMAILS o en la tabla public.admin_users.
 */
export async function isEmailAuthorizedAdmin(rawEmail: string | undefined | null): Promise<boolean> {
  if (!rawEmail || typeof rawEmail !== 'string') return false;
  const email = rawEmail.trim().toLowerCase();
  if (!email) return false;

  const envAllowed = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (envAllowed.includes(email)) {
    return true;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    return Boolean(adminRow);
  } catch {
    return false;
  }
}

/**
 * Verifica criptográficamente en el servidor que el solicitante tiene una sesión
 * Google OAuth válida Y que su correo está autorizado como administrador.
 */
export async function requireAdminUser(): Promise<
  | { ok: true; admin: VerifiedAdmin }
  | { ok: false; status: 401 | 403; error: string; email?: string }
> {
  try {
    const supabaseSsr = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabaseSsr.auth.getUser();

    if (error || !user || !user.email) {
      return {
        ok: false,
        status: 401,
        error: 'Sesión no iniciada. Inicia sesión con una cuenta de Google autorizada.',
      };
    }

    const email = user.email.trim().toLowerCase();
    const authorized = await isEmailAuthorizedAdmin(email);

    if (!authorized) {
      return {
        ok: false,
        status: 403,
        email,
        error: 'La cuenta de Google conectada no cuenta con permisos de administración.',
      };
    }

    return {
      ok: true,
      admin: {
        userId: user.id,
        email,
      },
    };
  } catch (err) {
    console.error('Error verificando sesión admin:', err);
    return {
      ok: false,
      status: 401,
      error: 'No fue posible validar la sesión.',
    };
  }
}
