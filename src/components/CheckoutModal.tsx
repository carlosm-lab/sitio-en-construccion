'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string | number>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
        onCancel?: () => void;
      }) => {
        render: (container: HTMLElement) => Promise<void>;
        close?: () => Promise<void>;
      };
    };
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CheckoutModal() {
  const router = useRouter();
  const { isCheckoutOpen, selectedArtworkTitle, closeCheckout, openLogin } =
    useGalleryModal();

  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [termsTimestamp, setTermsTimestamp] = useState<string | null>(null);

  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef(email);
  const termsRef = useRef(termsAccepted);
  const termsTimestampRef = useRef(termsTimestamp);

  emailRef.current = email;
  termsRef.current = termsAccepted;
  termsTimestampRef.current = termsTimestamp;

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isUnlocked = isEmailValid && termsAccepted;

  // Cargar SDK oficial de PayPal cuando el modal abre
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setErrorMsg(
        'Falta configurar NEXT_PUBLIC_PAYPAL_CLIENT_ID en las variables de entorno.'
      );
      return;
    }

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk="true"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => setSdkReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=USD&intent=capture&disable-funding=credit`;
    script.async = true;
    script.dataset.paypalSdk = 'true';
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      setErrorMsg(
        'No se pudo cargar la pasarela oficial de PayPal. Verifica tu conexión o bloqueadores de scripts.'
      );
    };
    document.body.appendChild(script);
  }, [isCheckoutOpen]);

  // Renderizar botones de PayPal solo cuando email válido + checkbox marcado
  useEffect(() => {
    if (!isCheckoutOpen || !isUnlocked || !sdkReady || !window.paypal) {
      return;
    }
    const container = paypalContainerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setErrorMsg(null);

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'black',
        shape: 'rect',
        label: 'pay',
        height: 46,
      },
      createOrder: async () => {
        setErrorMsg(null);
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailRef.current.trim(),
            termsAccepted: termsRef.current,
            termsVersion: 'v1.0',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.orderId) {
          const msg = data.error || 'No se pudo iniciar la orden en PayPal.';
          setErrorMsg(msg);
          throw new Error(msg);
        }
        setTermsTimestamp(data.termsAcceptedAt || new Date().toISOString());
        return data.orderId;
      },
      onApprove: async (data) => {
        setIsProcessing(true);
        setErrorMsg(null);
        try {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.orderID,
              email: emailRef.current.trim(),
              termsAccepted: termsRef.current,
              termsVersion: 'v1.0',
              termsAcceptedAt:
                termsTimestampRef.current || new Date().toISOString(),
            }),
          });
          const result = await res.json();
          if (!res.ok || !result.success) {
            setErrorMsg(
              result.error ||
                'El pago fue aprobado pero no pudimos confirmar la captura.'
            );
            setIsProcessing(false);
            return;
          }
          closeCheckout();
          router.push('/vip');
          router.refresh();
        } catch {
          setErrorMsg('Error de red al confirmar la licencia VIP.');
          setIsProcessing(false);
        }
      },
      onCancel: () => {
        setErrorMsg('Operación cancelada. Puedes reintentar cuando lo desees.');
      },
      onError: () => {
        setErrorMsg(
          'Ocurrió un inconveniente con PayPal. Por favor verifica tus datos o intenta nuevamente.'
        );
      },
    });

    buttons.render(container).catch(() => {
      setErrorMsg('No se pudo inicializar el botón de PayPal.');
    });

    return () => {
      if (buttons.close) {
        buttons.close().catch(() => {});
      }
    };
  }, [isCheckoutOpen, isUnlocked, sdkReady, closeCheckout, router]);

  if (!isCheckoutOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/25 bg-canvas p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={closeCheckout}
          aria-label="Cerrar ventana de checkout"
          className="absolute right-4 top-4 rounded-lg border border-ink/15 bg-surface p-1.5 text-ink hover:bg-ink hover:text-canvas"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acceso Total Vitalicio — Pago Único
        </div>

        <h2
          id="checkout-modal-title"
          className="mt-3 font-serif text-3xl font-semibold text-ink"
        >
          Desbloquear Biblioteca Completa
        </h2>

        {selectedArtworkTitle && (
          <p className="mt-1 text-xs font-medium text-ink/75">
            Obra seleccionada:{' '}
            <span className="font-semibold text-ink">{selectedArtworkTitle}</span>{' '}
            (incluida junto a todo el banco de arte).
          </p>
        )}

        {/* Resumen de valor */}
        <div className="mt-5 rounded-xl border border-ink/15 bg-surface/65 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">
              Licencia Vitalicia ArteDigital.click
            </span>
            <span className="font-serif text-2xl font-bold text-ink">
              $20.00 USD
            </span>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-ink/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ink" />
              Descarga ilimitada en alta resolución SIN marca de agua.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ink" />
              Acceso íntegro a todos los prompts y parámetros técnicos.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ink" />
              Manuales PDF de Consistencia de Personajes incluidos.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ink" />
              Código único <code className="font-mono font-semibold">AD-XXXX-XXXX</code>{' '}
              inmediato tras el pago.
            </li>
          </ul>
        </div>

        {/* Formulario de Validación Legal Pre-Pago */}
        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="checkout-email"
              className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
            >
              1. Tu Correo Electrónico (para emitir tu licencia)
            </label>
            <input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@tudominio.com"
              required
              className="mt-1.5 w-full rounded-xl border border-ink/25 bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink/45 focus:border-ink focus:outline-none"
            />
            {email.length > 0 && !isEmailValid && (
              <p className="mt-1 text-xs text-ink/80">
                Introduce un correo electrónico válido.
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/20 bg-surface/50 p-3.5 text-xs leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
            />
            <span>
              He leído y acepto los{' '}
              <Link
                href="/terminos-y-condiciones"
                target="_blank"
                className="font-semibold underline"
              >
                Términos de Servicio
              </Link>{' '}
              y la{' '}
              <Link
                href="/politica-de-reembolsos"
                target="_blank"
                className="font-semibold underline"
              >
                Política de Reembolsos
              </Link>
              . Entiendo que estoy adquiriendo acceso inmediato a bienes digitales
              intangibles (arte sin marca de agua, prompts y manuales) y que, una vez
              otorgado el acceso o generada mi licencia, la venta es final y no
              aplican reembolsos.
            </span>
          </label>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-ink/30 bg-surface p-3 text-xs font-medium text-ink"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bloque de Pago PayPal */}
        <div className="mt-5">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-ink/20 bg-surface/60 py-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-ink" />
              <p className="text-xs font-semibold text-ink">
                Verificando captura en PayPal y generando tu código AD-XXXX-XXXX...
              </p>
            </div>
          ) : !isUnlocked ? (
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-ink/20 bg-surface px-4 py-3.5 text-sm font-semibold text-ink/50"
            >
              <Lock className="h-4 w-4" />
              Ingresa tu correo y acepta los términos para pagar con PayPal
            </button>
          ) : (
            <div>
              {!sdkReady && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-surface/50 py-4 text-xs text-ink">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando pasarela segura de PayPal...
                </div>
              )}
              <div ref={paypalContainerRef} className="min-h-[48px]" />
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink/15 pt-4 text-xs text-ink/75">
          <span>¿Ya tienes un código AD-XXXX-XXXX?</span>
          <button
            type="button"
            onClick={openLogin}
            className="font-semibold text-ink underline"
          >
            Ingresar como Miembro
          </button>
        </div>
      </div>
    </div>
  );
}
