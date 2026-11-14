import React from 'react';
import Link from 'next/link';
import { MessageSquare, ShieldCheck } from 'lucide-react';

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
              Banco curado de arte digital, fotografía editorial e ilustraciones en resolución nativa 4K sin compresión y con licencia comercial completa de por vida.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-medium text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Acceso Directo con Google OAuth
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Colecciones Artísticas
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/categoria/fotografia-editorial" className="hover:text-accent hover:underline">
                  Fotografía Editorial
                </Link>
              </li>
              <li>
                <Link href="/categoria/arte-conceptual" className="hover:text-accent hover:underline">
                  Arte Conceptual
                </Link>
              </li>
              <li>
                <Link href="/categoria/ilustracion-digital" className="hover:text-accent hover:underline">
                  Ilustración Digital
                </Link>
              </li>
              <li>
                <Link href="/vip" className="hover:text-accent hover:underline">
                  Mi Biblioteca Master 4K
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Información Legal
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
                  Centro de Soporte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/70">
              Soporte y Consultas
            </h3>
            <p className="mt-4 text-sm text-ink/80">
              ¿Tienes alguna duda sobre tu acceso con Google, la descarga de tus archivos master 4K o el comprobante de PayPal?
            </p>
            <div className="mt-3">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/20 bg-canvas px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <MessageSquare className="h-3.5 w-3.5 text-accent" />
                <span>Formulario de Contacto</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 text-xs text-ink/65 sm:flex-row">
          <p>© {new Date().getFullYear()} ArteDigital.click · Galería de Arte Digital. Todos los derechos reservados.</p>
          <p>Pase de Acceso Total Vitalicio — $25.00 USD (Pago Único)</p>
        </div>
      </div>
    </footer>
  );
}
