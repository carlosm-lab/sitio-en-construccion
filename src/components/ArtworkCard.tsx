'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Lock, LockOpen, Sliders, Sparkles } from 'lucide-react';
import { ArtworkPublic } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { useGalleryModal } from './GalleryContext';

interface ArtworkCardProps {
  artwork: ArtworkPublic;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const { openCheckout, isVipActive } = useGalleryModal();
  const catMeta = CATEGORY_MAP[artwork.category];
  const motor = artwork.render_params?.motor || 'IA Editorial';
  const aspecto = artwork.render_params?.aspecto || '4:5';
  const resolucion = artwork.render_params?.resolucion || 'Master 4K';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-surface-blue/70 transition-all hover:border-accent/60">
      {/* Vista previa con marca de agua integrada en el archivo */}
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

        {/* Badge Categoría */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>{catMeta?.name || artwork.category}</span>
        </div>

        {/* Badge Estado Inferior */}
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/90 px-2.5 py-1 text-[11px] font-semibold text-canvas">
          {isVipActive ? (
            <>
              <LockOpen className="h-3 w-3 text-surface" />
              <span>Disponible en VIP</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-surface" />
              <span>{resolucion} Sin Marca</span>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo Editorial */}
      <div className="flex flex-1 flex-col justify-between bg-canvas/75 p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/arte/${artwork.slug}`}
              className="font-serif text-xl font-semibold leading-snug text-ink hover:text-accent hover:underline"
            >
              {artwork.title}
            </Link>
            <Link
              href={`/arte/${artwork.slug}`}
              aria-label={`Ver ficha técnica de ${artwork.title}`}
              className="mt-0.5 shrink-0 rounded-md border border-ink/15 bg-surface p-1.5 text-ink transition-colors hover:bg-accent hover:text-white"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink/75">
            {artwork.prompt_preview}
          </p>

          {/* Metadatos reales de la obra + Indicador de Prompt Protegido */}
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
            className="mt-3.5 cursor-pointer rounded-xl border border-ink/15 bg-surface/65 p-3 transition-colors hover:border-accent"
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono font-semibold text-ink/80">
              <span className="inline-flex items-center gap-1">
                <Sliders className="h-3 w-3 text-accent" />
                {motor}
              </span>
              <span>
                {aspecto} · {resolucion}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-ink/15 bg-canvas px-3 py-1.5 text-[11px] font-semibold text-ink">
              {isVipActive ? (
                <>
                  <LockOpen className="h-3 w-3 text-accent" />
                  <span>Abrir Prompt Completo en Área VIP</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-accent" />
                  <span>Prompt Íntegro Protegido (Solo Miembros VIP)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openCheckout(artwork.title)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/20 bg-surface px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:bg-accent hover:text-white"
        >
          {isVipActive ? (
            <>
              <LockOpen className="h-3.5 w-3.5" />
              Descargar Master + Prompt en /vip
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              Desbloquear Original + Prompt ($20 USD)
            </>
          )}
        </button>
      </div>
    </article>
  );
}
