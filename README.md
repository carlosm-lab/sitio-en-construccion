# ArteDigital.click

Plataforma comercial de arte digital generado con IA, librería de prompts avanzados y manuales técnicos de consistencia de personajes, construida con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** (paleta estricta de 3 colores pastel), **Supabase** y **PayPal REST API v2**.

## Variables de Entorno Requeridas (`.env.local` y Vercel)

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (`sandbox` o `live`)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SECRET_PASSWORD`
- `NEXT_PUBLIC_SITE_URL` (`https://www.artedigital.click`)

## Inicialización de Base de Datos

Ejecuta el script completo ubicado en [supabase/schema.sql](supabase/schema.sql) dentro del **SQL Editor** de tu proyecto en Supabase.
