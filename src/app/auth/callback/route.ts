import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/vip';
  const safeNext =
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.includes('\\')
      ? nextParam
      : '/vip';

  if (code) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(safeNext, origin));
      }
      console.error('Error intercambiando código OAuth:', error.message);
    } catch (err) {
      console.error('Excepción en /auth/callback:', err);
    }
  }

  const errorUrl = new URL(safeNext, origin);
  errorUrl.searchParams.set('auth_error', 'oauth_failed');
  return NextResponse.redirect(errorUrl);
}
