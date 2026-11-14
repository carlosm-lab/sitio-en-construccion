import { ArtworkCategory, CategoryMeta } from '@/types';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.artedigital.click';

export const MEMBERSHIP_PRICE_USD = '25.00';
export const MEMBERSHIP_PRICE_DISPLAY = '$25 USD';
export const MEMBERSHIP_PRICE_FULL_DISPLAY = '$25.00 USD';
export const TERMS_VERSION = 'v1.0';
export const PAYPAL_ITEM_DESCRIPTION =
  'Pase de Acceso Total Vitalicio - Galería 4K, Prompts y Manuales ArteDigital.click (Entrega Digital Inmediata)';

export const BUCKET_WATERMARKED = 'watermarked-art';
export const BUCKET_HIGHRES = 'vip-highres-art';
export const BUCKET_MANUALS = 'vip-manuals';

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'retratos-ia',
    name: 'Retratos IA',
    shortDesc:
      'Iluminación de estudio, fotografía editorial y anatomía natural sin artefactos.',
    seoTitle: 'Retratos IA y Prompts Fotográficos Editoriales | ArteDigital.click',
    seoDescription:
      'Colección de retratos digitales generados con IA, parámetros de lentes 85mm y prompts de iluminación pastel listos para producción.',
  },
  {
    slug: 'concept-art',
    name: 'Concept Art',
    shortDesc:
      'Arquitectura minimalista, entornos cinematográficos y dirección de arte pastel.',
    seoTitle: 'Concept Art IA y Escenarios Minimalistas | ArteDigital.click',
    seoDescription:
      'Explora concept art arquitectónico y atmósferas editoriales generadas por IA con prompts verificados y archivos master en alta resolución.',
  },
  {
    slug: 'guias-personajes',
    name: 'Guías de Personajes',
    shortDesc:
      'Hojas de referencia 360°, matrices de expresiones y flujos de consistencia facial.',
    seoTitle: 'Guías de Consistencia de Personajes IA (Turnarounds y FaceID) | ArteDigital.click',
    seoDescription:
      'Domina la consistencia de personajes en Midjourney, Flux y Stable Diffusion con turnarounds 360°, seeds y manuales técnicos.',
  },
];

export const CATEGORY_MAP: Record<ArtworkCategory, CategoryMeta> = {
  'retratos-ia': CATEGORIES[0],
  'concept-art': CATEGORIES[1],
  'guias-personajes': CATEGORIES[2],
};
