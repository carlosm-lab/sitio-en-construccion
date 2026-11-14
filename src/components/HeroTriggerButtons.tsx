'use client';

import React from 'react';
import { KeyRound, LockOpen } from 'lucide-react';
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
  const { openCheckout } = useGalleryModal();
  return (
    <button
      type="button"
      onClick={() => openCheckout(artworkTitle)}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <LockOpen className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export function MemberAccessButton({ className = '' }: { className?: string }) {
  const { openLogin } = useGalleryModal();
  return (
    <button
      type="button"
      onClick={openLogin}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-ink/25 bg-surface px-5 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-blue ${className}`}
    >
      <KeyRound className="h-4 w-4 text-accent" />
      <span>Ya tengo código AD-XXXX</span>
    </button>
  );
}
