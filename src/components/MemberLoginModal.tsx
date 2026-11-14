'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, KeyRound, Loader2, X } from 'lucide-react';
import { useGalleryModal } from './GalleryContext';
import { GoogleSignInButton } from './GoogleSignInButton';

export function MemberLoginModal() {
  const router = useRouter();
  const { isLoginOpen, closeLogin, openCheckout } = useGalleryModal();

  const [email, setEmail] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoginOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/vip/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          licenseCode: licenseCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setErrorMsg(data.error || 'Credenciales inválidas.');
        setLoading(false);
        return;
      }

      closeLogin();
      router.push('/vip');
      router.refresh();
    } catch {
      setErrorMsg('No se pudo conectar con el servidor de licencias.');
      setLoading(false);
    }
  };

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
          <KeyRound className="h-3.5 w-3.5 text-accent" />
          Recuperar Sesión VIP
        </div>

        <h2
          id="member-login-title"
          className="mt-3 font-serif text-3xl font-semibold text-ink"
        >
          Acceso Miembros
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/75">
          Inicia sesión con tu cuenta de Google asociada a la compra o ingresa tu
          Correo + Código de Licencia único.
        </p>

        <div className="mt-4">
          <GoogleSignInButton nextPath="/vip" label="Entrar con Google" />
        </div>

        <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink/50">
          <span className="h-px flex-1 bg-ink/15" />
          <span>O con Código de Licencia</span>
          <span className="h-px flex-1 bg-ink/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="member-email"
              className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
            >
              Correo Electrónico
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="comprador@ejemplo.com"
              required
              className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/45 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="member-code"
              className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
            >
              Código de Licencia
            </label>
            <input
              id="member-code"
              type="text"
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
              placeholder="AD-XXXX-XXXX"
              required
              className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 font-mono text-sm uppercase tracking-wider text-ink placeholder:text-ink/45 focus:border-accent focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-accent/40 bg-surface p-3 text-xs font-medium text-ink"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando Licencia...
              </>
            ) : (
              'Entrar al Área VIP'
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-4 text-xs text-ink/75">
          <span>¿Aún no eres miembro?</span>
          <button
            type="button"
            onClick={() => openCheckout()}
            className="font-semibold text-accent underline"
          >
            Obtener Acceso — $20 USD
          </button>
        </div>
      </div>
    </div>
  );
}
