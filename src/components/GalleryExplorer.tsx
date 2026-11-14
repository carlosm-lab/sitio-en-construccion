'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Search } from 'lucide-react';
import { ArtworkCategory, ArtworkFull, ArtworkPublic } from '@/types';
import { CATEGORIES } from '@/lib/constants';
import { ArtworkCard } from './ArtworkCard';

interface GalleryExplorerProps {
  artworks: Array<ArtworkPublic | ArtworkFull>;
  initialCategory?: ArtworkCategory | 'all';
  showFilters?: boolean;
  serverUnlocked?: boolean;
}

export function GalleryExplorer({
  artworks,
  initialCategory = 'all',
  showFilters = true,
  serverUnlocked = false,
}: GalleryExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ArtworkCategory | 'all'>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q');
      if (qParam) {
        setSearchQuery(qParam);
      }
    }
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return artworks.filter((item) => {
      const catMatch =
        selectedCategory === 'all' || item.category === selectedCategory;
      const queryMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.prompt_preview.toLowerCase().includes(q) ||
        item.alt_text.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [artworks, selectedCategory, searchQuery]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = displayed.length < filtered.length;

  return (
    <section id="galeria" className="mt-10">
      {showFilters && (
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-ink/15 bg-surface/70 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-ink text-canvas'
                  : 'border border-ink/15 bg-canvas text-ink hover:bg-surface-blue'
              }`}
            >
              Todas ({artworks.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-ink text-canvas'
                    : 'border border-ink/15 bg-canvas text-ink hover:bg-surface-blue'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/55" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estilo, lente o tema..."
              aria-label="Buscar obras en el catálogo"
              className="w-full rounded-lg border border-ink/20 bg-canvas py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      )}

      {artworks.length === 0 ? (
        <div className="rounded-3xl border border-ink/15 bg-surface/60 p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-accent" />
          <h3 className="mt-4 font-serif text-2xl font-semibold text-ink">
            Colección Editorial en Curaduría
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink/75">
            Estamos incorporando nuevas obras digitales en alta resolución y
            parámetros verificados de iluminación a esta colección.
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-ink/15 bg-surface/50 p-12 text-center">
          <p className="font-serif text-xl font-medium text-ink">
            No encontramos obras para tu búsqueda actual.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-canvas"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                serverUnlocked={serverUnlocked}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 9)}
                className="rounded-xl border border-ink/25 bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-canvas"
              >
                Cargar más obras ({filtered.length - displayed.length} disponibles)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
