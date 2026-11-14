import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Lock,
  LockOpen,
  Palette,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  getFullArtworkBySlugWithSignedUrl,
  getFullArtworksWithSignedUrls,
  getPublicArtworkBySlug,
  getPublicArtworks,
} from '@/lib/data-store';
import { CATEGORY_MAP, MEMBERSHIP_PRICE_USD, SITE_URL } from '@/lib/constants';
import { resolveServerAccess } from '@/lib/vip-auth';
import {
  ArtworkDetailUnlockedActions,
  UnlockPrimaryButton,
} from '@/components/HeroTriggerButtons';
import { ArtworkFull } from '@/types';

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
  const title = `${artwork.title} — ${catName} en 4K`;
  const description = `Ficha artística, composición visual y descarga master de "${artwork.title}". Desbloquea el archivo master 4K sin marca de agua y toda la galería con el Pase Total de $25 USD.`;

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
  const access = await resolveServerAccess();
  const isUnlocked = access.hasFullAccess;

  const artwork = isUnlocked
    ? await getFullArtworkBySlugWithSignedUrl(params.slug)
    : await getPublicArtworkBySlug(params.slug);

  if (!artwork) {
    notFound();
  }

  const fullArt = artwork as Partial<ArtworkFull>;
  const displayImageUrl =
    isUnlocked && fullArt.high_res_signed_url
      ? fullArt.high_res_signed_url
      : artwork.watermarked_url;

  const catMeta = CATEGORY_MAP[artwork.category];
  const relatedList = isUnlocked
    ? await getFullArtworksWithSignedUrls(artwork.category)
    : await getPublicArtworks(artwork.category);
  const related = relatedList
    .filter((a) => a.slug !== artwork.slug)
    .slice(0, 3);

  const imageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: artwork.title,
    description: artwork.alt_text,
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
    name: `${artwork.title} + Pase de Acceso Total ArteDigital.click`,
    image: artwork.watermarked_url,
    description:
      'Archivo digital master en resolución nativa 4K sin marca de agua y licencia comercial completa de por vida.',
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/arte/${artwork.slug}`,
      priceCurrency: 'USD',
      price: MEMBERSHIP_PRICE_USD,
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
      {!isUnlocked && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink/75">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" />
          Galería
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
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-ink/20 bg-surface select-none shadow-sm">
            <Image
              src={displayImageUrl}
              alt={artwork.alt_text}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-xs font-semibold text-canvas shadow">
              {isUnlocked ? (
                <>
                  <LockOpen className="h-3.5 w-3.5 text-surface" />
                  <span>Archivo Master 4K Desbloqueado</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-surface" />
                  <span>Vista Previa con Marca de Agua</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                {catMeta?.name}
              </span>
              {isUnlocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Acceso Total Activo
                </span>
              )}
            </div>

            <h1 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {artwork.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {isUnlocked
                ? `${artwork.alt_text}. Tienes acceso completo a la versión master en resolución 4K nativa sin marca de agua.`
                : `${artwork.alt_text}. Esta pieza forma parte de la galería ArteDigital.click; con el Pase de Acceso Total obtienes el archivo master en resolución 4K sin compresión y todo el catálogo del sitio.`}
            </p>

            {/* Parámetros de Composición y Dirección de Arte */}
            {renderParamsEntries.length > 0 && (
              <div className="mt-6 rounded-2xl border border-ink/15 bg-surface-blue/70 p-5">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink/80">
                  <Palette className="h-3.5 w-3.5 text-accent" />
                  Ficha de Composición y Estilo
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

            {/* Ficha Artística */}
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink/80">
                Dirección Artística y Detalles de la Obra
              </h2>
              <div className="mt-2 rounded-2xl border border-ink/15 bg-surface/60 p-5">
                <p className="text-xs leading-relaxed text-ink/85">
                  {artwork.prompt_preview || artwork.alt_text}
                </p>
                <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3 text-[11px] font-medium text-ink/70">
                  <span className="inline-flex items-center gap-1">
                    <FileCheck2 className="h-3.5 w-3.5 text-accent" />
                    Licencia Comercial Vitalicia
                  </span>
                  <span>·</span>
                  <span>Resolución Nativa 4K</span>
                  <span>·</span>
                  <span>Entrega Digital Inmediata</span>
                </div>
              </div>
            </div>
          </div>

          {isUnlocked ? (
            <ArtworkDetailUnlockedActions
              artworkId={artwork.id}
              compositionDetails={artwork.prompt_preview || artwork.alt_text}
            />
          ) : (
            <div className="mt-8 rounded-2xl border-2 border-ink bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/70">
                    Pase de Acceso Total Vitalicio
                  </p>
                  <p className="font-serif text-2xl font-semibold text-ink">
                    Desbloquea esta obra en 4K + Toda la Galería
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-accent">
                    $25 USD
                  </span>
                  <span className="block text-[10px] font-semibold uppercase text-ink/70">
                    Pago Único
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-ink/85">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  Descarga de TODAS las obras en resolución 4K sin marca de agua.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  Licencia de uso comercial y editorial ilimitada de por vida.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  Acceso directo en 1 clic con tu cuenta de Google.
                </li>
              </ul>

              <div className="mt-5">
                <UnlockPrimaryButton
                  artworkTitle={artwork.title}
                  label="Desbloquear con Pase Total — $25 USD"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink/15 pt-10">
          <h2 className="font-serif text-2xl font-semibold text-ink">
            Otras obras en {catMeta?.name}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {related.map((item) => {
              const relatedFull = item as Partial<ArtworkFull>;
              const relatedImg =
                isUnlocked && relatedFull.high_res_signed_url
                  ? relatedFull.high_res_signed_url
                  : item.watermarked_url;
              return (
                <Link
                  key={item.id}
                  href={`/arte/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-ink/15 bg-surface-blue/60 p-4 transition-colors hover:border-accent"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
                    <Image
                      src={relatedImg}
                      alt={item.alt_text}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-ink group-hover:underline">
                    {item.title}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
