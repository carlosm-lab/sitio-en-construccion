'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          backgroundColor: '#EAF4FB',
          color: '#16324F',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            backgroundColor: '#F9E6D8',
            border: '1px solid rgba(22, 50, 79, 0.25)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#C86D51',
            }}
          >
            Error Crítico de Aplicación
          </p>
          <h1 style={{ fontSize: '28px', margin: '12px 0' }}>
            ArteDigital.click encontró un error inesperado
          </h1>
          <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: 0.85 }}>
            Por favor recarga la aplicación. Si el problema persiste, contáctanos
            en soporte@artedigital.click.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.65 }}>
              ID: {error.digest}
            </p>
          )}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                backgroundColor: '#C86D51',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
