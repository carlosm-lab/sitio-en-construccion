-- ============================================================================
-- ArteDigital.click - Esquema de Base de Datos PostgreSQL (Supabase)
-- Cumplimiento de PayPal Digital Goods, Auditoría Forense Anti-Chargeback y SEO
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: artworks (Banco de Arte Digital IA y Prompts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('retratos-ia', 'concept-art', 'guias-personajes')),
  prompt_preview TEXT NOT NULL,
  prompt_full TEXT NOT NULL,
  render_params JSONB DEFAULT '{}'::jsonb,
  watermarked_url TEXT NOT NULL,
  high_res_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artworks_slug ON public.artworks (slug);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks (category);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON public.artworks (created_at DESC);

-- ----------------------------------------------------------------------------
-- 2. TABLA: manuals (Manuales Técnicos PDF y Guías de Consistencia)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pages_count INTEGER NOT NULL DEFAULT 24,
  format TEXT NOT NULL DEFAULT 'PDF + Prompts',
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: customers (Compradores con Licencia Vitalicia $20 USD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  license_code TEXT NOT NULL UNIQUE,
  paypal_order_id TEXT NOT NULL UNIQUE,
  paypal_payer_id TEXT,
  amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  terms_version TEXT NOT NULL DEFAULT 'v1.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_license_code ON public.customers (license_code);
CREATE INDEX IF NOT EXISTS idx_customers_paypal_order_id ON public.customers (paypal_order_id);

-- ----------------------------------------------------------------------------
-- 4. TABLA: audit_logs (Evidencia Forense para Centro de Resoluciones PayPal)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  paypal_order_id TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'TERMS_ACCEPTED',
      'PAYMENT_CAPTURED',
      'VIP_ACCESS_GRANTED',
      'VIP_LOGIN',
      'ASSET_DOWNLOADED'
    )
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_customer_id ON public.audit_logs (customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_paypal_order_id ON public.audit_logs (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Nota: En el frontend público nunca se exponen prompt_full, high_res_url,
-- file_url, customers ni audit_logs directamente vía anon key.
-- Los Route Handlers de Next.js usan SUPABASE_SERVICE_ROLE_KEY en el servidor
-- y proyectan únicamente columnas públicas para visitantes no verificados.

-- Vista pública segura de artworks (solo columnas públicas para anon)
CREATE OR REPLACE VIEW public.artworks_public AS
SELECT
  id,
  title,
  slug,
  category,
  prompt_preview,
  render_params,
  watermarked_url,
  alt_text,
  created_at
FROM public.artworks;

-- Política restrictiva: solo el rol de servicio (servidor) puede leer/escribir tablas privadas
DROP POLICY IF EXISTS "Deny direct public access to artworks" ON public.artworks;
CREATE POLICY "Deny direct public access to artworks"
  ON public.artworks FOR SELECT
  TO anon
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to manuals" ON public.manuals;
CREATE POLICY "Deny direct public access to manuals"
  ON public.manuals FOR SELECT
  TO anon
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to customers" ON public.customers;
CREATE POLICY "Deny direct public access to customers"
  ON public.customers FOR ALL
  TO anon
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to audit_logs" ON public.audit_logs;
CREATE POLICY "Deny direct public access to audit_logs"
  ON public.audit_logs FOR ALL
  TO anon
  USING (FALSE);

GRANT SELECT ON public.artworks_public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. BUCKETS DE STORAGE (Ejecutar si Storage está habilitado)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('watermarked-art', 'watermarked-art', TRUE),
  ('vip-highres-art', 'vip-highres-art', FALSE),
  ('vip-manuals', 'vip-manuals', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. DATOS SEMILLA INICIALES (Obras y Manuales de Demostración)
-- ----------------------------------------------------------------------------
INSERT INTO public.artworks (
  title,
  slug,
  category,
  prompt_preview,
  prompt_full,
  render_params,
  watermarked_url,
  high_res_url,
  alt_text
)
VALUES
  (
    'Retrato Editorial en Luz de Alabastro',
    'retrato-editorial-luz-alabastro',
    'retratos-ia',
    'Editorial portrait of an avant-garde sculptor in soft alabaster morning light, 85mm f/1.4...',
    'Editorial fine-art portrait of an avant-garde ceramic sculptor standing in a sunlit minimalist atelier, soft alabaster and sage pastel palette, 85mm f/1.4 Hasselblad medium format lens, natural skin texture, delicate shadows, consistent character anchor --cref https://cdn.artedigital.click/ref-01.png --cw 85 --ar 4:5 --stylize 250 --v 6.1',
    '{"motor":"Midjourney v6.1","aspecto":"4:5","lente":"85mm f/1.4","consistencia":"--cref 85%","resolucion":"4096x5120px"}'::jsonb,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1800&q=95',
    'Retrato editorial de arte digital IA con iluminación alabastro suave'
  ),
  (
    'Santuario Botánico en Arquitectura Brutalista',
    'santuario-botanico-arquitectura-brutalista',
    'concept-art',
    'Minimalist concrete conservatory flooded with diffused morning mist and sage foliage...',
    'Architectural concept art of a serene limestone conservatory bathed in warm morning mist, sage botanical arches, volumetric sunbeams, architectural photography style, ultra-clean composition, ArchDaily editorial look, color harmony alabaster and muted sage --ar 16:9 --stylize 300 --v 6.1',
    '{"motor":"Midjourney v6.1","aspecto":"16:9","iluminacion":"Volumétrica Difusa","resolucion":"5120x2880px"}'::jsonb,
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1800&q=95',
    'Concept art arquitectónico minimalista con vegetación salvia y luz cálida'
  ),
  (
    'Hoja de Referencia: Personaje Consistente 360°',
    'hoja-referencia-personaje-consistente-360',
    'guias-personajes',
    'Character turnaround sheet, front side and back views, neutral linen studio clothing...',
    'Full character design turnaround sheet showing front, three-quarter, side profile and back views of the same protagonist, neutral linen garments, flat studio lighting, clean white-alabaster background, consistent facial geometry and freckles, IP-Adapter + ControlNet OpenPose workflow --ar 3:2 --seed 482910 --v 6.1',
    '{"motor":"Flux.1 + ControlNet","aspecto":"3:2","tecnica":"Turnaround + Seed Lock","resolucion":"4500x3000px"}'::jsonb,
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1800&q=95',
    'Guía visual de personaje consistente en múltiples ángulos con IA'
  ),
  (
    'Estudio de Vestuario Histórico y Texturas Lino',
    'estudio-vestuario-historico-texturas-lino',
    'retratos-ia',
    'Three-quarter portrait in natural linen drapery, soft museum lighting, film grain...',
    'Museum-grade portrait study in raw organic linen drapery, delicate chiaroscuro lighting, Kodak Portra 400 emulation, subtle analog grain, serene facial expression, alabaster backdrop --ar 4:5 --cw 90 --v 6.1',
    '{"motor":"Midjourney v6.1","aspecto":"4:5","pelicula":"Portra 400","resolucion":"4096x5120px"}'::jsonb,
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1800&q=95',
    'Estudio de retrato IA con texturas orgánicas de lino e iluminación de museo'
  ),
  (
    'Escenario Orbital de Galería Silenciosa',
    'escenario-orbital-galeria-silenciosa',
    'concept-art',
    'Futuristic serene gallery hall overlooking pale horizon, travertine stone, soft shadows...',
    'High-concept sci-fi interior gallery carved in pale travertine marble overlooking a misty horizon, understated monolithic sculptures, diffused skylight, calm pastel sage atmosphere, octane render architectural realism --ar 16:9 --stylize 200 --v 6.1',
    '{"motor":"Flux.1 Dev","aspecto":"16:9","material":"Travertino & Niebla","resolucion":"5120x2880px"}'::jsonb,
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1800&q=95',
    'Concept art de galería minimalista futurista en tonos alabastro y salvia'
  ),
  (
    'Matriz de Expresiones Faciales para Cómic IA',
    'matriz-expresiones-faciales-comic-ia',
    'guias-personajes',
    '9-panel facial expression grid of the same character, joy, surprise, serenity, focus...',
    '9-panel facial expression reference sheet of a consistent female protagonist: serene, subtle smile, pensive, determined, surprised, focused, soft studio lighting, cohesive hairline and eye geometry across all panels, LoRA weight 0.85 --ar 1:1 --seed 991204 --v 6.1',
    '{"motor":"SDXL + IP-Adapter FaceID","aspecto":"1:1","tecnica":"Matriz 3x3 + FaceID","resolucion":"4096x4096px"}'::jsonb,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=55',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=95',
    'Matriz de expresiones faciales consistentes para narrativa gráfica con IA'
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.manuals (title, description, pages_count, format, file_url)
VALUES
  (
    'Manual Maestro: Consistencia de Personajes 100% Fiel (v2026)',
    'Guía técnica paso a paso para mantener exactamente el mismo rostro, vestuario y proporciones en Midjourney v6.1 (--cref / --cw), Flux.1 y ComfyUI + IP-Adapter FaceID.',
    48,
    'PDF + Flujos JSON',
    '/api/vip/manual-download?doc=consistencia-personajes-2026'
  ),
  (
    'Ingeniería de Prompts Editoriales y Fotografía de Estudio',
    'Diccionario técnico de lentes, esquemas de iluminación pastel, emulación analógica y control de composición para resultados de nivel museo sin artefactos.',
    36,
    'PDF + Plantillas',
    '/api/vip/manual-download?doc=ingenieria-prompts-editoriales'
  ),
  (
    'Pipeline de Escalado 4K y Limpieza Comercial para Bancos de Arte',
    'Protocolo completo de upscaling sin pérdida de textura de piel, gestión de perfiles ICC y preparación de archivos master listos para uso editorial o comercial.',
    28,
    'PDF Técnico',
    '/api/vip/manual-download?doc=pipeline-escalado-4k'
  )
ON CONFLICT DO NOTHING;
