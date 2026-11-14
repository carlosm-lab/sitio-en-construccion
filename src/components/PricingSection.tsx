'use client';

import React from 'react';
import {
  Check,
  CheckCircle2,
  LockOpen,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useGalleryModal } from './GalleryContext';

export function PricingSection() {
  const { openCheckout, hasFullAccess } = useGalleryModal();

  if (hasFullAccess) {
    return null;
  }

  return (
    <section id="precios" className="mt-20 scroll-mt-24">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-4 py-1.5 text-xs font-semibold text-ink">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Precios Transparentes · Sin Suscripciones Mensuales
        </div>

        <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Inversión Única. Acceso Vitalicio a Todo el Catálogo.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink/80">
          Olvídate de pagar suscripciones mensuales de $30 a $50 USD. Con un
          único pago de $25 USD desbloqueas de forma permanente todas las obras
          4K, los prompts exactos y todos los manuales de consistencia.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-stretch">
        {/* Columna 1: Suscripciones Tradicionales (Comparativa) */}
        <div className="flex flex-col justify-between rounded-3xl border border-ink/15 bg-canvas/70 p-8 text-ink/75">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Suscripciones Tradicionales
              </span>
              <span className="rounded-full bg-ink/10 px-3 py-1 text-[11px] font-semibold text-ink/70">
                Mercado Habitual
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-serif text-4xl font-bold text-ink/70">
                $35 USD
              </span>
              <span className="text-sm font-medium text-ink/60">/ mes</span>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              Equivale a $420 USD al año en cargos recurrentes.
            </p>

            <ul className="mt-8 space-y-3.5 text-xs">
              <li className="flex items-start gap-2.5 text-ink/65">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
                <span>Cobro recurrente todos los meses en tu tarjeta.</span>
              </li>
              <li className="flex items-start gap-2.5 text-ink/65">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
                <span>Pierdes acceso a los archivos si cancelas el mes.</span>
              </li>
              <li className="flex items-start gap-2.5 text-ink/65">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
                <span>Límites estrictos de descargas mensuales.</span>
              </li>
              <li className="flex items-start gap-2.5 text-ink/65">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
                <span>Prompts genéricos sin parámetros técnicos de lente.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-surface/50 p-4 text-center text-xs font-medium text-ink/60">
            Modelo recurrente con costo acumulativo elevado.
          </div>
        </div>

        {/* Columna 2: Pase Total Vitalicio (DESTACADA) */}
        <div className="relative flex flex-col justify-between rounded-3xl border-2 border-accent bg-surface p-8 shadow-xl">
          <div className="absolute -top-3.5 right-6 rounded-full bg-accent px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
            Acceso Vitalicio · Oferta Única
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Pase de Acceso Total
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Pago Único
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-5xl font-bold text-accent">
                $25 USD
              </span>
              <span className="text-xs font-semibold uppercase text-ink/70">
                Acceso Permanente
              </span>
            </div>
            <p className="mt-1 text-xs text-ink/80">
              Pagas una sola vez. Disfrutas de la biblioteca para siempre.
            </p>

            <ul className="mt-8 space-y-3 text-xs text-ink">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span className="font-semibold">
                  Descarga ilimitada de todas las obras en resolución 4K
                  (4096×5120px).
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  Acceso completo a todos los prompts exactos y fórmulas ópticas.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  Todos los manuales y guías de consistencia de personajes en
                  PDF/ZIP.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  Nuevas obras agregadas al catálogo incluidas sin costo extra.
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>Licencia de uso comercial y editorial completa.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                <span>Vinculación directa en 1 clic con tu cuenta de Google.</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => openCheckout()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg"
            >
              <LockOpen className="h-4 w-4" />
              <span>Activar Pase de Acceso Total — $25 USD</span>
            </button>

            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-ink/75">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-accent" />
                Entrega Inmediata
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-accent" />
                Pago Seguro con PayPal
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
