# ArteDigital.click

Plataforma comercial de arte digital generado con IA, librería de prompts avanzados y manuales técnicos de consistencia de personajes, construida con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** (paleta Azul Pastel y complementarios), **Supabase** (PostgreSQL, Auth con Google OAuth y Storage), y **PayPal REST API v2**.

## Variables de Entorno Requeridas (`.env.local` y Vercel)

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (`sandbox` o `live`)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VIP_SESSION_SECRET`
- `ADMIN_ALLOWED_EMAILS` (lista separada por comas con correos autorizados en `/admin` vía Google OAuth)
- `NEXT_PUBLIC_SITE_URL` (`https://www.artedigital.click`)

## Infraestructura en Supabase

1. Ejecuta el script completo ubicado en [supabase/schema.sql](supabase/schema.sql) dentro del **SQL Editor** de tu proyecto en Supabase (tablas `admin_users`, `artworks`, `manuals`, `customers`, `audit_logs`, vista `artworks_public`, políticas RLS y buckets de Storage).
2. Buckets en **Supabase Storage**:
   - `watermarked-art` (público): vistas previas con marca de agua generadas automáticamente al subir obras.
   - `vip-highres-art` (privado): archivos maestros en alta resolución descargados mediante Signed URLs en `/vip`.
   - `vip-manuals` (privado): manuales PDF/ZIP descargados mediante Signed URLs en `/vip`.
3. **Authentication -> Providers -> Google**: habilita Google OAuth con tus credenciales de Google Cloud Console y registra las Redirect URLs hacia `/auth/callback`.
