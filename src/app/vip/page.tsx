'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Download,
  Loader2,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ArtworkFull, ManualItem } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import { useGalleryModal } from '@/components/GalleryContext';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

interface VipCustomerInfo {
  email: string;
  license_code: string;
  created_at: string;
}

export default function VipDashboardPage() {
  const { openCheckout, refreshVipSession, signOut } = useGalleryModal();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<VipCustomerInfo | null>(null);
  const [artworks, setArtworks] = useState<ArtworkFull[]>([]);
  const [oauthEmailWithoutLicense, setOauthEmailWithoutLicense] = useState<
    string | null
  >(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth_error')) {
        setLoginError(
          'No se pudo completar la autenticación con Google. Por favor intenta de nuevo.'
        );
      }
    }

    fetch('/api/vip/verify', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.authenticated) {
          setAuthenticated(false);
          if (data?.oauthEmailWithoutLicense) {
            setOauthEmailWithoutLicense(String(data.oauthEmailWithoutLicense));
          }
          setLoading(false);
          return;
        }
        setAuthenticated(true);
        setCustomer(data.customer);
        setArtworks(data.artworks || []);
        refreshVipSession();
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [refreshVipSession]);

  const handleDownloadAsset = async (
    type: 'artwork' | 'manual',
    id: string,
    title: string
  ) => {
    setDownloadStatus(`Generando enlace seguro para "${title}"...`);
    try {
      const res = await fetch(
        `/api/vip/download?type=${type}&id=${encodeURIComponent(id)}&mode=json`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.signedUrl) {
        setDownloadStatus(
          data.error || `No se pudo iniciar la descarga de "${title}".`
        );
        return;
      }

      const link = document.createElement('a');
      link.href = data.signedUrl;
      if (data.filename) {
        link.download = data.filename;
      }
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus(`Descarga iniciada: "${title}".`);
      setTimeout(() => setDownloadStatus(null), 4000);
    } catch {
      setDownloadStatus('Error de conexión al solicitar el archivo.');
    }
  };

  const handleLogout = async () => {
    setAuthenticated(false);
    setCustomer(null);
    setOauthEmailWithoutLicense(null);
    await signOut();
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-3 text-sm font-medium text-ink/75">
          Verificando tu acceso con Google...
        </p>
      </div>
    );
  }

  if (!authenticated || !customer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-ink/20 bg-surface/75 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Acceso Directo con Google OAuth
          </div>

          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
            Biblioteca Master 4K ArteDigital.click
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            Inicia sesión con tu cuenta de Google para acceder a todas las obras
            en alta resolución nativa 4K sin marca de agua y disfrutar de tu licencia comercial permanente.
          </p>

          {loginError && (
            <div className="mt-4 rounded-xl border border-accent/45 bg-canvas p-3.5 text-xs font-medium text-ink">
              {loginError}
            </div>
          )}

          {oauthEmailWithoutLicense ? (
            <div className="mt-5 rounded-2xl border border-accent bg-canvas p-5 text-xs text-ink">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold text-ink">
                    Has conectado la cuenta de Google{' '}
                    <span className="underline">{oauthEmailWithoutLicense}</span>,
                    pero aún no tiene un Pase de Acceso Total activo.
                  </p>
                  <p className="mt-1.5 leading-relaxed text-ink/75">
                    Puedes activar tu Pase de Acceso Total en esta cuenta por un
                    pago único de $25 USD o cambiar a otra cuenta de Google.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => openCheckout()}
                      className="rounded-xl bg-accent px-4 py-2.5 font-semibold text-white hover:opacity-90"
                    >
                      Activar Pase Total — $25 USD
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl border border-ink/20 bg-surface px-4 py-2.5 font-semibold text-ink hover:bg-surface-blue"
                    >
                      Cambiar cuenta de Google
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <GoogleSignInButton
                  nextPath="/vip"
                  label="Continuar con Google"
                />
              </div>

              <div className="mt-6 border-t border-ink/15 pt-5 text-center">
                <p className="text-xs text-ink/75">
                  ¿Aún no tienes tu Pase de Acceso Total Vitalicio?
                </p>
                <button
                  type="button"
                  onClick={() => openCheckout()}
                  className="mt-2.5 rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Obtener Pase Total — $25 USD
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera de Cuenta Activa */}
      <section className="rounded-3xl border-2 border-ink bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Pase de Acceso Total Vitalicio Activo
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              Mi Biblioteca Master en Resolución 4K
            </h1>
            <p className="mt-1.5 text-sm text-ink/80">
              Cuenta de Google verificada:{' '}
              <span className="font-semibold">{customer.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/25 bg-canvas px-4 py-2.5 text-xs font-semibold text-ink/80 transition-colors hover:border-accent hover:text-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </section>

      {downloadStatus && (
        <div className="mt-6 rounded-xl border border-ink/25 bg-surface-blue px-4 py-3 text-xs font-semibold text-ink">
          {downloadStatus}
        </div>
      )}

      {/* Galería Master Sin Marca de Agua */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Catálogo Master 4K Desbloqueado Sin Marcas de Agua
          </h2>
        </div>

        {artworks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-ink/15 bg-surface/50 p-6 text-sm text-ink/75">
            Nuevas obras master en preparación. Aparecerán aquí en cuanto sean cargadas.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {artworks.map((artwork) => {
              const catMeta = CATEGORY_MAP[artwork.category];
              return (
                <article
                  key={artwork.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-ink/20 bg-surface/50"
                >
                  <Link
                    href={`/arte/${artwork.slug}`}
                    className="relative aspect-[4/5] w-full bg-surface-blue"
                  >
                    <Image
                      src={artwork.high_res_signed_url || artwork.watermarked_url}
                      alt={artwork.alt_text}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full border border-ink/20 bg-canvas/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
                      {catMeta?.name || artwork.category}
                    </span>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between bg-canvas/85 p-5">
                    <div>
                      <Link
                        href={`/arte/${artwork.slug}`}
                        className="font-serif text-xl font-semibold text-ink hover:text-accent hover:underline"
                      >
                        {artwork.title}
                      </Link>

                      <p className="mt-2 text-xs leading-relaxed text-ink/75">
                        {artwork.prompt_preview || artwork.alt_text}
                      </p>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadAsset('artwork', artwork.id, artwork.title)
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Descargar Master 4K</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
