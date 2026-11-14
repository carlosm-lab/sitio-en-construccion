'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LockOpen,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

export function Navbar() {
  const {
    openCheckout,
    openMemberLogin,
    hasFullAccess,
    isAdmin,
    googleUser,
    userEmail,
    signOut,
  } = useGalleryModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-canvas/95 backdrop-blur-md no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink transition-opacity hover:opacity-85"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/20 bg-surface text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <span className="block font-serif text-xl font-semibold tracking-tight leading-none">
              ArteDigital.click
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-ink/65">
              Galería de Arte Digital en 4K
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
            href="/categoria/fotografia-editorial"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Fotografía Editorial
          </Link>
          <Link
            href="/categoria/arte-conceptual"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Arte Conceptual
          </Link>
          <Link
            href="/categoria/ilustracion-digital"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Ilustración Digital
          </Link>
          <Link
            href="/#precios"
            className="text-sm font-medium text-ink/80 transition-colors hover:text-accent"
          >
            Inversión ($25 USD)
          </Link>
        </nav>

        {/* Acciones Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {hasFullAccess ? (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Pase Activo (VIP)
              </span>
              <Link
                href="/vip"
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                Mi Biblioteca 4K
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-ink/20 bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-blue"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                title="Cerrar sesión"
                className="inline-flex items-center gap-1 rounded-lg border border-ink/20 bg-canvas px-3 py-2 text-xs font-semibold text-ink/80 transition-colors hover:border-accent hover:text-accent"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => openMemberLogin()}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink/80 transition-colors hover:text-accent"
              >
                <UserCheck className="h-3.5 w-3.5 text-accent" />
                <span>Acceso Miembros</span>
              </button>
              <button
                type="button"
                onClick={() => openCheckout()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <LockOpen className="h-3.5 w-3.5" />
                <span>Obtener Pase — $25 USD</span>
              </button>
            </div>
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
              Galería
            </Link>
            <Link
              href="/categoria/fotografia-editorial"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Fotografía Editorial
            </Link>
            <Link
              href="/categoria/arte-conceptual"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Arte Conceptual
            </Link>
            <Link
              href="/categoria/ilustracion-digital"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Ilustración Digital
            </Link>
            <Link
              href="/#precios"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
            >
              Inversión ($25 USD)
            </Link>

            <div className="mt-2 flex flex-col gap-2 border-t border-ink/15 pt-3">
              {hasFullAccess ? (
                <>
                  <Link
                    href="/vip"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-canvas"
                  >
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Mi Biblioteca 4K
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/20 bg-surface px-4 py-2 text-xs font-semibold text-ink"
                    >
                      Panel de Administración
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/20 bg-canvas px-4 py-2 text-xs font-semibold text-ink/80"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openMemberLogin();
                    }}
                    className="rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-surface"
                  >
                    Acceso para Miembros
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openCheckout();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LockOpen className="h-4 w-4" />
                    Obtener Pase — $25 USD
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
