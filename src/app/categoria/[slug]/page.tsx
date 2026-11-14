import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Layers, ShieldCheck } from 'lucide-react';
import {
  getFullArtworksWithSignedUrls,
  getPublicArtworks,
} from '@/lib/data-store';
import { CATEGORY_MAP, SITE_URL } from '@/lib/constants';
import { resolveServerAccess } from '@/lib/vip-auth';
import { ArtworkCategory } from '@/types';
import { GalleryExplorer } from '@/components/GalleryExplorer';
import { UnlockPrimaryButton } from '@/components/HeroTriggerButtons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const meta = CATEGORY_MAP[params.slug as ArtworkCategory];
  if (!meta) {
    return { title: 'Categoría no encontrada' };
  }

  return {
    title: meta.seoTitle,
    description: meta.seoDescription,
    alternates: {
      canonical: `${SITE_URL}/categoria/${meta.slug}`,
    },
    openGraph: {
      title: meta.seoTitle,
      description: meta.seoDescription,
      url: `${SITE_URL}/categoria/${meta.slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const categorySlug = params.slug as ArtworkCategory;
  const meta = CATEGORY_MAP[categorySlug];
  if (!meta) {
    notFound();
  }

  const access = await resolveServerAccess();
  const isUnlocked = access.hasFullAccess;

  const artworks = isUnlocked
    ? await getFullArtworksWithSignedUrls(categorySlug)
    : await getPublicArtworks(categorySlug);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.name,
    description: meta.seoDescription,
    url: `${SITE_URL}/categoria/${meta.slug}`,
    numberOfItems: artworks.length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/75 hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al catálogo completo
      </Link>

      <header className="mt-4 rounded-3xl border border-ink/15 bg-surface/75 p-8 sm:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              {isUnlocked ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Colección Desbloqueada en 4K
                </>
              ) : (
                <>
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  Categoría Curada
                </>
              )}
            </span>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-ink sm:text-5xl">
              {meta.name}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/80 sm:text-base">
              {meta.seoDescription}
            </p>
          </div>

          {!isUnlocked && (
            <UnlockPrimaryButton label="Obtener Pase de Acceso Total — $25 USD" />
          )}
        </div>
      </header>

      <GalleryExplorer
        artworks={artworks}
        initialCategory={categorySlug}
        showFilters={false}
        serverUnlocked={isUnlocked}
      />
    </div>
  );
}
