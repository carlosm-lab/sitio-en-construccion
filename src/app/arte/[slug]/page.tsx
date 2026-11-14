import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  LockOpen,
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
  const title = `${artwork.title} — ${catName} y Prompt IA`;
  const description = `Ficha técnica, parámetros de renderizado y vista previa de "${artwork.title}". Desbloquea el archivo master 4K sin marca de agua, el prompt completo y toda la biblioteca con el Pase Total de $25 USD.`;

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
    name: `${artwork.title} + Pase de Acceso Total ArteDigital.click`,
    image: artwork.watermarked_url,
    description:
      'Archivo digital 4K sin marca de agua, prompt completo verificado y acceso vitalicio a toda la biblioteca ArteDigital.click.',
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
              src={displayImageUrl}
              alt={artwork.alt_text}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1.5 text-xs font-semibold text-canvas">
              {isUnlocked ? (
                <>
                  <LockOpen className="h-3.5 w-3.5 text-surface" />
                  <span>Archivo Master 4K Sin Marca</span>
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
                  Acceso Total Desbloqueado
                </span>
              )}
            </div>

            <h1 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              {artwork.title}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {isUnlocked
                ? `${artwork.alt_text}. Estás visualizando la versión Master 4K desbloqueada sin marca de agua junto con el prompt íntegro.`
                : `${artwork.alt_text}. Esta pieza forma parte de la biblioteca ArteDigital.click; con el Pase de Acceso Total obtienes el archivo master en resolución 4K sin marca de agua, el prompt completo y todo el catálogo del sitio.`}
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
                {isUnlocked
                  ? 'Prompt de Ingeniería Visual Completo (Desbloqueado)'
                  : 'Prompt de Ingeniería Visual'}
              </h2>
              {isUnlocked ? (
                <div className="mt-2 rounded-2xl border-2 border-ink bg-white p-5">
                  <p className="font-mono text-xs leading-relaxed text-ink">
                    {fullArt.prompt_full || artwork.prompt_preview}
                  </p>
                </div>
              ) : (
                <div className="relative mt-2 overflow-hidden rounded-2xl border border-ink/20 bg-surface/65 p-5">
                  <p className="text-xs font-medium text-ink/80">
                    Extracto inicial:{' '}
                    <span className="font-mono text-ink">{artwork.prompt_preview}</span>
                  </p>
                  <div className="mt-3 rounded-xl border border-ink/15 bg-canvas/90 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>
                        La estructura completa del prompt (óptica, iluminación,
                        semillas y parámetros avanzados) se desbloquea con tu Pase
                        de Acceso Total.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {isUnlocked ? (
            <ArtworkDetailUnlockedActions
              artworkId={artwork.id}
              promptFull={fullArt.prompt_full || artwork.prompt_preview}
            />
          ) : (
            <div className="mt-8 rounded-2xl border-2 border-ink bg-surface p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/70">
                    Pase de Acceso Total Vitalicio
                  </p>
                  <p className="font-serif text-2xl font-semibold text-ink">
                    Incluye esta obra + toda la biblioteca
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
                  Descarga de TODAS las obras en 4K sin marca de agua.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  Acceso ilimitado a todos los prompts exactos y manuales PDF.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  Vinculación directa en 1 clic con tu cuenta de Google.
                </li>
              </ul>

              <div className="mt-5">
                <UnlockPrimaryButton
                  artworkTitle={artwork.title}
                  label="Obtener Pase de Acceso Total — $25 USD"
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
            Otras piezas en {catMeta?.name}
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
                      className="object-cover"
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
