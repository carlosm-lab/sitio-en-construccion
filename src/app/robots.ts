import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seed-data';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/categoria/', '/arte/', '/terminos-y-condiciones', '/politica-de-reembolsos', '/politica-de-privacidad', '/contacto'],
        disallow: ['/api/', '/vip', '/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
