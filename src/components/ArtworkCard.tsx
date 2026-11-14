'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Loader2,
  LockOpen,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { ArtworkFull, ArtworkPublic } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { useGalleryModal } from './GalleryContext';

interface ArtworkCardProps {
  artwork: ArtworkPublic | ArtworkFull;
  serverUnlocked?: boolean;
}

export function ArtworkCard({ artwork, serverUnlocked = false }: ArtworkCardProps) {
  const { hasFullAccess } = useGalleryModal();
  const unlocked = Boolean(serverUnlocked || hasFullAccess);
  const fullArtwork = artwork as Partial<ArtworkFull>;

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const catMeta = CATEGORY_MAP[artwork.category];
  const motor = artwork.render_params?.motor || 'IA Editorial';
  const aspecto = artwork.render_params?.aspecto || '4:5';
  const resolucion = artwork.render_params?.resolucion || 'Master 4K';

  const displayImageUrl =
    unlocked && fullArtwork.high_res_signed_url
      ? fullArtwork.high_res_signed_url
      : artwork.watermarked_url;

  const fullPromptText = fullArtwork.prompt_full || artwork.prompt_preview;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(fullPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);

    fetch('/api/vip/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: artwork.id,
        resourceType: 'prompt_copy',
      }),
    }).catch(() => {});
  };

  const handleDownloadMaster = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/vip/download?type=artwork&id=${encodeURIComponent(artwork.id)}&mode=json`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        if (data.filename) link.download = data.filename;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-surface-blue/70 transition-all hover:border-accent/60">
      <Link
        href={`/arte/${artwork.slug}`}
        className="relative aspect-[4/5] w-full overflow-hidden bg-surface select-none"
      >
        <Image
          src={displayImageUrl}
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
          {unlocked ? (
            <>
              <LockOpen className="h-3 w-3 text-surface" />
              <span>Master 4K Activo</span>
            </>
          ) : (
            <span>{resolucion}</span>
          )}
        </div>
      </Link>

      {/* Cuerpo Editorial */}
      <div className="flex flex-1 flex-col justify-between bg-canvas/80 p-5">
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

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-ink/10 bg-surface/60 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-ink/80">
            <span className="inline-flex items-center gap-1">
              <Sliders className="h-3 w-3 text-accent" />
              {motor}
            </span>
            <span>
              {aspecto} · {resolucion}
            </span>
          </div>

          {unlocked ? (
            <div className="mt-3 rounded-xl border border-ink/15 bg-white p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">
                Prompt Completo Desbloqueado
              </span>
              <p className="mt-1 line-clamp-3 font-mono text-[11px] leading-relaxed text-ink">
                {fullPromptText}
              </p>
            </div>
          ) : (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink/75">
              {artwork.prompt_preview}
            </p>
          )}
        </div>

        {unlocked ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/25 bg-surface px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-accent" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Prompt
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadMaster}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Descargar 4K
            </button>
          </div>
        ) : (
          <Link
            href={`/arte/${artwork.slug}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink/20 bg-surface/75 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:bg-surface"
          >
            <span>Ver Ficha Técnica y Parámetros</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
          </Link>
        )}
      </div>
    </article>
  );
}
