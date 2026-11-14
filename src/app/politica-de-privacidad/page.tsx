import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Seguridad de Datos',
  description:
    'Política transparente de recolección de correo electrónico, autenticación Google OAuth, registros de transacción PayPal, dirección IP y auditoría de acceso en ArteDigital.click.',
  alternates: {
    canonical: `${SITE_URL}/politica-de-privacidad`,
  },
};

export default function PoliticaPrivacidadPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-ink/15 bg-surface/65 p-8 sm:p-12">
        <span className="text-xs font-bold uppercase tracking-widest text-accent">
          Protección de Datos y Antifraude · Versión v1.0
        </span>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">
          Política de Privacidad
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/85">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              1. Datos Recopilados y Finalidad Legítima
            </h2>
            <p className="mt-2">
              En <strong>ArteDigital.click</strong> recolectamos únicamente la
              información indispensable para emitir tu Pase de Acceso Total,
              autenticar tu sesión mediante Google OAuth y proteger la integridad
              de la plataforma frente a fraudes electrónicos:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <strong>Dirección de correo electrónico / Google OAuth:</strong>{' '}
                utilizada para vincular tu membresía vitalicia, autenticar
                sesiones seguras en un clic y brindarte soporte técnico.
              </li>
              <li>
                <strong>Datos de transacción PayPal:</strong> identificador de
                orden (<code>paypal_order_id</code>) e identificador de pagador (
                <code>payer_id</code>). Nunca almacenamos números de tarjetas
                bancarias ni contraseñas financieras en nuestros servidores.
              </li>
              <li>
                <strong>Registros técnicos de seguridad (Logs Forenses):</strong>{' '}
                dirección IP (obtenida mediante cabeceras de red seguras), User-Agent
                del navegador, fecha/hora exacta de aceptación de términos y
                registro de descargas de archivos dentro de la plataforma.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              2. Base Legal de los Registros de IP y Auditoría
            </h2>
            <p className="mt-2">
              El almacenamiento de la dirección IP y los timestamps de actividad se
              fundamenta en el interés legítimo de seguridad informática,
              validación de licencias de arte digital, prevención de accesos
              compartidos no autorizados y acreditación fehaciente de entrega
              digital ante pasarelas de pago como PayPal.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              3. Política de Cabeceras y No Rastreo de Terceros
            </h2>
            <p className="mt-2">
              ArteDigital.click implementa la cabecera estricta{' '}
              <code>Referrer-Policy: no-referrer</code>,{' '}
              <code>X-Content-Type-Options: nosniff</code> y{' '}
              <code>X-Frame-Options: DENY</code> en todo el sitio web para evitar
              fugas de datos de navegación hacia dominios externos. No vendemos ni
              cedemos bases de datos de clientes a terceros publicitarios.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              4. Derechos del Titular y Contacto
            </h2>
            <p className="mt-2">
              Para ejercer derechos de acceso, rectificación o consulta sobre los
              datos vinculados a tu cuenta, puedes enviar tu solicitud en cualquier
              momento a través de nuestro{' '}
              <Link href="/contacto" className="font-semibold text-accent underline">
                Centro Oficial de Soporte y Contacto
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
