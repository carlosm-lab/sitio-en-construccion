'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ArtworkFull, ManualItem } from '@/types';
import { CATEGORY_MAP } from '@/lib/seed-data';
import { useGalleryModal } from '@/components/GalleryContext';

interface VipCustomerInfo {
  email: string;
  license_code: string;
  paypal_order_id: string;
  created_at: string;
}

export default function VipDashboardPage() {
  const { openCheckout } = useGalleryModal();

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [customer, setCustomer] = useState<VipCustomerInfo | null>(null);
  const [artworks, setArtworks] = useState<ArtworkFull[]>([]);
  const [manuals, setManuals] = useState<ManualItem[]>([]);

  // Login inline si no hay cookie activa
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  // Feedback de copiado y descargas
  const [copiedLicense, setCopiedLicense] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/vip/verify', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          setCustomer(data.customer);
          setArtworks(data.artworks || []);
          setManuals(data.manuals || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/vip/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          licenseCode: codeInput.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setLoginError(data.error || 'No se pudo validar tu licencia.');
        setLoginBusy(false);
        return;
      }
      setAuthenticated(true);
      setCustomer(data.customer);
      setArtworks(data.artworks || []);
      setManuals(data.manuals || []);
    } catch {
      setLoginError('Error de conexión validando acceso VIP.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleCopyLicense = async () => {
    if (!customer) return;
    await navigator.clipboard.writeText(customer.license_code);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2500);
  };

  const handleCopyPrompt = async (artwork: ArtworkFull) => {
    await navigator.clipboard.writeText(artwork.prompt_full);
    setCopiedPromptId(artwork.id);
    setTimeout(() => setCopiedPromptId(null), 2200);

    // Registrar uso del prompt en audit_logs
    fetch('/api/vip/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: artwork.id,
        resourceType: 'prompt_copy',
        resourceTitle: artwork.title,
      }),
    }).catch(() => {});
  };

  const handleDownloadArtwork = async (artwork: ArtworkFull) => {
    setDownloadStatus(`Preparando descarga master de "${artwork.title}"...`);
    try {
      await fetch('/api/vip/log-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: artwork.id,
          resourceType: 'high_res_artwork',
          resourceTitle: artwork.title,
        }),
      });

      const response = await fetch(artwork.high_res_url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${artwork.slug}-ArteDigital-4K.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setDownloadStatus(`Descarga registrada para "${artwork.title}".`);
      setTimeout(() => setDownloadStatus(null), 3500);
    } catch {
      window.open(artwork.high_res_url, '_blank', 'noopener,noreferrer');
      setDownloadStatus(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/vip/logout', { method: 'POST' });
    setAuthenticated(false);
    setCustomer(null);
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-ink" />
        <p className="mt-3 text-sm font-medium text-ink/75">
          Verificando tu licencia VIP de ArteDigital.click...
        </p>
      </div>
    );
  }

  if (!authenticated || !customer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-ink/20 bg-surface/65 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
            <KeyRound className="h-3.5 w-3.5" />
            Área Privada de Miembros
          </div>

          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
            Accede a tu Biblioteca VIP
          </h1>
          <p className="mt-2 text-sm text-ink/80">
            Introduce el correo electrónico y tu Código de Licencia único para
            descargar todas las obras en 4K sin marca de agua, copiar los
            prompts completos y bajar los manuales técnicos.
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="vip-email"
                className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
              >
                Correo de Compra
              </label>
              <input
                id="vip-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tu@correo.com"
                className="mt-1.5 w-full rounded-xl border border-ink/25 bg-canvas px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="vip-license"
                className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
              >
                Código de Licencia
              </label>
              <input
                id="vip-license"
                type="text"
                required
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="AD-XXXX-XXXX"
                className="mt-1.5 w-full rounded-xl border border-ink/25 bg-canvas px-4 py-3 font-mono text-sm uppercase tracking-wider text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="rounded-xl border border-ink/30 bg-canvas p-3 text-xs font-medium text-ink">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-60"
            >
              {loginBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar y Entrar al Panel VIP'
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-ink/15 pt-5 text-center">
            <p className="text-xs text-ink/75">¿Todavía no tienes tu licencia?</p>
            <button
              type="button"
              onClick={() => openCheckout()}
              className="mt-2 rounded-xl border border-ink/25 bg-canvas px-5 py-2.5 text-xs font-semibold text-ink hover:bg-ink hover:text-canvas"
            >
              Desbloquear Acceso Vitalicio — $20 USD
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Tarjeta de Código de Miembro (Color Secundario #DCE8E2 y Bordes #2C3E4C) */}
      <section className="rounded-3xl border-2 border-ink bg-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink bg-canvas px-3 py-1 text-xs font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5" />
              Membresía Vitalicia Activa
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-ink sm:text-4xl">
              Bienvenido al Panel VIP de ArteDigital.click
            </h1>
            <p className="mt-1.5 text-sm text-ink/80">
              Titular: <span className="font-semibold">{customer.email}</span> ·
              Orden PayPal:{' '}
              <span className="font-mono text-xs">{customer.paypal_order_id}</span>
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 rounded-2xl border border-ink bg-canvas p-4 sm:items-end">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink/70">
              Tu Código de Miembro Único
            </span>
            <div className="flex items-center gap-3">
              <code className="font-mono text-2xl font-bold tracking-wider text-ink">
                {customer.license_code}
              </code>
              <button
                type="button"
                onClick={handleCopyLicense}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                {copiedLicense ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar Código
                  </>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink/70 underline hover:text-ink"
            >
              <LogOut className="h-3 w-3" />
              Cerrar sesión en este dispositivo
            </button>
          </div>
        </div>
      </section>

      {downloadStatus && (
        <div className="mt-6 rounded-xl border border-ink/25 bg-surface px-4 py-3 text-xs font-semibold text-ink">
          {downloadStatus}
        </div>
      )}

      {/* Manuales Técnicos Desbloqueados */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-ink" />
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Manuales Técnicos Desbloqueados
          </h2>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {manuals.map((manual) => (
            <div
              key={manual.id}
              className="flex flex-col justify-between rounded-2xl border border-ink/20 bg-surface/60 p-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-ink/70">
                  <span>{manual.format}</span>
                  <span>{manual.pages_count} págs.</span>
                </div>
                <h3 className="mt-2 font-serif text-xl font-semibold text-ink">
                  {manual.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/80">
                  {manual.description}
                </p>
              </div>

              <a
                href={manual.file_url || '/api/vip/manual-download'}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar Guía Técnica
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Galería Master Sin Marca de Agua */}
      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-ink" />
          <h2 className="font-serif text-3xl font-semibold text-ink">
            Archivo Master 4K Sin Marca de Agua &amp; Prompts Completos
          </h2>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork) => {
            const catMeta = CATEGORY_MAP[artwork.category];
            return (
              <article
                key={artwork.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-ink/20 bg-surface/50"
              >
                <div className="relative aspect-[4/5] w-full bg-surface">
                  <Image
                    src={artwork.high_res_url}
                    alt={artwork.alt_text}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-ink/20 bg-canvas/95 px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {catMeta?.name || artwork.category}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-ink">
                      {artwork.title}
                    </h3>

                    <div className="mt-3 rounded-xl border border-ink/15 bg-canvas p-3">
                      <p className="font-mono text-[11px] leading-relaxed text-ink">
                        {artwork.prompt_full}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(artwork)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/25 bg-canvas px-3 py-2.5 text-xs font-semibold text-ink hover:bg-surface"
                    >
                      {copiedPromptId === artwork.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
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
                      onClick={() => handleDownloadArtwork(artwork)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-canvas hover:opacity-90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar 4K
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
