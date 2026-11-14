'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  LockOpen,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

function GoogleGIcon() {
  return (
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
  );
}

export function Navbar() {
  const {
    openCheckout,
    hasFullAccess,
    isAdmin,
    googleUser,
    userEmail,
    signInWithGoogle,
    signOut,
  } = useGalleryModal();
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
              Banco de Arte IA &amp; Prompts
            </span>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
          <Link
            href="/#galeria"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Galería
          </Link>
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
            href="/#manuales"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Manuales
          </Link>
        </nav>

        {/* Acciones Desktop */}
        <div className="hidden items-center gap-2.5 md:flex">
          {hasFullAccess ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/25 bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-accent" />
                  Panel Admin
                </Link>
              )}
              <Link
                href="/vip"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                {isAdmin ? 'Biblioteca VIP' : 'Mi Biblioteca Activa'}
              </Link>
              <button
                type="button"
                onClick={signOut}
                title={userEmail ? `Cerrar sesión (${userEmail})` : 'Cerrar sesión'}
                className="inline-flex items-center gap-1 rounded-lg border border-ink/20 bg-canvas px-3 py-2 text-xs font-semibold text-ink/80 transition-colors hover:border-accent hover:text-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </>
          ) : googleUser ? (
            <>
              <span className="max-w-[180px] truncate rounded-lg border border-ink/15 bg-surface/80 px-3 py-2 text-xs font-medium text-ink">
                {googleUser.email}
              </span>
              <button
                type="button"
                onClick={() => openCheckout()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-3.5 w-3.5" />
                Obtener Pase Total
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-lg border border-ink/20 bg-canvas px-2.5 py-2 text-xs font-medium text-ink/75 hover:text-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="inline-flex items-center gap-2 rounded-lg border border-ink/25 bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-surface"
              >
                <GoogleGIcon />
                Entrar con Google
              </button>
              <button
                type="button"
                onClick={() => openCheckout()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-3.5 w-3.5" />
                Obtener Pase Total
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
          <div className="flex flex-col gap-2.5">
            <Link
              href="/#galeria"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Galería Completa
            </Link>
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
              href="/#manuales"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Manuales Técnicos
            </Link>

            <div className="mt-2 flex flex-col gap-2 border-t border-ink/15 pt-3">
              {hasFullAccess ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/25 bg-surface px-4 py-2.5 text-sm font-semibold text-ink"
                    >
                      <LayoutDashboard className="h-4 w-4 text-accent" />
                      Panel Admin
                    </Link>
                  )}
                  <Link
                    href="/vip"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-canvas"
                  >
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    {isAdmin ? 'Ir a Biblioteca VIP' : 'Mi Biblioteca Activa'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/20 bg-canvas px-4 py-2 text-xs font-semibold text-ink/80"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Cerrar sesión ({userEmail})
                  </button>
                </>
              ) : (
                <>
                  {!googleUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        signInWithGoogle();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/25 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
                    >
                      <GoogleGIcon />
                      Entrar con Google
                    </button>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-ink/15 bg-surface px-3 py-2 text-xs text-ink">
                      <span className="truncate font-medium">{googleUser.email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          signOut();
                        }}
                        className="ml-2 font-semibold text-accent underline"
                      >
                        Salir
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openCheckout();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LockOpen className="h-4 w-4" />
                    Obtener Pase de Acceso Total
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
