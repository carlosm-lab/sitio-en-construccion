'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RouteErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error de ruta en ArteDigital.click:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="rounded-3xl border border-ink/20 bg-surface/75 p-10">
        <AlertTriangle className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink sm:text-4xl">
          Algo salió mal al cargar esta sección
        </h1>
        <p className="mt-3 text-sm text-ink/80">
          Se produjo un error temporal de conexión o servidor. Puedes reintentar
          la carga o volver al inicio.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-ink/60">
            Referencia técnica: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar ahora
          </button>
          <Link
            href="/"
            className="rounded-xl border border-ink/25 bg-canvas px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-blue"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
