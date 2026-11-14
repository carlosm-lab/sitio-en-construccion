import React from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LockOpen,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  getFullArtworksWithSignedUrls,
  getManuals,
  getPublicArtworks,
} from '@/lib/data-store';
import { CATEGORIES, MEMBERSHIP_PRICE_USD, SITE_URL } from '@/lib/constants';
import { resolveServerAccess } from '@/lib/vip-auth';
import { GalleryExplorer } from '@/components/GalleryExplorer';
import {
  ManualCardLockAction,
  MemberAccessButton,
  UnlockPrimaryButton,
} from '@/components/HeroTriggerButtons';

export const dynamic = 'force-dynamic';

const FAQ_ITEMS = [
  {
    q: '¿El pago de $25 USD es por cada imagen o desbloquea toda la biblioteca?',
    a: 'Es un único pago total de $25.00 USD por acceso ilimitado y vitalicio a TODA la plataforma: incluye la descarga de todas las obras en alta resolución 4K sin marca de agua, todos los prompts completos y todos los manuales técnicos PDF/ZIP actuales y futuros.',
  },
  {
    q: '¿Cómo inicio sesión después de realizar mi compra?',
    a: 'Usamos autenticación directa con Google OAuth. No necesitas recordar contraseñas ni códigos: simplemente haz clic en "Entrar con Google" usando tu correo vinculado a la compra y todo el sitio quedará desbloqueado automáticamente.',
  },
  {
    q: '¿Qué formatos tienen los archivos descargables?',
    a: 'Las obras master se entregan en su formato original de alta resolución (PNG, JPG o WEBP sin compresión ni marcas de agua) y las guías técnicas se descargan directamente en formato PDF o paquetes ZIP.',
  },
  {
    q: '¿Puedo utilizar las obras y prompts en proyectos comerciales?',
    a: 'Sí. Tu Pase de Acceso Total incluye licencia mundial libre de regalías para uso personal, editorial, publicitario, diseño web y proyectos de clientes.',
  },
];

