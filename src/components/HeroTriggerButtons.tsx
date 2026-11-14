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

export function MemberAccessButton({ className = '' }: { className?: string }) {
  const { signInWithGoogle, hasFullAccess, googleUser } = useGalleryModal();

  if (hasFullAccess) {
    return null;
  }

  if (googleUser) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-ink/20 bg-surface px-4 py-2.5 text-xs font-semibold text-ink ${className}`}
      >
        <CheckCircle2 className="h-4 w-4 text-accent" />
        <span>Cuenta Google conectada: {googleUser.email}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center justify-center gap-2 text-xs text-ink/80 ${className}`}
    >
      <span>¿Ya tienes tu Pase Total o eres Admin?</span>
      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink/25 bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-accent hover:bg-surface"
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.23 1.16-3.25 0-6-2.2-6.98-5.15H1.01v3.14C3.05 21.2 7.24 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.02 14c-.25-.72-.39-1.5-.39-2.3 0-.8.14-1.58.39-2.3V6.26H1.01C.37 7.55 0 9.01 0 11.7s.37 4.15 1.01 5.44L5.02 14Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.79 0 3.4.62 4.67 1.83l3.5-3.5C18.07 1.19 15.3 0 12 0 7.24 0 3.05 2.8 1.01 6.86L5.02 10c.98-2.95 3.73-5.25 6.98-5.25Z"
          />
        </svg>
        <span>Entrar con Google</span>
      </button>
    </div>
  );
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
