import { ArtworkCategory, ArtworkFull, CategoryMeta, ManualItem } from '@/types';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.artedigital.click';

export const MEMBERSHIP_PRICE_USD = '20.00';
export const TERMS_VERSION = 'v1.0';
export const PAYPAL_ITEM_DESCRIPTION =
  'Licencia de Acceso Total - Librería y Prompts ArteDigital.click (Entrega Digital Inmediata)';

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'retratos-ia',
    name: 'Retratos IA',
    shortDesc: 'Iluminación de estudio, fotografía editorial y anatomía natural sin artefactos.',
    seoTitle: 'Retratos IA y Prompts Fotográficos Editoriales | ArteDigital.click',
    seoDescription:
      'Colección de retratos digitales generados con IA, parámetros de lentes 85mm y prompts de iluminación pastel listos para producción.',
  },
  {
    slug: 'concept-art',
    name: 'Concept Art',
    shortDesc: 'Arquitectura minimalista, entornos cinematográficos y dirección de arte pastel.',
    seoTitle: 'Concept Art IA y Escenarios Minimalistas | ArteDigital.click',
    seoDescription:
      'Explora concept art arquitectónico y atmósferas editoriales generadas por IA con prompts verificados y archivos master en alta resolución.',
  },
  {
    slug: 'guias-personajes',
    name: 'Guías de Personajes',
    shortDesc: 'Hojas de referencia 360°, matrices de expresiones y flujos de consistencia facial.',
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

export const SEED_ARTWORKS: ArtworkFull[] = [
  {
    id: 'art-001',
    title: 'Retrato Editorial en Luz de Alabastro',
    slug: 'retrato-editorial-luz-alabastro',
    category: 'retratos-ia',
    prompt_preview:
      'Editorial fine-art portrait of an avant-garde ceramic sculptor in soft alabaster light, 85mm f/1.4...',
    prompt_full:
      'Editorial fine-art portrait of an avant-garde ceramic sculptor standing in a sunlit minimalist atelier, soft alabaster and sage pastel palette, 85mm f/1.4 Hasselblad medium format lens, natural skin texture, delicate shadows, consistent character anchor --cref https://cdn.artedigital.click/ref-01.png --cw 85 --ar 4:5 --stylize 250 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1',
      aspecto: '4:5',
      lente: '85mm f/1.4',
      consistencia: '--cref 85%',
      resolucion: '4096x5120px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Retrato editorial de arte digital IA con iluminación alabastro suave',
    created_at: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'art-002',
    title: 'Santuario Botánico en Arquitectura Brutalista',
    slug: 'santuario-botanico-arquitectura-brutalista',
    category: 'concept-art',
    prompt_preview:
      'Minimalist limestone conservatory flooded with diffused morning mist and sage foliage...',
    prompt_full:
      'Architectural concept art of a serene limestone conservatory bathed in warm morning mist, sage botanical arches, volumetric sunbeams, architectural photography style, ultra-clean composition, ArchDaily editorial look, color harmony alabaster and muted sage --ar 16:9 --stylize 300 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1',
      aspecto: '16:9',
      iluminacion: 'Volumétrica Difusa',
      resolucion: '5120x2880px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Concept art arquitectónico minimalista con vegetación salvia y luz cálida',
    created_at: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'art-003',
    title: 'Hoja de Referencia: Personaje Consistente 360°',
    slug: 'hoja-referencia-personaje-consistente-360',
    category: 'guias-personajes',
    prompt_preview:
      'Full character design turnaround sheet showing front, three-quarter, side profile and back views...',
    prompt_full:
      'Full character design turnaround sheet showing front, three-quarter, side profile and back views of the same protagonist, neutral linen garments, flat studio lighting, clean white-alabaster background, consistent facial geometry and freckles, IP-Adapter + ControlNet OpenPose workflow --ar 3:2 --seed 482910 --v 6.1',
    render_params: {
      motor: 'Flux.1 + ControlNet',
      aspecto: '3:2',
      tecnica: 'Turnaround + Seed Lock',
      resolucion: '4500x3000px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Guía visual de personaje consistente en múltiples ángulos con IA',
    created_at: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 'art-004',
    title: 'Estudio de Vestuario Histórico y Texturas Lino',
    slug: 'estudio-vestuario-historico-texturas-lino',
    category: 'retratos-ia',
    prompt_preview:
      'Museum-grade portrait study in raw organic linen drapery, delicate chiaroscuro lighting...',
    prompt_full:
      'Museum-grade portrait study in raw organic linen drapery, delicate chiaroscuro lighting, Kodak Portra 400 emulation, subtle analog grain, serene facial expression, alabaster backdrop --ar 4:5 --cw 90 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1',
      aspecto: '4:5',
      pelicula: 'Portra 400',
      resolucion: '4096x5120px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Estudio de retrato IA con texturas orgánicas de lino e iluminación de museo',
    created_at: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'art-005',
    title: 'Escenario Orbital de Galería Silenciosa',
    slug: 'escenario-orbital-galeria-silenciosa',
    category: 'concept-art',
    prompt_preview:
      'High-concept sci-fi interior gallery carved in pale travertine marble overlooking a misty horizon...',
    prompt_full:
      'High-concept sci-fi interior gallery carved in pale travertine marble overlooking a misty horizon, understated monolithic sculptures, diffused skylight, calm pastel sage atmosphere, octane render architectural realism --ar 16:9 --stylize 200 --v 6.1',
    render_params: {
      motor: 'Flux.1 Dev',
      aspecto: '16:9',
      material: 'Travertino & Niebla',
      resolucion: '5120x2880px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Concept art de galería minimalista futurista en tonos alabastro y salvia',
    created_at: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'art-006',
    title: 'Matriz de Expresiones Faciales para Cómic IA',
    slug: 'matriz-expresiones-faciales-comic-ia',
    category: 'guias-personajes',
    prompt_preview:
      '9-panel facial expression reference sheet of a consistent protagonist: serene, pensive, determined...',
    prompt_full:
      '9-panel facial expression reference sheet of a consistent female protagonist: serene, subtle smile, pensive, determined, surprised, focused, soft studio lighting, cohesive hairline and eye geometry across all panels, LoRA weight 0.85 --ar 1:1 --seed 991204 --v 6.1',
    render_params: {
      motor: 'SDXL + IP-Adapter FaceID',
      aspecto: '1:1',
      tecnica: 'Matriz 3x3 + FaceID',
      resolucion: '4096x4096px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Matriz de expresiones faciales consistentes para narrativa gráfica con IA',
    created_at: '2026-11-06T10:00:00.000Z',
  },
  {
    id: 'art-007',
    title: 'Pabellón de Cerámica y Sombra Suave',
    slug: 'pabellon-ceramica-sombra-suave',
    category: 'concept-art',
    prompt_preview:
      'Minimalist ceramic gallery pavilion with sculpted plaster arches and soft daylight...',
    prompt_full:
      'Minimalist ceramic exhibition pavilion with sculpted plaster arches, soft diffused daylight casting delicate geometric shadows across travertine floors, handmade stoneware vessels, calm editorial aesthetic --ar 4:5 --stylize 220 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1',
      aspecto: '4:5',
      iluminacion: 'Luz Zenital Suave',
      resolucion: '4096x5120px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Pabellón arquitectónico de cerámica minimalista generado con IA',
    created_at: '2026-11-07T10:00:00.000Z',
  },
  {
    id: 'art-008',
    title: 'Anclaje de Vestuario y Paleta Consistente',
    slug: 'anclaje-vestuario-paleta-consistente',
    category: 'guias-personajes',
    prompt_preview:
      'Consistent outfit anchor sheet showing seasonal linen coats, color swatches and silhouette...',
    prompt_full:
      'Character wardrobe consistency sheet featuring four seasonal variations of the exact same protagonist wearing sage wool and warm alabaster linen coats, color swatches in margin, neutral studio light, locked facial identity --cref --cw 95 --ar 16:9 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1 + --cw 95',
      aspecto: '16:9',
      tecnica: 'Wardrobe Lock',
      resolucion: '5120x2880px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Guía técnica de consistencia de vestuario y rostro en personajes de IA',
    created_at: '2026-11-08T10:00:00.000Z',
  },
  {
    id: 'art-009',
    title: 'Retrato Monocromático Suave en Medio Formato',
    slug: 'retrato-monocromatico-suave-medio-formato',
    category: 'retratos-ia',
    prompt_preview:
      'Delicate warm-toned monochrome studio portrait with 120mm lens bokeh and natural skin...',
    prompt_full:
      'Delicate warm-toned monochrome editorial portrait shot on Hasselblad 120mm macro lens, natural skin pores, serene gaze, soft sage-tinted backdrop, studio softbox reflection in eyes, hyper-detailed fine art print quality --ar 4:5 --v 6.1',
    render_params: {
      motor: 'Midjourney v6.1',
      aspecto: '4:5',
      lente: '120mm Macro',
      resolucion: '4096x5120px',
    },
    watermarked_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=55',
    high_res_url:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1800&q=95',
    alt_text: 'Retrato editorial de arte IA en formato medio con iluminación suave',
    created_at: '2026-11-09T10:00:00.000Z',
  },
];

export const SEED_MANUALS: ManualItem[] = [
  {
    id: 'man-001',
    title: 'Manual Maestro: Consistencia de Personajes 100% Fiel (v2026)',
    description:
      'Guía técnica paso a paso para mantener exactamente el mismo rostro, vestuario y proporciones en Midjourney v6.1 (--cref / --cw), Flux.1 y ComfyUI + IP-Adapter FaceID.',
    pages_count: 48,
    format: 'PDF + Flujos JSON',
    file_url: '/api/vip/manual-download?doc=consistencia-personajes-2026',
    created_at: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'man-002',
    title: 'Ingeniería de Prompts Editoriales y Fotografía de Estudio',
    description:
      'Diccionario técnico de lentes, esquemas de iluminación pastel, emulación analógica y control de composición para resultados de nivel museo sin artefactos.',
    pages_count: 36,
    format: 'PDF + Plantillas',
    file_url: '/api/vip/manual-download?doc=ingenieria-prompts-editoriales',
    created_at: '2026-11-02T08:00:00.000Z',
  },
  {
    id: 'man-003',
    title: 'Pipeline de Escalado 4K y Limpieza Comercial para Bancos de Arte',
    description:
      'Protocolo completo de upscaling sin pérdida de textura de piel, gestión de perfiles ICC y preparación de archivos master listos para uso editorial o comercial.',
    pages_count: 28,
    format: 'PDF Técnico',
    file_url: '/api/vip/manual-download?doc=pipeline-escalado-4k',
    created_at: '2026-11-03T08:00:00.000Z',
  },
];

export function stripPrivateArtworkFields(item: ArtworkFull) {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    prompt_preview: item.prompt_preview,
    render_params: item.render_params,
    watermarked_url: item.watermarked_url,
    alt_text: item.alt_text,
    created_at: item.created_at,
  };
}
