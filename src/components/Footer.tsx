import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/15 bg-surface/65 text-ink no-print">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
              ArteDigital.click
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink/75">
              Banco editorial de arte digital generado por IA, librería de prompts
              avanzados y manuales técnicos para creación de personajes consistentes.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-medium text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Entrega Digital Verificada
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Categorías
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/categoria/retratos-ia" className="hover:text-accent hover:underline">
                  Retratos IA Editoriales
                </Link>
              </li>
              <li>
                <Link href="/categoria/concept-art" className="hover:text-accent hover:underline">
                  Concept Art Minimalista
                </Link>
              </li>
              <li>
                <Link href="/categoria/guias-personajes" className="hover:text-accent hover:underline">
                  Guías de Consistencia
                </Link>
              </li>
              <li>
                <Link href="/vip" className="hover:text-accent hover:underline">
                  Panel VIP Miembros
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Cumplimiento y Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/terminos-y-condiciones" className="hover:text-accent hover:underline">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-de-reembolsos" className="hover:text-accent hover:underline">
                  Política de Reembolsos
                </Link>
              </li>
              <li>
                <Link href="/politica-de-privacidad" className="hover:text-accent hover:underline">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-accent hover:underline">
                  Contacto y Soporte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Atención al Cliente
            </h3>
            <p className="mt-4 text-sm text-ink/80">
              ¿Necesitas recuperar tu código de miembro{' '}
              <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs">
                AD-XXXX-XXXX
              </code>{' '}
              o soporte técnico?
            </p>
            <p className="mt-2 text-sm font-semibold">
              <a href="mailto:soporte@artedigital.click" className="text-accent underline">
                soporte@artedigital.click
              </a>
            </p>
            <div className="mt-4">
              <Link
                href="/admin"
                className="text-xs font-medium text-ink/70 underline hover:text-accent"
              >
                Administración (Google OAuth)
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink/15 pt-6 text-xs text-ink/70 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} ArteDigital.click — Todos los derechos
            reservados. Bienes Digitales Intangibles ($20.00 USD Pago Único).
          </p>
          <p>Licencia de Uso Editorial y Comercial Verificada.</p>
        </div>
      </div>
    </footer>
  );
}
