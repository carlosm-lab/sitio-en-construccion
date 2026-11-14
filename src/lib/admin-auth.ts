import { createSupabaseServerClient, getSupabaseAdmin } from './supabase';

export interface VerifiedAdmin {
  userId: string;
  email: string;
}

/**
 * Verifica criptográficamente en el servidor que el solicitante tiene una sesión
 * Google OAuth válida Y que su correo está autorizado como administrador.
 * Si el usuario inició sesión con una cuenta no autorizada, cierra su sesión automáticamente.
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
        error: 'Sesión no iniciada. Inicia sesión con una cuenta autorizada.',
      };
    }

    const email = user.email.trim().toLowerCase();
    const supabaseAdmin = getSupabaseAdmin();

    const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle();

    const envAllowed = (process.env.ADMIN_ALLOWED_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!adminRow && !envAllowed.includes(email)) {
      await supabaseSsr.auth.signOut().catch(() => {});
      return {
        ok: false,
        status: 403,
        email,
        error: 'La cuenta seleccionada no cuenta con permisos de administración.',
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
