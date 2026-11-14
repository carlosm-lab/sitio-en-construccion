import { NextResponse } from 'next/server';
import { VIP_COOKIE_NAME } from '@/lib/vip-session';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(VIP_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
