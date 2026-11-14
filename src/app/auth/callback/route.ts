import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/admin';
  const safeNext = nextParam.startsWith('/') ? nextParam : '/admin';

  if (code) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error('Error intercambiando código OAuth:', error.message);
    } catch (err) {
      console.error('Excepción en /auth/callback:', err);
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}?auth_error=oauth_failed`);
}
