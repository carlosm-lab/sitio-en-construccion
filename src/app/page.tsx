import React from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  Check,
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  LockOpen,
  Palette,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  getFullArtworksWithSignedUrls,
  getPublicArtworks,
} from '@/lib/data-store';
import { CATEGORIES, MEMBERSHIP_PRICE_USD, SITE_URL } from '@/lib/constants';
import { resolveServerAccess } from '@/lib/vip-auth';
import { GalleryExplorer } from '@/components/GalleryExplorer';
import { UnlockPrimaryButton } from '@/components/HeroTriggerButtons';
import { PricingSection } from '@/components/PricingSection';

export const dynamic = 'force-dynamic';

const FAQ_ITEMS = [
  {
    q: '¿El pago de $25 USD es por cada imagen o desbloquea toda la galería?',
    a: 'Es un único pago de $25.00 USD por acceso ilimitado y vitalicio a TODA la galería: incluye la descarga de todas las obras en alta resolución nativa 4K sin marca de agua, sus fichas artísticas completas y todas las nuevas obras que se agreguen en el futuro, sin ninguna mensualidad ni cargo recurrente.',
  },
  {
    q: '¿Cómo inicio sesión después de realizar mi compra?',
    a: 'Utilizamos autenticación directa con Google OAuth. No necesitas recordar contraseñas ni códigos: simplemente haz clic en "Acceso Miembros" o "Entrar con Google" usando tu correo de Google y todo el catálogo quedará desbloqueado inmediatamente.',
  },
  {
    q: '¿En qué formato y resolución se entregan las obras descargables?',
    a: 'Las obras master se entregan en su formato original de máxima calidad (PNG, JPG o WEBP en resolución 4K nativa de hasta 4096×5120px) completamente limpias de marcas de agua y listas para impresión o uso digital profesional.',
  },
  {
    q: '¿Puedo utilizar las obras en proyectos comerciales y de clientes?',
    a: 'Sí. Tu Pase de Acceso Total incluye una licencia comercial y editorial libre de regalías de por vida para proyectos personales, campañas publicitarias, sitios web, diseño editorial, portadas y productos de clientes.',
  },
];

