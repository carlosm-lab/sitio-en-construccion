import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Política de Reembolsos — Bienes Digitales Intangibles',
  description:
    'Condiciones de venta final y política de no reembolso aplicable a bienes digitales intangibles de entrega instantánea en ArteDigital.click.',
  alternates: {
    canonical: `${SITE_URL}/politica-de-reembolsos`,
  },
};

export default function PoliticaReembolsosPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-ink/15 bg-surface/65 p-8 sm:p-12">
        <span className="text-xs font-bold uppercase tracking-widest text-accent">
          Cumplimiento PayPal Digital Goods · Versión v1.0
        </span>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">
          Política de Reembolsos y Cancelaciones
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/85">
          <section className="rounded-2xl border border-ink/25 bg-canvas p-6">
            <h2 className="font-serif text-2xl font-semibold text-ink">
              1. Cláusula de Bienes Digitales Intangibles de Entrega Instantánea
            </h2>
            <p className="mt-2">
              Todos los productos comercializados en{' '}
              <strong>ArteDigital.click</strong> consisten exclusivamente en{' '}
              <strong>bienes digitales intangibles</strong> (imágenes artísticas y
              fotografías editoriales en alta resolución nativa 4K sin marca de agua
              y sus fichas artísticas de composición) bajo la categoría comercial{' '}
              <code>DIGITAL_GOODS</code>.
            </p>
            <p className="mt-3">
              Dado que la entrega es automatizada, electrónica e irreversible en el
              instante en que el servidor valida el pago de $25.00 USD y habilita el
              Pase de Acceso Total en la cuenta del comprador, el servicio se
              considera <strong>ejecutado y entregado al 100%</strong> desde ese
              momento.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              2. Venta Final y Renuncia al Derecho de Retracto
            </h2>
            <p className="mt-2">
              Al marcar la casilla obligatoria previa al pago en PayPal, el
              comprador reconoce expresamente que está adquiriendo acceso
              inmediato a contenido digital descargable y que, una vez activado su
              Pase de Acceso Total o habilitado el acceso a la biblioteca privada,{' '}
              <strong>
                la venta es final y no aplican reembolsos, devoluciones ni
                anulaciones por cambio de opinión
              </strong>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              3. Excepción por Fallo Técnico Comprobable
            </h2>
            <p className="mt-2">
              Únicamente se evaluará un reembolso si existiera un fallo técnico
              comprobable y atribuible a los servidores de ArteDigital.click que
              impida de forma absoluta el acceso a los archivos tras haber
              registrado la incidencia en nuestro{' '}
              <Link href="/contacto" className="font-semibold text-accent underline">
                Centro de Soporte Oficial
              </Link>{' '}
              y no haberse resuelto en un plazo de 72 horas hábiles.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              4. Trazabilidad ante Disputas en PayPal
            </h2>
            <p className="mt-2">
              Para protección de ambas partes, cada transacción registra la
              confirmación explícita de esta política, el identificador de orden
              PayPal, la dirección IP de origen, el agente de usuario y cada acceso
              o descarga efectuada en la plataforma. Dicha evidencia técnica será
              aportada ante el Centro de Resoluciones de PayPal en caso de
              reclamaciones no autorizadas o contracargos por producto no recibido.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
