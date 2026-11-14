import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  FileText,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getManuals, getPublicArtworks } from '@/lib/data-store';
import { CATEGORIES, SITE_URL } from '@/lib/seed-data';
import { GalleryExplorer } from '@/components/GalleryExplorer';
import {
  MemberAccessButton,
  UnlockPrimaryButton,
} from '@/components/HeroTriggerButtons';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [artworks, manuals] = await Promise.all([
    getPublicArtworks(),
    getManuals(false),
  ]);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Licencia de Acceso Total - Librería y Prompts ArteDigital.click',
    description:
      'Acceso vitalicio a más de 1,000 obras digitales generadas con IA sin marca de agua, prompts de ingeniería visual y manuales técnicos de consistencia de personajes.',
    brand: {
      '@type': 'Brand',
      name: 'ArteDigital.click',
    },
    offers: {
      '@type': 'Offer',
      url: SITE_URL,
      priceCurrency: 'USD',
      price: '20.00',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Hero Editorial Sobrio */}
      <section className="rounded-3xl border border-ink/15 bg-surface/55 px-6 py-12 sm:px-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-4 py-1.5 text-xs font-semibold text-ink">
            <Sparkles className="h-3.5 w-3.5" />
            Banco Curado de Arte IA · Entrega Digital Inmediata
          </div>

          <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Banco Exclusivo de Arte IA, Prompts de Ingeniería Visual y Manuales
            de Consistencia
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
            Accede a nuestra galería editorial en expansión (+1,000 piezas en
            alta resolución sin marca de agua), prompts exactos con parámetros de
            lente y guías técnicas paso a paso para mantener personajes 100%
            consistentes.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <UnlockPrimaryButton />
            <MemberAccessButton />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-ink/75">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Pago único de $20.00 USD (sin suscripciones)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Licencia Vitalicia AD-XXXX-XXXX al instante
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Checkout seguro vía PayPal
            </span>
          </div>
        </div>
      </section>

      {/* Accesos SEO por Categoría */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/categoria/${cat.slug}`}
            className="group rounded-2xl border border-ink/15 bg-surface/40 p-5 transition-colors hover:border-ink/35 hover:bg-surface/75"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl font-semibold text-ink">
                {cat.name}
              </span>
              <Layers className="h-4 w-4 text-ink/70 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              {cat.shortDesc}
            </p>
          </Link>
        ))}
      </section>

      {/* Muro Público de Obras (Marca de agua + Prompt difuminado) */}
      <div className="mt-14">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ink/65">
              Vista Previa Pública
            </span>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">
              Galería Editorial con Marca de Agua
            </h2>
          </div>
          <p className="text-xs text-ink/75">
            Haz clic en cualquier obra para desbloquear el archivo master 4K y el
            prompt completo.
          </p>
        </div>

        <GalleryExplorer artworks={artworks} />
      </div>

      {/* Sección de Manuales Técnicos (Bloqueados en Vista Pública) */}
      <section className="mt-16 rounded-3xl border border-ink/15 bg-surface/50 p-6 sm:p-10">
        <div className="flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              <BookOpen className="h-3.5 w-3.5" />
              Biblioteca Técnica Incluida
            </span>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
              Manuales de Consistencia de Personajes e Ingeniería Visual
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-ink/75">
              Incluidos sin costo adicional dentro de tu acceso único de $20 USD.
              Descarga inmediata en el Área VIP.
            </p>
          </div>
          <UnlockPrimaryButton label="Desbloquear Manuales ($20 USD)" />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {manuals.map((manual) => (
            <div
              key={manual.id}
              className="flex flex-col justify-between rounded-2xl border border-ink/15 bg-canvas p-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-ink/70">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <FileText className="h-3.5 w-3.5" />
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

              <div className="relative mt-5 overflow-hidden rounded-xl border border-ink/15 bg-surface/60 p-3">
                <div className="prompt-blurred flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Descargar_Manual_VIP.pdf</span>
                  <span>4.8 MB</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-surface/65">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Lock className="h-3.5 w-3.5" />
                    Bloqueado (Solo VIP)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
