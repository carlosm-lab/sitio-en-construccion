'use client';

import React from 'react';
import { KeyRound, Lock, LockOpen, ShieldCheck } from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

export function UnlockPrimaryButton({
  label = 'Desbloquear Acceso Total Vitalicio — $20 USD',
  artworkTitle,
  className = '',
}: {
  label?: string;
  artworkTitle?: string;
  className?: string;
}) {
  const { openCheckout, isVipActive } = useGalleryModal();
  return (
    <button
      type="button"
      onClick={() => openCheckout(artworkTitle)}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <LockOpen className="h-4 w-4" />
      <span>
        {isVipActive ? 'Ir a Biblioteca VIP Desbloqueada' : label}
      </span>
    </button>
  );
}

export function MemberAccessButton({ className = '' }: { className?: string }) {
  const { openLogin, isVipActive, vipLicenseCode } = useGalleryModal();
  return (
    <button
      type="button"
      onClick={openLogin}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-ink/25 bg-surface px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-blue ${className}`}
    >
      {isVipActive ? (
        <>
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Licencia Activa: {vipLicenseCode || 'Área VIP'}</span>
        </>
      ) : (
        <>
          <KeyRound className="h-4 w-4 text-accent" />
          <span>Ya tengo código AD-XXXX-XXXX</span>
        </>
      )}
    </button>
  );
}

export function ManualCardLockAction({
  manualTitle,
  format,
  pagesCount,
}: {
  manualTitle: string;
  format: string;
  pagesCount: number;
}) {
  const { openCheckout, isVipActive } = useGalleryModal();

  return (
    <button
      type="button"
      onClick={() => openCheckout(manualTitle)}
      className="relative mt-5 w-full cursor-pointer overflow-hidden rounded-xl border border-ink/15 bg-surface/75 p-3 text-left transition-colors hover:border-accent"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-ink/70">
        <span className="truncate pr-2">{manualTitle}</span>
        <span className="shrink-0">
          {format} · {pagesCount} págs.
        </span>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-canvas/90 py-1.5 text-xs font-semibold text-ink">
        {isVipActive ? (
          <>
            <LockOpen className="h-3.5 w-3.5 text-accent" />
            <span>Disponible en tu Panel VIP — Descargar</span>
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5 text-accent" />
            <span>Desbloquear Guía en Área VIP ($20 USD)</span>
          </>
        )}
      </div>
    </button>
  );
}
