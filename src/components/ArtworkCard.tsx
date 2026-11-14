'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Lock, Sparkles } from 'lucide-react';
import { ArtworkPublic } from '@/types';
import { CATEGORY_MAP } from '@/lib/seed-data';
import { useGalleryModal } from './GalleryContext';

interface ArtworkCardProps {
  artwork: ArtworkPublic;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const { openCheckout } = useGalleryModal();
  const catMeta = CATEGORY_MAP[artwork.category];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-surface/55 transition-all hover:border-ink/35">
      {/* Imagen comprimida con marca de agua visible */}
      <div
        onClick={() => openCheckout(artwork.title)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openCheckout(artwork.title);
          }
        }}
        className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-surface select-none"
      >
        <Image
          src={artwork.watermarked_url}
          alt={artwork.alt_text}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Patrón repetitivo de marca de agua */}
        <div className="watermark-pattern pointer-events-none absolute inset-0" />

        {/* Marca de agua central diagonal */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-24 rounded-md border border-canvas/50 bg-ink/45 px-3.5 py-1.5 text-center backdrop-blur-[2px]">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-canvas">
              ArteDigital.click - Vista Previa
            </span>
          </div>
        </div>

        {/* Badge Superior */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-ink/20 bg-canvas/90 px-2.5 py-1 text-[11px] font-semibold text-ink">
          <Sparkles className="h-3 w-3" />
          <span>{catMeta?.name || artwork.category}</span>
        </div>

        {/* Badge Candado Inferior */}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/90 px-2.5 py-1 text-[11px] font-semibold text-canvas">
          <Lock className="h-3 w-3" />
          <span>4K Sin Marca</span>
        </div>
      </div>

      {/* Cuerpo Editorial */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/arte/${artwork.slug}`}
              className="font-serif text-xl font-semibold leading-snug text-ink hover:underline"
            >
              {artwork.title}
            </Link>
            <Link
              href={`/arte/${artwork.slug}`}
              aria-label={`Ver ficha técnica de ${artwork.title}`}
              className="mt-0.5 shrink-0 rounded-md border border-ink/15 bg-canvas p-1.5 text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/75">
            {artwork.prompt_preview}
          </p>

          {/* Bloque de Prompt Difuminado (Blur + Candado) */}
          <div
            onClick={() => openCheckout(artwork.title)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCheckout(artwork.title);
              }
            }}
            className="relative mt-3.5 cursor-pointer overflow-hidden rounded-xl border border-ink/15 bg-canvas p-3"
          >
            <p className="prompt-blurred font-mono text-[11px] leading-relaxed text-ink">
              --cref https://cdn.artedigital.click/anchor.png --cw 90 --stylize 250
              Hasselblad medium format 85mm f/1.4 pastel alabaster studio light --v 6.1
            </p>
            <div className="absolute inset-0 flex items-center justify-center bg-surface/55 backdrop-blur-[1px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/25 bg-canvas px-3 py-1 text-[11px] font-semibold text-ink">
                <Lock className="h-3 w-3" />
                Desbloquear Prompt Exacto
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCheckout(artwork.title)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/25 bg-canvas px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-canvas"
        >
          <Lock className="h-3.5 w-3.5" />
          Desbloquear Original + Prompt ($20 USD)
        </button>
      </div>
    </article>
  );
}
