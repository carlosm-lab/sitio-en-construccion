import React from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/seed-data';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso y Licencia Digital',
  description:
    'Términos legales, licencia de uso editorial/comercial de bienes digitales intangibles y prohibición de redistribución en ArteDigital.click.',
  alternates: {
    canonical: `${SITE_URL}/terminos-y-condiciones`,
  },
};

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-ink/15 bg-surface/50 p-8 sm:p-12">
        <span className="text-xs font-bold uppercase tracking-widest text-ink/65">
          Documento Legal v1.0 · Vigente 2026
        </span>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">
          Términos y Condiciones del Servicio
        </h1>
        <p className="mt-3 text-sm text-ink/75">
          Titular de la plataforma: <strong>ArteDigital.click</strong> ·
          Contacto oficial:{' '}
          <a href="mailto:soporte@artedigital.click" className="underline">
            soporte@artedigital.click
          </a>
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink/85">
          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              1. Objeto y Naturaleza Digital del Servicio
            </h2>
            <p className="mt-2">
              ArteDigital.click es una plataforma comercial especializada en la
              provisión de bienes digitales intangibles de entrega electrónica
              inmediata. La adquisición de la Licencia de Acceso Total ($20.00
              USD pago único) otorga al usuario acceso personal, vitalicio e
              intransferible al Área Privada VIP (`/vip`), donde se ponen a
              disposición archivos gráficos de arte digital en alta resolución
              sin marca de agua, prompts de ingeniería visual y manuales técnicos
              de consistencia de personajes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              2. Emisión de Licencia Única y Entrega Instantánea
            </h2>
            <p className="mt-2">
              Inmediatamente después de que la pasarela PayPal confirme el pago en
              estado <code>COMPLETED</code>, nuestros servidores emiten un Código
              de Miembro único en formato <code>AD-XXXX-XXXX</code> y habilitan
              el acceso sin restricciones al catálogo privado. No existe envío
              físico ni mensajería postal de ningún artículo.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              3. Alcance de la Licencia de Uso del Arte y Prompts
            </h2>
            <p className="mt-2">
              El comprador licenciado recibe un derecho mundial, no exclusivo y
              libre de regalías para utilizar, adaptar y publicar las obras
              descargadas y los resultados generados mediante nuestros prompts en
              proyectos personales, editoriales, publicitarios, sitios web,
              diseños comerciales y material audiovisual de marca propia o de
              clientes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              4. Prohibición Expresa de Redistribución y Reventa
            </h2>
            <p className="mt-2">
              Queda estrictamente prohibido revender, sublicenciar, compartir
              públicamente en repositorios gratuitos, empaquetar en otros bancos de
              imágenes competidores o redistribuir de forma masiva los archivos
              master, los manuales técnicos o el Código de Miembro{' '}
              <code>AD-XXXX-XXXX</code>. La detección de abuso o compartición de
              credenciales faculta a ArteDigital.click para revocar la licencia
              activa sin derecho a compensación.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-ink">
              5. Registro Técnico de Aceptación y Auditoría
            </h2>
            <p className="mt-2">
              Antes de habilitar el pago, el usuario declara leer y aceptar estos
              Términos (versión <code>v1.0</code>) junto con la Política de
              Reembolsos. Dicha aceptación queda registrada electrónicamente con
              marca temporal UTC, dirección IP y agente de usuario para fines de
              seguridad contractual y prevención de contracargos indebidos.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
