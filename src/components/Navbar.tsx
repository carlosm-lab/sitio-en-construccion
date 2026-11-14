'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, LockOpen, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

export function Navbar() {
  const { openCheckout, openLogin, isVipActive, vipLicenseCode } = useGalleryModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-canvas/95 backdrop-blur-md no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/20 bg-surface text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <span className="block font-serif text-xl font-semibold tracking-tight leading-none">
              ArteDigital.click
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-ink/65">
              Galería &amp; Prompts IA
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Categorías principales">
          <Link
            href="/categoria/retratos-ia"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Retratos IA
          </Link>
          <Link
            href="/categoria/concept-art"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Concept Art
          </Link>
          <Link
            href="/categoria/guias-personajes"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Guías de Personajes
          </Link>
          <Link
            href="/vip"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Área VIP
          </Link>
        </nav>

        {/* Acciones */}
        <div className="hidden items-center gap-3 md:flex">
          {isVipActive ? (
            <>
              <Link
                href="/vip"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-surface px-3.5 py-2 font-mono text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {vipLicenseCode || 'VIP Activo'}
              </Link>
              <Link
                href="/vip"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-3.5 w-3.5" />
                Ir a Biblioteca VIP
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
              >
                <KeyRound className="h-3.5 w-3.5 text-accent" />
                Acceso Miembros
              </button>
              <button
                type="button"
                onClick={() => openCheckout()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-3.5 w-3.5" />
                Desbloquear Acceso — $20 USD
              </button>
            </>
          )}
        </div>

        {/* Toggle Móvil */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Abrir menú"
          className="inline-flex items-center justify-center rounded-lg border border-ink/20 bg-surface p-2 text-ink md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Menú Móvil */}
      {mobileOpen && (
        <div className="border-t border-ink/15 bg-canvas px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/categoria/retratos-ia"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Retratos IA
            </Link>
            <Link
              href="/categoria/concept-art"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Concept Art
            </Link>
            <Link
              href="/categoria/guias-personajes"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Guías de Personajes
            </Link>
            <Link
              href="/vip"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Área VIP
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-ink/15 pt-3">
              {isVipActive ? (
                <Link
                  href="/vip"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Ir a Biblioteca VIP ({vipLicenseCode})
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openLogin();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/20 bg-surface px-4 py-2.5 text-sm font-semibold text-ink"
                  >
                    <KeyRound className="h-4 w-4 text-accent" />
                    Acceso Miembros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openCheckout();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LockOpen className="h-4 w-4" />
                    Desbloquear Acceso Vitalicio — $20 USD
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
