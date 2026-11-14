'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';
import { GoogleSignInButton } from './GoogleSignInButton';

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

const EMAIL_REGEX =
  /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export function CheckoutModal() {
  const router = useRouter();
  const {
    isCheckoutOpen,
    selectedArtworkTitle,
    closeCheckout,
    hasFullAccess,
    googleUser,
    refreshVipSession,
  } = useGalleryModal();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [editingCustomEmail, setEditingCustomEmail] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [termsTimestamp, setTermsTimestamp] = useState<string | null>(null);

  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef(email);
  const termsRef = useRef(termsAccepted);
  const termsTimestampRef = useRef(termsTimestamp);

  useEffect(() => {
    if (googleUser?.email && !editingCustomEmail) {
      setEmail(googleUser.email);
    }
  }, [googleUser, editingCustomEmail]);

  useEffect(() => {
    if (isCheckoutOpen) {
      // Si el usuario ya conectó su cuenta de Google, avanzar automáticamente al paso 2
      if (googleUser?.email) {
        setStep(2);
      } else {
        setStep(1);
      }
      setErrorMsg(null);
    }
  }, [isCheckoutOpen, googleUser]);

  emailRef.current = email;
  termsRef.current = termsAccepted;
  termsTimestampRef.current = termsTimestamp;

  const isEmailValid = EMAIL_REGEX.test(email.trim());

  useEffect(() => {
    if (!isCheckoutOpen || hasFullAccess) return;

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
        'No se pudo cargar la pasarela oficial de PayPal. Verifica tu conexión.'
      );
    };
    document.body.appendChild(script);
  }, [isCheckoutOpen, hasFullAccess]);

  useEffect(() => {
    if (
      !isCheckoutOpen ||
      hasFullAccess ||
      step !== 3 ||
      !isEmailValid ||
      !termsAccepted ||
      !sdkReady ||
      !window.paypal
    ) {
      return;
    }
    const container = paypalContainerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setErrorMsg(null);

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
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
          await refreshVipSession();
          closeCheckout();
          router.push('/vip');
          router.refresh();
        } catch {
          setErrorMsg('Error de red al activar tu Pase de Acceso Total.');
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
  }, [
    isCheckoutOpen,
    hasFullAccess,
    step,
    isEmailValid,
    termsAccepted,
    sdkReady,
    closeCheckout,
    refreshVipSession,
    router,
  ]);

  if (!isCheckoutOpen || hasFullAccess) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-ink/20 bg-canvas p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={closeCheckout}
          aria-label="Cerrar ventana de activación"
          className="absolute right-5 top-5 rounded-full border border-ink/15 bg-surface p-2 text-ink hover:bg-ink hover:text-canvas"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Indicador de Progreso del Onboarding */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink/65">
            <span>Paso {step} de 3</span>
            <span>
              {step === 1 && '1. Tu Cuenta de Google'}
              {step === 2 && '2. Licencia Comercial'}
              {step === 3 && '3. Pago Seguro ($25 USD)'}
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                step >= 1 ? 'bg-accent' : 'bg-ink/15'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-colors ${
                step >= 2 ? 'bg-accent' : 'bg-ink/15'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-colors ${
                step >= 3 ? 'bg-accent' : 'bg-ink/15'
              }`}
            />
          </div>
        </div>

        {/* ===================================================================
            PASO 1: VINCULACIÓN DE IDENTIDAD DIGITAL (GOOGLE OAUTH)
            =================================================================== */}
        {step === 1 && (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <UserCheck className="h-3.5 w-3.5 text-accent" />
              Paso 1: Vinculación Inmediata de Acceso
            </div>

            <h2
              id="checkout-modal-title"
              className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl"
            >
              ¿A qué cuenta de Google vinculamos tu Pase Vitalicio?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/80 sm:text-sm">
              Tu acceso se asociará a tu cuenta de Google. De esta forma podrás
              entrar en 1 clic desde cualquier ordenador, tablet o móvil sin
              necesidad de recordar contraseñas ni códigos.
            </p>

            <div className="mt-6 space-y-4">
              <GoogleSignInButton
                nextPath="/?checkout=1"
                label="Conectar mi cuenta de Google (1 clic)"
              />

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-ink/15" />
                <span className="mx-3 flex-shrink text-xs font-medium uppercase tracking-wider text-ink/50">
                  o escribe tu correo de Google
                </span>
                <div className="flex-grow border-t border-ink/15" />
              </div>

              <div>
                <label
                  htmlFor="checkout-email-input"
                  className="block text-xs font-semibold text-ink/80"
                >
                  Correo Electrónico de Google:
                </label>
                <input
                  id="checkout-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEditingCustomEmail(true);
                  }}
                  placeholder="ejemplo@gmail.com"
                  className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isEmailValid) {
                    setErrorMsg(null);
                    setStep(2);
                  } else {
                    setErrorMsg('Por favor ingresa un correo electrónico válido.');
                  }
                }}
                disabled={!isEmailValid}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                <span>Continuar a Revisión de Licencia</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 2: REVISIÓN DE LICENCIA COMERCIAL Y TÉRMINOS
            =================================================================== */}
        {step === 2 && (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <FileCheck2 className="h-3.5 w-3.5 text-accent" />
              Paso 2: Resumen y Derechos de Uso
            </div>

            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Resumen de tu Pase de Acceso Total
            </h2>

            {selectedArtworkTitle ? (
              <p className="mt-1 text-xs text-ink/75">
                Desbloqueo inmediato de{' '}
                <span className="font-semibold text-ink">
                  {selectedArtworkTitle}
                </span>{' '}
                + todo el catálogo de arte digital en resolución 4K.
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink/75">
                Acceso vitalicio todo-en-uno sin suscripciones mensuales.
              </p>
            )}

            {/* Tarjeta de Resumen */}
            <div className="mt-5 rounded-2xl border border-ink/15 bg-surface/75 p-5">
              <div className="flex items-baseline justify-between border-b border-ink/15 pb-4">
                <div>
                  <span className="block font-serif text-lg font-semibold text-ink">
                    Pase Total Vitalicio
                  </span>
                  <span className="text-xs text-ink/70">
                    Vinculado a:{' '}
                    <strong className="text-ink">{email.trim()}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-accent">
                    $25.00 USD
                  </span>
                  <span className="block text-[10px] font-semibold uppercase text-ink/60">
                    Pago Único
                  </span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-ink">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  Descarga ilimitada de todas las obras en resolución 4K nativa sin marcas de agua.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  Ficha técnica completa: relación de aspecto, paleta y dirección artística.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  Licencia de uso comercial y editorial ilimitada de por vida.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  Nuevas obras añadidas a la galería incluidas sin costo adicional.
                </li>
              </ul>
            </div>

            {/* Checkbox de Términos */}
            <div className="mt-5 rounded-xl border border-ink/20 bg-white p-4">
              <label className="flex items-start gap-3 text-xs text-ink">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink/30 text-accent focus:ring-accent"
                />
                <span className="leading-relaxed">
                  He leído y acepto los{' '}
                  <Link
                    href="/terminos-y-condiciones"
                    target="_blank"
                    className="font-semibold text-accent underline"
                  >
                    Términos de Servicio
                  </Link>{' '}
                  y la{' '}
                  <Link
                    href="/politica-de-reembolsos"
                    target="_blank"
                    className="font-semibold text-accent underline"
                  >
                    Política de Reembolsos
                  </Link>
                  . Entiendo que adquiero acceso inmediato a bienes digitales
                  intangibles en 4K y que la entrega es instantánea tras el pago.
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/20 bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:bg-surface"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Cambiar correo
              </button>

              <button
                type="button"
                onClick={() => {
                  if (termsAccepted) {
                    setErrorMsg(null);
                    setStep(3);
                  } else {
                    setErrorMsg(
                      'Por favor marca la casilla de aceptación de términos para continuar.'
                    );
                  }
                }}
                disabled={!termsAccepted}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                <span>Continuar al Pago Seguro</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASO 3: PAGO SEGURO CON PAYPAL Y ACTIVACIÓN INMEDIATA
            =================================================================== */}
        {step === 3 && (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Paso 3: Pago Protegido por PayPal
            </div>

            <h2 className="mt-3 font-serif text-2xl font-semibold text-ink sm:text-3xl">
              Completa tu activación segura
            </h2>
            <p className="mt-1 text-xs text-ink/75">
              Importe final a pagar:{' '}
              <strong className="font-semibold text-accent">
                $25.00 USD (Pago Único)
              </strong>
              . Tu acceso se habilitará automáticamente al completar la transacción.
            </p>

            <div className="mt-6">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-ink/20 bg-surface p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="font-serif text-lg font-semibold text-ink">
                    Confirmando tu pago con PayPal...
                  </p>
                  <p className="text-xs text-ink/75">
                    Habilitando tu acceso de por vida y preparando tu biblioteca 4K.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-ink/15 bg-white p-5">
                  {!sdkReady && (
                    <div className="flex items-center justify-center gap-2 py-6 text-xs text-ink">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      Cargando pasarela oficial de PayPal...
                    </div>
                  )}
                  <div ref={paypalContainerRef} className="min-h-[48px]" />
                </div>
              )}
            </div>

            {!isProcessing && (
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/75 hover:text-accent"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver al paso anterior
                </button>

                <div className="flex items-center gap-2 text-[11px] text-ink/65">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Conexión cifrada de 256 bits
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-accent/45 bg-surface p-3.5 text-xs font-medium text-ink"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
