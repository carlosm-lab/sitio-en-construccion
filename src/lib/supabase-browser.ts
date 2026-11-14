import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente de navegador para iniciar sesión con Google OAuth sin importar APIs de servidor (`next/headers`).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Faltan variables públicas de Supabase en el navegador.');
  }
  return createBrowserClient(url, anonKey);
}
