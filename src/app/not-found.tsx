import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Layers } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div className="rounded-3xl border border-ink/20 bg-surface/75 p-10 sm:p-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent">
          <Compass className="h-4 w-4" />
          Error 404 — Página No Encontrada
        </span>

        <h1 className="mt-5 font-serif text-5xl font-semibold text-ink sm:text-6xl">
          Esta obra o ruta no existe
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/80">
          Es posible que el enlace haya cambiado, la obra haya sido retirada del
          catálogo o hayas escrito una dirección incorrecta.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la Galería Principal
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 rounded-xl border border-ink/25 bg-canvas px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-blue"
          >
            Contactar Soporte
          </Link>
        </div>

        <div className="mt-10 border-t border-ink/15 pt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/65">
            Explorar Categorías Activas
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:border-accent"
              >
                <Layers className="h-3.5 w-3.5 text-accent" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