export default async function HomePage() {
  const access = await resolveServerAccess();
  const isUnlocked = access.hasFullAccess;

  const artworks = isUnlocked
    ? await getFullArtworksWithSignedUrls()
    : await getPublicArtworks();

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Pase de Acceso Total Vitalicio — Galería de Arte Digital y Fotografía 4K ArteDigital.click',
    description:
      'Acceso vitalicio todo-en-uno a obras de arte digital y fotografía editorial en resolución 4K nativa sin marca de agua y con licencia comercial completa.',
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
          VISTA PARA USUARIOS CON PASE TOTAL ACTIVO (Cero anuncios de compra)
         ===================================================================== */}
      {isUnlocked ? (
        <section className="rounded-3xl border-2 border-ink bg-surface p-6 sm:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/25 bg-canvas px-3.5 py-1 text-xs font-semibold text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Pase de Acceso Total Activo
              </div>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
                Galería Completa en Resolución 4K Desbloqueada
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                Tu cuenta tiene acceso permanente habilitado. Todas las piezas en
                alta resolución sin marca de agua y sus fichas artísticas están listas
                para descargar en un clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/vip"
                className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Ir a Mi Biblioteca 4K</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* ===================================================================
           VISTA PÚBLICA COMERCIAL (JERARQUÍA VISUAL CRO & BAYMARD COMPLIANT)
           =================================================================== */
        <>
          {/* 1. HERO PRINCIPAL DE ALTA CONVERSIÓN */}
          <section className="relative overflow-hidden rounded-3xl border border-ink/15 bg-gradient-to-b from-surface/90 via-surface/60 to-canvas px-6 py-14 sm:px-12 sm:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-4 py-1.5 text-xs font-semibold text-ink shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Banco Curado de Arte Digital · Descarga Inmediata en 4K
              </div>

              <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Obras Digitales Únicas y Fotografía de Alta Gama en Resolución 4K
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink/85 sm:text-lg">
                Accede a una galería artística curada con archivos master sin compresión ni marcas de agua. Una sola inversión para creadores, diseñadores y directores de arte. Sin suscripciones mensuales.
              </p>

              {/* Botón Primario de Conversión y Enlace a la Galería (Refactoring UI: 1 Primary CTA + 1 Anchor Link) */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <UnlockPrimaryButton label="Obtener Pase Total Vitalicio — $25 USD" />
                <a
                  href="#galeria"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/20 bg-canvas/80 px-5 py-3.5 text-sm font-semibold text-ink/80 transition-colors hover:border-accent hover:text-accent"
                >
                  <ArrowDown className="h-4 w-4" />
                  <span>Explorar Galería ↓</span>
                </a>
              </div>

              <p className="mt-4 text-xs font-medium text-ink/70">
                ✓ Pago único de $25.00 USD · ✓ Licencia Comercial Vitalicia · ✓ Checkout Seguro PayPal
              </p>

              {/* Barra de Estadísticas y Confianza */}
              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-ink/15 pt-8 sm:grid-cols-4">
                <div className="rounded-xl border border-ink/10 bg-canvas/80 p-3.5 text-center">
                  <span className="block font-serif text-2xl font-bold text-accent">Master 4K</span>
                  <span className="text-[11px] font-medium text-ink/75">Hasta 4096×5120px</span>
                </div>
                <div className="rounded-xl border border-ink/10 bg-canvas/80 p-3.5 text-center">
                  <span className="block font-serif text-2xl font-bold text-accent">Sin Marcas</span>
                  <span className="text-[11px] font-medium text-ink/75">Archivos Originales</span>
                </div>
                <div className="rounded-xl border border-ink/10 bg-canvas/80 p-3.5 text-center">
                  <span className="block font-serif text-2xl font-bold text-accent">Ilimitada</span>
                  <span className="text-[11px] font-medium text-ink/75">Licencia Comercial</span>
                </div>
                <div className="rounded-xl border border-ink/10 bg-canvas/80 p-3.5 text-center">
                  <span className="block font-serif text-2xl font-bold text-accent">$25 USD</span>
                  <span className="text-[11px] font-medium text-ink/75">Pago Único Vitalicio</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. PILARES DE VALOR DEL PRODUCTO ÚNICO */}
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                1. Obras Master en 4K Nativo
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Descarga directa e ilimitada de cada pieza en resolución original de hasta 5120px, limpias de marcas de agua y listas para impresión en gran formato, branding o pantallas de alta densidad.
              </p>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <Palette className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                2. Ficha Artística y Dirección Visual
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Cada obra incluye su desglose técnico: relación de aspecto, paleta cromática dominante, esquema de composición y dirección de arte detallada.
              </p>
            </div>

            <div className="rounded-2xl border border-ink/15 bg-canvas p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/15 bg-surface text-accent">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                3. Licencia Comercial Vitalicia
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-ink/80">
                Utiliza las obras en proyectos comerciales, portadas, publicidad, diseño web y productos impresos sin pagar regalías extras ni renovar suscripciones.
              </p>
            </div>
          </section>
        </>
      )}

      {/* 3. ACCESOS RÁPIDOS POR GÉNERO ARTÍSTICO */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="Colecciones por género">
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
      <section id="galeria" className="mt-14 scroll-mt-24">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {isUnlocked ? 'Catálogo Master Desbloqueado' : 'Galería Curada'}
            </span>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">
              {isUnlocked
                ? 'Obras en Resolución 4K Desbloqueadas'
                : 'Explora las Obras y Fichas de Estilo'}
            </h2>
          </div>
          <p className="text-xs text-ink/75">
            {isUnlocked
              ? 'Descarga el archivo master 4K directamente desde cada tarjeta.'
              : 'Selecciona cualquier obra para revisar su ficha artística o desbloquear todo el catálogo.'}
          </p>
        </div>

        <GalleryExplorer artworks={artworks} serverUnlocked={isUnlocked} />
      </section>

      {/* =====================================================================
          5. SECCIÓN DE INVERSIÓN Y PREGUNTAS FRECUENTES (Visitantes)
         ===================================================================== */}
      {!isUnlocked && (
        <>
          {/* Cómo Funciona en 3 Pasos Simples */}
          <section className="mt-16">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Flujo Directo y Simple
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
                  Sin contraseñas que olvidar. Tu acceso se vincula directamente a tu correo de Google mediante OAuth oficial para entrar en 1 clic.
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
                  Un solo pago desbloquea toda la galería de forma vitalicia. No cobramos por imagen individual ni existen mensualidades recurrentes.
                </p>
              </div>

              <div className="rounded-2xl border border-ink/15 bg-surface/65 p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-mono text-xs font-bold text-canvas">
                  03
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold text-ink">
                  Desbloqueo inmediato en 4K
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  Al instante desaparecen todos los avisos de compra y se habilita la descarga directa en resolución 4K nativa de toda la colección.
                </p>
              </div>
            </div>
          </section>

          {/* Sección de Inversión y Comparativa (#precios) */}
          <PricingSection />

          {/* Preguntas Frecuentes */}
          <section className="mt-20 rounded-3xl border border-ink/15 bg-canvas p-8 sm:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
                <HelpCircle className="h-3.5 w-3.5 text-accent" />
                Resolución de Dudas
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
                Preguntas Frecuentes
              </h2>
              <p className="mt-2 text-sm text-ink/75">
                Todo lo que necesitas saber sobre el Pase Total, los formatos 4K y la licencia comercial.
              </p>
            </div>

            <dl className="mx-auto mt-10 max-w-3xl space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl border border-ink/15 bg-surface/50 p-6"
                >
                  <dt className="font-serif text-lg font-semibold text-ink">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-xs leading-relaxed text-ink/80 sm:text-sm">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
