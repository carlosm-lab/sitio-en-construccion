-- ============================================================================
-- ArteDigital.click - Esquema Real de Producción (PostgreSQL + Storage + Auth)
-- Cero datos hardcodeados: 100% persistido en Supabase
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: admin_users (Administradores autorizados vía Google OAuth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: artworks (Obras reales subidas a Supabase Storage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('retratos-ia', 'concept-art', 'guias-personajes')),
  prompt_preview TEXT NOT NULL,
  prompt_full TEXT NOT NULL,
  render_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  watermarked_path TEXT NOT NULL,
  watermarked_url TEXT NOT NULL,
  high_res_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artworks_slug ON public.artworks (slug);
CREATE INDEX IF NOT EXISTS idx_artworks_category ON public.artworks (category);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON public.artworks (created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. TABLA: manuals (Manuales PDF reales alojados en bucket privado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  pages_count INTEGER NOT NULL DEFAULT 1,
  format TEXT NOT NULL DEFAULT 'PDF',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: customers (Licencias Vitalicia $20.00 USD)
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
-- 5. TABLA: audit_logs (Evidencia Forense para Centro de Resoluciones PayPal)
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
      'ASSET_DOWNLOADED',
      'ADMIN_ACTION'
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
-- 5.1 TABLA: support_messages (Bandeja de Soporte y Contacto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Soporte de Licencia VIP',
  order_or_license TEXT,
  message TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_email ON public.support_messages (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages (status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages (created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct public access to admin_users" ON public.admin_users;
CREATE POLICY "Deny direct public access to admin_users"
  ON public.admin_users FOR ALL
  TO anon, authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to artworks" ON public.artworks;
CREATE POLICY "Deny direct public access to artworks"
  ON public.artworks FOR ALL
  TO anon, authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to manuals" ON public.manuals;
CREATE POLICY "Deny direct public access to manuals"
  ON public.manuals FOR ALL
  TO anon, authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to customers" ON public.customers;
CREATE POLICY "Deny direct public access to customers"
  ON public.customers FOR ALL
  TO anon, authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to audit_logs" ON public.audit_logs;
CREATE POLICY "Deny direct public access to audit_logs"
  ON public.audit_logs FOR ALL
  TO anon, authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Deny direct public access to support_messages" ON public.support_messages;
CREATE POLICY "Deny direct public access to support_messages"
  ON public.support_messages FOR ALL
  TO anon, authenticated
  USING (FALSE);

-- Vista segura con security_invoker para consultas públicas (solo columnas no sensibles)
CREATE OR REPLACE VIEW public.artworks_public
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.artworks_public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. BUCKETS REALES DE SUPABASE STORAGE
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('watermarked-art', 'watermarked-art', TRUE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vip-highres-art', 'vip-highres-art', FALSE, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vip-manuals', 'vip-manuals', FALSE, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read watermarked art" ON storage.objects;
CREATE POLICY "Public read watermarked art"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'watermarked-art');
