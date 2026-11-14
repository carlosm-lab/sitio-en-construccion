import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { VIP_COOKIE_NAME } from '@/lib/vip-session';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Continuar borrando cookie local
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(VIP_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
