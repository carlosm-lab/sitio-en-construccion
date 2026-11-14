import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/categoria/',
          '/arte/',
          '/terminos-y-condiciones',
          '/politica-de-reembolsos',
          '/politica-de-privacidad',
          '/contacto',
        ],
        disallow: ['/api/', '/vip', '/admin', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