export default async function HomePage() {
  const access = await resolveServerAccess();
  const isUnlocked = access.hasFullAccess;

  const [artworks, manuals] = await Promise.all([
    isUnlocked ? getFullArtworksWithSignedUrls() : getPublicArtworks(),
    getManuals(isUnlocked),
  ]);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Pase de Acceso Total Vitalicio — Galería 4K, Prompts y Manuales ArteDigital.click',
    description:
      'Acceso vitalicio todo-en-uno a obras digitales generadas con IA en alta resolución sin marca de agua, prompts de ingeniería visual y manuales técnicos de consistencia de personajes.',
    brand: {
      '@type': 'Brand',
      name: 'ArteDigital.click',
    },
    offers: {
      '@type': 'Offer',
      url: SITE_URL,
      priceCurrency: 'USD',
      price: MEMBERSHIP_PRICE_USD,
      availability: 'https://schema.org/InStock',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {!isUnlocked && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        </>
      )}

      {/* =====================================================================
          VISTA PARA ADMINISTRADORES Y MIEMBROS CON ACCESO TOTAL ACTIVO
          (Cero botones de compra · Catálogo 100% desbloqueado)
         ===================================================================== */}
      {isUnlocked ? (
        <section className="rounded-3xl border-2 border-ink bg-surface p-6 sm:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/25 bg-canvas px-3.5 py-1 text-xs font-semibold text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {access.isAdmin
                  ? `Modo Administrador Activo (${access.googleUser?.email || access.customer?.email})`
                  : `Pase de Acceso Total Activo (${access.customer?.email})`}
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
                Biblioteca Completa 4K, Prompts y Manuales Desbloqueados
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                Tu cuenta tiene acceso total habilitado. Todas las imágenes en
                alta resolución sin marca de agua, los prompts completos y los
                manuales PDF están listos para copiar o descargar en un clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {access.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/25 bg-canvas px-4 py-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
                >
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  Centro de Control Admin
                </Link>
              )}
              <Link
                href="/vip"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-4 w-4 text-accent" />
                Ver Panel de Biblioteca VIP
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* ===================================================================
           VISTA PÚBLICA COMERCIAL (JERARQUÍA VISUAL Y CONVERSIÓN CLARA)
           =================================================================== */
        <>
          {/* 1. HERO PRINCIPAL */}
          <section className="rounded-3xl border border-ink/15 bg-surface/80 px-6 py-12 sm:px-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-4 py-1.5 text-xs font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Biblioteca Digital Todo-en-Uno · Acceso Vitalicio con Google
              </div>

              <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Galería de Arte IA en 4K, Prompts Exactos y Manuales de
                Consistencia
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
                Explora nuestra colección curada de fotografía editorial IA,
                concept art y guías de personajes. Con un{' '}
                <strong className="font-semibold text-ink">
                  único pago de $25 USD
                </strong>{' '}
                desbloqueas para siempre la descarga de todas las obras en 4K
                sin marca de agua, todos los prompts técnicos y todos los
                manuales PDF.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <UnlockPrimaryButton label="Obtener Pase de Acceso Total — $25 USD" />
                <a
                  href="#galeria"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/25 bg-canvas px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-blue"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowDown className="h-4 w-4 text-accent" />
                </a>
              </div>

              <div className="mt-4 flex justify-center">
                <MemberAccessButton />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-ink/10 pt-6 text-xs font-medium text-ink/80">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  Pago único de $25.00 USD (Todo el catálogo incluido)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent" />
                  Inicio de sesión en 1 clic con Google OAuth
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Pago seguro procesado por PayPal
                </span>
              </div>
            </div>
          </section>

          {/* 2. PILARES DE VALOR (QUÉ INCLUYE TU PASE TOTAL) */}
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                1. Obras Master 4K Sin Marca
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Descarga ilimitada de todas las piezas del catálogo en su
                resolución nativa original, limpias de marcas de agua y listas
                para proyectos editoriales, web o comerciales.
              </p>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <Sliders className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                2. Ingeniería de Prompts Exactos
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Copia en un clic la estructura completa de cada prompt: óptica
                de cámara, esquema de iluminación, motor IA, relación de
                aspecto y modificadores de estilo verificados.
              </p>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                3. Manuales de Consistencia PDF
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Guías técnicas descargables paso a paso para dominar
                turnarounds 360°, control de semillas (seeds) y consistencia
                facial en Midjourney, Flux y Stable Diffusion.
              </p>
            </div>
          </section>
        </>
      )}

      {/* 3. ACCESOS RÁPIDOS POR CATEGORÍA SEO */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="Colecciones por categoría">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categoria/${cat.slug}`}
            className="group rounded-2xl border border-ink/15 bg-surface-blue/70 p-5 transition-colors hover:border-accent hover:bg-surface"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl font-semibold text-ink">
                {cat.name}
              </span>
              <Layers className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              {cat.shortDesc}
            </p>
          </Link>
        ))}
      </section>

      {/* 4. GALERÍA INTERACTIVA Y BUSCADOR */}
      <div className="mt-14">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {isUnlocked ? 'Catálogo Master Desbloqueado' : 'Catálogo Editorial'}
            </span>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">
              {isUnlocked
                ? 'Obras en Alta Resolución y Prompts Completos'
                : 'Explora las Obras y Fichas Técnicas'}
            </h2>
          </div>
          <p className="text-xs text-ink/75">
            {isUnlocked
              ? 'Copia cualquier prompt o descarga el archivo master 4K directamente desde cada tarjeta.'
              : 'Selecciona cualquier obra para inspeccionar su ficha técnica y parámetros de renderizado.'}
          </p>
        </div>

        <GalleryExplorer artworks={artworks} serverUnlocked={isUnlocked} />
      </div>

      {/* 5. BIBLIOTECA DE MANUALES TÉCNICOS */}
      <section
        id="manuales"
        className="mt-16 rounded-3xl border border-ink/15 bg-surface-blue/65 p-6 sm:p-10"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <BookOpen className="h-3.5 w-3.5 text-accent" />
              Documentación Técnica
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
              Manuales de Consistencia de Personajes e Ingeniería Visual
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink/75">
              {isUnlocked
                ? 'Todos los manuales están desbloqueados en tu cuenta y listos para descargar.'
                : 'Todos los manuales técnicos están incluidos dentro del Pase de Acceso Total sin pagos adicionales.'}
            </p>
          </div>
        </div>

        {manuals.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-ink/15 bg-canvas p-8 text-center">
            <p className="text-sm font-medium text-ink/75">
              Nuevas ediciones de manuales técnicos en preparación.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {manuals.map((manual) => (
              <div
                key={manual.id}
                className="flex flex-col justify-between rounded-2xl border border-ink/15 bg-canvas p-5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-ink/70">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <FileText className="h-3.5 w-3.5 text-accent" />
                      {manual.format}
                    </span>
                    <span>{manual.pages_count} págs.</span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-ink">
                    {manual.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink/75">
                    {manual.description}
                  </p>
                </div>

                <ManualCardLockAction
                  manualId={manual.id}
                  manualTitle={manual.title}
                  format={manual.format}
                  pagesCount={manual.pages_count}
                  serverUnlocked={isUnlocked}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          6. SECCIÓN DE CONVERSIÓN ÚNICA Y PREGUNTAS FRECUENTES
             (Visible únicamente para visitantes que aún no tienen el Pase Total)
         ===================================================================== */}
      {!isUnlocked && (
        <>
          {/* Cómo Funciona en 3 Pasos */}
          <section className="mt-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Flujo Simple y Directo
              </span>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">
                ¿Cómo funciona el acceso en ArteDigital.click?
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-ink/15 bg-surface/65 p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-canvas">
                  01
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                  Conecta tu cuenta de Google
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  Olvídate de contraseñas o códigos complicados. Tu acceso se
                  vincula directamente a tu correo de Google mediante OAuth
                  oficial.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/15 bg-surface/65 p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-canvas">
                  02
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                  Pago único de $25 USD vía PayPal
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  Un solo pago desbloquea toda la plataforma de forma vitalicia.
                  No cobramos por imagen individual ni existen suscripciones
                  mensuales.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/15 bg-surface/65 p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-canvas">
                  03
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                  Desbloqueo inmediato de toda la web
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  Al instante desaparecen todos los avisos de compra y se
                  habilita la descarga directa en 4K, los prompts íntegros y los
                  manuales PDF.
                </p>
              </div>
            </div>
          </section>

          {/* Tarjeta Única de Conversión + FAQ */}
          <section className="mt-16 grid gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-surface p-8 lg:col-span-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Membresía Todo-en-Uno
                </span>
                <h2 className="mt-4 font-serif text-3xl font-semibold text-ink">
                  Pase de Acceso Total Vitalicio
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  Acceso completo y permanente a todo el catálogo actual y a las
                  nuevas obras y guías que se incorporen.
                </p>

                <div className="mt-6 flex items-baseline gap-2 border-y border-ink/15 py-4">
                  <span className="font-serif text-5xl font-bold text-ink">
                    $25.00
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/70">
                    USD · Pago Único
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-ink/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    Todas las obras en resolución 4K sin marca de agua.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    Todos los prompts exactos + parámetros de lente y seed.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    Todos los manuales PDF/ZIP de consistencia de personajes.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    Licencia de uso comercial y editorial incluida.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    Acceso vitalicio en 1 clic con tu cuenta de Google.
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-3">
                <UnlockPrimaryButton
                  label="Activar Pase de Acceso Total — $25 USD"
                  className="w-full"
                />
                <MemberAccessButton className="w-full" />
              </div>
            </div>

            <div className="rounded-3xl border border-ink/15 bg-canvas p-8 lg:col-span-7">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-accent" />
                <h2 className="font-serif text-2xl font-semibold text-ink">
                  Preguntas Frecuentes
                </h2>
              </div>

              <dl className="mt-6 space-y-5">
                {FAQ_ITEMS.map((item) => (
                  <div
                    key={item.q}
                    className="rounded-2xl border border-ink/15 bg-surface/50 p-5"
                  >
                    <dt className="font-serif text-lg font-semibold text-ink">
                      {item.q}
                    </dt>
                    <dd className="mt-2 text-xs leading-relaxed text-ink/80">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
