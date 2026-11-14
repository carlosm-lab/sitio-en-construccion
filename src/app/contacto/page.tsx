'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react';

export default function ContactoPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseCode, setLicenseCode] = useState('');
  const [subject, setSubject] = useState('Soporte de Licencia VIP');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          licenseCode: licenseCode.trim() || undefined,
          subject,
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo enviar tu mensaje.');
      } else {
        setFeedback(data.message);
        setMessage('');
      }
    } catch {
      setErrorMsg('Error de red al enviar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            Atención al Cliente
          </span>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">
            Contacto y Soporte
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">
            ¿Necesitas asistencia para recuperar tu código{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
              AD-XXXX-XXXX
            </code>
            , consultar parámetros técnicos o verificar tu orden de PayPal?
          </p>

          <div className="mt-6 rounded-2xl border border-ink/20 bg-surface/75 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/70">
              <Mail className="h-4 w-4 text-accent" />
              Correo Directo de Soporte
            </div>
            <a
              href="mailto:soporte@artedigital.click"
              className="mt-2 block text-base font-semibold text-accent underline"
            >
              soporte@artedigital.click
            </a>
            <p className="mt-2 text-xs text-ink/75">
              Horario de atención: Lunes a Viernes · Respuesta habitual menor a
              24 horas hábiles.
            </p>
          </div>
        </div>

        <div className="md:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-ink/15 bg-surface-blue/65 p-6 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
                >
                  Tu Nombre (Opcional)
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
                >
                  Tu Correo Electrónico *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
                >
                  Código u Orden PayPal (Opcional)
                </label>
                <input
                  id="contact-code"
                  type="text"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                  placeholder="AD-XXXX-XXXX"
                  className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 font-mono text-sm uppercase text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
                >
                  Motivo
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
                >
                  <option>Soporte de Licencia VIP</option>
                  <option>Recuperación de Código</option>
                  <option>Consulta de Facturación PayPal</option>
                  <option>Soporte Técnico de Prompts</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-semibold uppercase tracking-wider text-ink/80"
              >
                Mensaje *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                minLength={10}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe brevemente tu consulta o número de orden de PayPal..."
                className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-accent/45 bg-surface p-3 text-xs font-medium text-ink">
                {errorMsg}
              </div>
            )}

            {feedback && (
              <div className="flex items-start gap-2 rounded-xl border border-ink/25 bg-canvas p-3.5 text-xs font-medium text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{feedback}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Mensaje a Soporte
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
