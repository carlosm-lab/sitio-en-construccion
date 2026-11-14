import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const VIP_COOKIE_NAME = 'artedigital_vip_session';
export const VIP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días
const VIP_SESSION_MAX_AGE_MS = VIP_SESSION_MAX_AGE_SECONDS * 1000;

export interface VipCookiePayload {
  email: string;
  licenseCode: string;
  issuedAt: string;
}

function getSigningSecret(): string {
  const secret = process.env.VIP_SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error('VIP_SESSION_SECRET no está configurado correctamente en el servidor.');
  }
  return secret;
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

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(encoded)
      .digest('base64url');

    const bufA = Buffer.from(providedSig);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8')
    ) as VipCookiePayload;

    if (!parsed.email || !parsed.licenseCode || !parsed.issuedAt) {
      return null;
    }

    const issuedTime = Date.parse(parsed.issuedAt);
    if (!Number.isFinite(issuedTime)) {
      return null;
    }

    const now = Date.now();
    if (issuedTime > now + 5 * 60 * 1000 || now - issuedTime > VIP_SESSION_MAX_AGE_MS) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getVipSessionFromRequest(req: NextRequest): VipCookiePayload | null {
  const cookieVal = req.cookies.get(VIP_COOKIE_NAME)?.value;
  return verifyVipSessionToken(cookieVal);
}
