'use client';

import React from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useGalleryModal } from './GalleryContext';
import { GoogleSignInButton } from './GoogleSignInButton';

export function MemberLoginModal() {
  const { isLoginOpen, closeLogin, openCheckout, hasFullAccess } = useGalleryModal();

  if (!isLoginOpen || hasFullAccess) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-login-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-ink/25 bg-canvas p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={closeLogin}
          aria-label="Cerrar ventana"
          className="absolute right-4 top-4 rounded-lg border border-ink/15 bg-surface p-1.5 text-ink hover:bg-ink hover:text-canvas"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          Autenticación Segura con Google
        </div>

        <h2
          id="member-login-title"
          className="mt-3 font-serif text-3xl font-semibold text-ink"
        >
          Entrar con Google
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-ink/80">
          Conecta tu cuenta de Google en un clic para desbloquear automáticamente
          todas las obras 4K, prompts y manuales asociados a tu Pase Total.
        </p>

        <div className="mt-6">
          <GoogleSignInButton nextPath="/vip" label="Continuar con Google" />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-ink/15 pt-4 text-xs text-ink/75">
          <span>¿Aún no tienes el Pase de Acceso Total?</span>
          <button
            type="button"
            onClick={() => openCheckout()}
            className="font-semibold text-accent underline"
          >
            Obtener Pase Total — $25 USD
          </button>
        </div>
      </div>
    </div>
  );
}
