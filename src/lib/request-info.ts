import { NextRequest } from 'next/server';

export interface ClientForensicInfo {
  ipAddress: string;
  userAgent: string;
  vercelRegion: string | null;
  vercelCountry: string | null;
}

const IPV4_REGEX =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]{2,45}$/;

function sanitizeIp(raw: string | undefined | null): string {
  if (!raw) return '127.0.0.1';
  const candidate = raw.trim().slice(0, 45);
  if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
    return candidate;
  }
  return '127.0.0.1';
}

function sanitizeUserAgent(raw: string | undefined | null): string {
  if (!raw) return 'Unknown-User-Agent';
  return raw.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 500) || 'Unknown-User-Agent';
}

/**
 * Extrae la IP real del visitante priorizando las cabeceras nativas de Vercel
 * y sanitiza IP + User-Agent para evidencia forense íntegra.
 */
export function extractClientForensicInfo(req: NextRequest | Request): ClientForensicInfo {
  const headers = req.headers;

  const vercelForwarded = headers.get('x-vercel-forwarded-for');
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');

  const rawIp =
    vercelForwarded?.split(',')[0]?.trim() ||
    forwardedFor?.split(',')[0]?.trim() ||
    realIp?.trim() ||
    '127.0.0.1';

  const ipAddress = sanitizeIp(rawIp);
  const userAgent = sanitizeUserAgent(headers.get('user-agent'));
  const vercelRegion = headers.get('x-vercel-id')?.slice(0, 120) || null;
  const vercelCountry = headers.get('x-vercel-ip-country')?.slice(0, 8) || null;

  return {
    ipAddress,
    userAgent,
    vercelRegion,
    vercelCountry,
  };
}

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Limitador de tasa por ventana deslizante para proteger endpoints sensibles.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (rateLimitStore.size > 5000) {
    rateLimitStore.forEach((bucket, k) => {
      const valid = bucket.timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        rateLimitStore.delete(k);
      } else {
        bucket.timestamps = valid;
      }
    });
  }

  const existing = rateLimitStore.get(key) || { timestamps: [] };
  existing.timestamps = existing.timestamps.filter((t) => t > cutoff);

  if (existing.timestamps.length >= maxRequests) {
    const oldest = existing.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitStore.set(key, existing);
    return { allowed: false, retryAfterSeconds };
  }

  existing.timestamps.push(now);
  rateLimitStore.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0 };
}
