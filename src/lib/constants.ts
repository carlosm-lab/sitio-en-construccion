import { ArtworkCategory, CategoryMeta } from '@/types';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.artedigital.click';

export const MEMBERSHIP_PRICE_USD = '25.00';
export const MEMBERSHIP_PRICE_DISPLAY = '$25 USD';
export const MEMBERSHIP_PRICE_FULL_DISPLAY = '$25.00 USD';
export const TERMS_VERSION = 'v1.0';
export const PAYPAL_ITEM_DESCRIPTION =
  'Pase de Acceso Total Vitalicio - Galería de Arte Digital y Fotografía 4K ArteDigital.click (Entrega Digital Inmediata)';

export const BUCKET_WATERMARKED = 'watermarked-art';
export const BUCKET_HIGHRES = 'vip-highres-art';
export const BUCKET_MANUALS = 'vip-manuals';

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'fotografia-editorial',
    name: 'Fotografía Editorial',
    shortDesc:
      'Retratos artísticos de alta costura, iluminación de estudio y fotografía documental en 4K.',
    seoTitle: 'Fotografía Editorial y Retratos Artísticos en 4K | ArteDigital.click',
    seoDescription:
      'Colección curada de fotografía editorial y retratos artísticos en resolución nativa 4K. Descarga master y licencia comercial con el Pase Total de $25 USD.',
  },
  {
    slug: 'arte-conceptual',
    name: 'Arte Conceptual',
    shortDesc:
      'Arquitectura visual vanguardista, entornos oníricos y paisajes cinematográficos.',
    seoTitle: 'Arte Conceptual y Paisajes Cinematográficos 4K | ArteDigital.click',
    seoDescription:
      'Explora obras de arte conceptual, atmósferas surrealistas y paisajes en ultra alta resolución con archivos master 4K y licencia comercial permanente.',
  },
  {
    slug: 'ilustracion-digital',
    name: 'Ilustración Digital',
    shortDesc:
      'Pintura digital, composiciones contemporáneas y obras plásticas de alto impacto visual.',
    seoTitle: 'Ilustración Digital y Bellas Artes en 4K | ArteDigital.click',
    seoDescription:
      'Galería exclusiva de ilustración digital y bellas artes en resolución 4K sin compresión. Acceso ilimitado y licencia comercial con el Pase Total de $25 USD.',
  },
];

export const CATEGORY_MAP: Record<ArtworkCategory, CategoryMeta> = {
  'fotografia-editorial': CATEGORIES[0],
  'arte-conceptual': CATEGORIES[1],
  'ilustracion-digital': CATEGORIES[2],
  // Mapeos heredados para retrocompatibilidad
  'retratos-ia': CATEGORIES[0],
  'concept-art': CATEGORIES[1],
  'guias-personajes': CATEGORIES[2],
};
