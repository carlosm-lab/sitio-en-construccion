import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Lock, Sliders, Sparkles } from 'lucide-react';
import { getPublicArtworkBySlug, getPublicArtworks } from '@/lib/data-store';
import { CATEGORY_MAP, SITE_URL } from '@/lib/constants';
import { UnlockPrimaryButton } from '@/components/HeroTriggerButtons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const artwork = await getPublicArtworkBySlug(params.slug);
  if (!artwork) {
    return { title: 'Obra no encontrada' };
  }

  const catName = CATEGORY_MAP[artwork.category]?.name || artwork.category;
  const title = `${artwork.title} — ${catName} y Prompt IA`;
  const description = `Ficha técnica, parámetros de renderizado y vista previa de "${artwork.title}". Desbloquea el archivo master en alta resolución sin marca de agua y el prompt completo por $20 USD.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/arte/${artwork.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/arte/${artwork.slug}`,
      type: 'article',
      images: [
        {
          url: artwork.watermarked_url,
          alt: artwork.alt_text,
        },
      ],
    },
  };
}

export default async function ArtworkDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const artwork = await getPublicArtworkBySlug(params.slug);
  if (!artwork) {
    notFound();
  }

  const catMeta = CATEGORY_MAP[artwork.category];
  const related = (await getPublicArtworks(artwork.category))
    .filter((a) => a.slug !== artwork.slug)
    .slice(0, 3);

  const imageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: artwork.title,
    description: artwork.prompt_preview,
    contentUrl: artwork.watermarked_url,
    acquireLicensePage: `${SITE_URL}/arte/${artwork.slug}`,
    creditText: 'ArteDigital.click',
    creator: {
      '@type': 'Organization',
      name: 'ArteDigital.click',
    },
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${artwork.title} + Licencia Vitalicia ArteDigital.click`,
    image: artwork.watermarked_url,
    description:
      'Archivo digital 4K sin marca de agua, prompt completo verificado y acceso a toda la librería ArteDigital.click.',
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/arte/${artwork.slug}`,
      priceCurrency: 'USD',
      price: '20.00',
      availability: 'https://schema.org/InStock',
    },
  };

  const renderParamsEntries = Object.entries(artwork.render_params || {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink/75">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" />
          Inicio
        </Link>
        <span>/</span>
        <Link
          href={`/categoria/${artwork.category}`}
          className="hover:text-accent hover:underline"
        >
          {catMeta?.name || artwork.category}
        </Link>
        <span>/</span>
        <span className="text-ink">{artwork.title}</span>
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-ink/20 bg-surface select-none">
            <Image
              src={artwork.watermarked_url}
              alt={artwork.alt_text}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {catMeta?.name}
            </span>

            <h1 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {artwork.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {artwork.alt_text}. Vista previa comprimida protegida con marca de
              agua editorial. Al adquirir tu licencia vitalicia obtienes el archivo
              master en resolución completa y la ingeniería del prompt.
            </p>

            {renderParamsEntries.length > 0 && (
              <div className="mt-6 rounded-2xl border border-ink/15 bg-surface-blue/70 p-5">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/80">
                  <Sliders className="h-3.5 w-3.5 text-accent" />
                  Parámetros Técnicos de Renderizado
                </h2>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  {renderParamsEntries.map(([key, val]) => (
                    <div
                      key={key}
                      className="rounded-xl border border-ink/15 bg-canvas p-3"
                    >
                      <dt className="font-semibold uppercase tracking-wider text-ink/60">
                        {key}
                      </dt>
                      <dd className="mt-1 font-mono font-semibold text-ink">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink/80">
                Prompt de Ingeniería Visual (Protegido)
              </h2>
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-ink/20 bg-surface/65 p-5">
                <p className="text-xs font-medium text-ink/80">
                  Extracto público verificado:{' '}
                  <span className="font-mono text-ink">{artwork.prompt_preview}</span>
                </p>
                <div className="mt-3 rounded-xl border border-ink/15 bg-canvas/90 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>
                      El bloque de parámetros avanzados de cámara, iluminación y
                      consistencia está reservado para miembros con licencia activa
                      en el Área VIP.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-ink/25 bg-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/70">
                  Licencia Vitalicia Global
                </p>
                <p className="font-serif text-2xl font-semibold text-ink">
                  Desbloquea esta obra + toda la galería
                </p>
              </div>
              <span className="font-serif text-3xl font-bold text-accent">
                $20 USD
              </span>
            </div>

            <ul className="mt-4 space-y-1.5 text-xs text-ink/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                Descarga en alta resolución SIN marca de agua.
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                Acceso inmediato al prompt exacto, manuales PDF y futuras obras.
              </li>
            </ul>

            <div className="mt-5">
              <UnlockPrimaryButton
                artworkTitle={artwork.title}
                label="Desbloquear Master + Prompt Exacto ($20 USD)"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink/15 pt-10">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Otras piezas en {catMeta?.name}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/arte/${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-ink/15 bg-surface-blue/60 p-4 transition-colors hover:border-accent"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                  <Image
                    src={item.watermarked_url}
                    alt={item.alt_text}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold text-ink group-hover:underline">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
