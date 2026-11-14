import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const VIP_COOKIE_NAME = 'artedigital_vip_session';

interface VipCookiePayload {
  email: string;
  licenseCode: string;
  issuedAt: string;
}

function getSigningSecret(): string {
  return (
    process.env.VIP_SESSION_SECRET ||
    process.env.ADMIN_SECRET_PASSWORD ||
    process.env.PAYPAL_CLIENT_SECRET ||
    'artedigital-default-hmac-key'
  );
}

export function signVipSessionToken(payload: VipCookiePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyVipSessionToken(token: string | undefined | null): VipCookiePayload | null {
  if (!token || !token.includes('.')) return null;

  const [encoded, providedSig] = token.split('.');
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');

  const bufA = Buffer.from(providedSig);
  const bufB = Buffer.from(expectedSig);
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as VipCookiePayload;
    if (!parsed.email || !parsed.licenseCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getVipSessionFromRequest(req: NextRequest): VipCookiePayload | null {
  const cookieVal = req.cookies.get(VIP_COOKIE_NAME)?.value;
  return verifyVipSessionToken(cookieVal);
}
