'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  LockOpen,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

export function UnlockPrimaryButton({
  label = 'Obtener Pase de Acceso Total — $25 USD',
  artworkTitle,
  className = '',
  hideWhenUnlocked = true,
}: {
  label?: string;
  artworkTitle?: string;
  className?: string;
  hideWhenUnlocked?: boolean;
}) {
  const { openCheckout, hasFullAccess } = useGalleryModal();

  if (hasFullAccess && hideWhenUnlocked) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openCheckout(artworkTitle)}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${className}`}
    >
      <LockOpen className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export function MemberAccessButton(_props?: { className?: string }) {
  // Eliminado componente redundante de acceso dual para mantener una única llamada a la acción limpia
  return null;
}

export function ManualCardLockAction({
  manualId,
  manualTitle,
  format,
  pagesCount,
  serverUnlocked = false,
}: {
  manualId?: string;
  manualTitle: string;
  format: string;
  pagesCount: number;
  serverUnlocked?: boolean;
}) {
  const { hasFullAccess } = useGalleryModal();
  const unlocked = Boolean(serverUnlocked || hasFullAccess);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadManual = async () => {
    if (!manualId) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/vip/download?type=manual&id=${encodeURIComponent(manualId)}&mode=json`,
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

  if (unlocked && manualId) {
    return (
      <button
        type="button"
        onClick={handleDownloadManual}
        disabled={downloading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        <span>
          Descargar {manualTitle ? `(${format} · ${pagesCount} págs.)` : format}
        </span>
      </button>
    );
  }

  return (
    <div className="mt-5 flex items-center justify-between rounded-xl border border-ink/15 bg-surface/65 px-3.5 py-2.5 text-xs font-semibold text-ink/80">
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
        Incluido en el Pase Total
      </span>
      <span className="font-mono text-[11px] text-ink/65">
        {format} · {pagesCount} págs.
      </span>
    </div>
  );
}

export function ArtworkDetailUnlockedActions({
  artworkId,
  promptFull,
}: {
  artworkId: string;
  promptFull: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(promptFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    fetch('/api/vip/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: artworkId,
        resourceType: 'prompt_copy',
      }),
    }).catch(() => {});
  };

  const handleDownloadArtwork = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/vip/download?type=artwork&id=${encodeURIComponent(artworkId)}&mode=json`,
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
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={handleCopyPrompt}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/25 bg-surface px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-blue"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-accent" />
            Prompt Copiado al Portapapeles
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-accent" />
            Copiar Prompt Exacto
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleDownloadArtwork}
        disabled={downloading}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Descargar Archivo Master 4K
      </button>
    </div>
  );
}
