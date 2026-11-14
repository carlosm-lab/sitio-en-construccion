import { NextRequest } from 'next/server';

export interface ClientForensicInfo {
  ipAddress: string;
  userAgent: string;
  vercelRegion: string | null;
  vercelCountry: string | null;
}

/**
 * Extrae la IP real del visitante priorizando las cabeceras nativas de Vercel
 * para garantizar evidencia forense sólida ante disputas en PayPal.
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

  const userAgent = headers.get('user-agent') || 'Unknown-User-Agent';
  const vercelRegion = headers.get('x-vercel-id') || null;
  const vercelCountry = headers.get('x-vercel-ip-country') || null;

  return {
    ipAddress: rawIp,
    userAgent,
    vercelRegion,
    vercelCountry,
  };
}
