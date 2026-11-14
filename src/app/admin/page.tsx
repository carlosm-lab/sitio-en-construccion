'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  FileSearch,
  Lock,
  PlusCircle,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { ArtworkCategory, AuditLogRecord, CustomerRecord } from '@/types';

interface DisputeEvidenceResult {
  customer: CustomerRecord | null;
  logs: AuditLogRecord[];
}

export default function AdminDashboardPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [artworksCount, setArtworksCount] = useState(0);

  // Gestor de contenido
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ArtworkCategory>('retratos-ia');
  const [promptPreview, setPromptPreview] = useState('');
  const [promptFull, setPromptFull] = useState('');
  const [watermarkedUrl, setWatermarkedUrl] = useState('');
  const [highResUrl, setHighResUrl] = useState('');
  const [motor, setMotor] = useState('Midjourney v6.1');
  const [aspecto, setAspecto] = useState('4:5');
  const [resolucion, setResolucion] = useState('4096x5120px');
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Verificador y Reporte de Disputas
  const [lookupQuery, setLookupQuery] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidenceResult | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch('/api/admin', {
      headers: { 'x-admin-password': adminPassword },
    });
    if (!res.ok) {
      setAuthError('Contraseña maestra incorrecta o ADMIN_SECRET_PASSWORD no definida.');
      return;
    }
    const data = await res.json();
    setCustomers(data.customers || []);
    setArtworksCount(data.artworksCount || 0);
    setAuthenticated(true);
  };

  const handleCreateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMsg(null);

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
      body: JSON.stringify({
        title,
        category,
        prompt_preview: promptPreview,
        prompt_full: promptFull,
        watermarked_url: watermarkedUrl || highResUrl,
        high_res_url: highResUrl,
        motor,
        aspecto,
        resolucion,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setUploadMsg(`Error: ${data.error || 'No se pudo publicar la obra.'}`);
      return;
    }

    setUploadMsg(`Obra "${data.created.title}" publicada con slug /arte/${data.created.slug}`);
    setArtworksCount((c) => c + 1);
    setTitle('');
    setPromptPreview('');
    setPromptFull('');
    setWatermarkedUrl('');
    setHighResUrl('');
  };

  const handleLookupDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupSearched(false);

    const res = await fetch(
      `/api/admin?lookup=${encodeURIComponent(lookupQuery.trim())}`,
      {
        headers: { 'x-admin-password': adminPassword },
      }
    );
    const data = await res.json();
    setEvidence(data.evidence || { customer: null, logs: [] });
    setLookupSearched(true);
  };

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-ink/20 bg-surface/65 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
            <Lock className="h-3.5 w-3.5" />
            Acceso Restringido
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
            Panel de Administración
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/75">
            Ingresa la contraseña maestra (<code>ADMIN_SECRET_PASSWORD</code>) para
            gestionar el catálogo, verificar licencias y exportar evidencia contra
            disputas de PayPal.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña maestra..."
              className="w-full rounded-xl border border-ink/25 bg-canvas px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
            />
            {authError && (
              <p className="text-xs font-semibold text-ink">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-canvas hover:opacity-90"
            >
              Desbloquear Panel Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-center no-print">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administración &amp; Auditoría Forense
          </span>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
            Centro de Control ArteDigital.click
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-ink">
          <span className="rounded-xl border border-ink/20 bg-surface px-3.5 py-2">
            Obras activas: {artworksCount}
          </span>
          <span className="rounded-xl border border-ink/20 bg-surface px-3.5 py-2">
            Licencias registradas: {customers.length}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Verificador de Licencias & Generador de Evidencia PDF */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-ink/20 bg-surface/55 p-6 no-print">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-ink" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Verificador de Licencias &amp; Exportador Anti-Disputas PayPal
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink/75">
              Busca por Código de Miembro (<code>AD-XXXX-XXXX</code>), ID de Orden
              PayPal o correo del comprador para verificar validez y generar el
              reporte PDF oficial.
            </p>

            <form onSubmit={handleLookupDispute} className="mt-4 flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Ej. AD-8X4P-9K2M, Order ID PayPal o email..."
                className="flex-1 rounded-xl border border-ink/25 bg-canvas px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-canvas hover:opacity-90"
              >
                Consultar Evidencia
              </button>
            </form>
          </div>

          {lookupSearched && evidence && (
            <div className="rounded-3xl border-2 border-ink bg-canvas p-6 sm:p-8 print-only-full">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/20 pb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink/70">
                    ArteDigital.click — Dossier Técnico para Centro de Resoluciones PayPal
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">
                    Reporte Forense de Entrega Digital (DIGITAL_GOODS)
                  </h3>
                  <p className="mt-1 text-xs text-ink/75">
                    Generado el: {new Date().toISOString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-canvas hover:opacity-90 no-print"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Guardar como PDF
                </button>
              </div>

              {evidence.customer ? (
                <div className="mt-5 grid gap-3 rounded-2xl border border-ink/20 bg-surface/60 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-bold uppercase text-ink/65">Comprador:</span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.email}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">Código de Licencia:</span>
                    <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                      {evidence.customer.license_code}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">PayPal Order ID:</span>
                    <p className="mt-0.5 font-mono text-ink">
                      {evidence.customer.paypal_order_id}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">Estado &amp; Monto:</span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.is_active ? 'ACTIVA (COMPLETED)' : 'REVOCADA'} · $
                      {evidence.customer.amount_usd.toFixed(2)} USD
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">PayPal Payer ID:</span>
                    <p className="mt-0.5 font-mono text-ink">
                      {evidence.customer.paypal_payer_id || 'Registrado vía Checkout'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">Versión Legal Aceptada:</span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.terms_version} (Venta Final Digital)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink/20 bg-surface p-4 text-xs text-ink">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  No se encontró un registro de cliente para &ldquo;{lookupQuery}&rdquo;.
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ink/75">
                  Cronología Verificada de Eventos (`audit_logs`: {evidence.logs.length})
                </h4>
                {evidence.logs.length === 0 ? (
                  <p className="mt-2 text-xs text-ink/70">
                    Sin eventos registrados para esta búsqueda.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {evidence.logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-ink/15 bg-surface/40 p-3 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded bg-ink px-2 py-0.5 font-mono text-[11px] font-semibold text-canvas">
                            {log.action}
                          </span>
                          <span className="font-mono text-[11px] text-ink/75">
                            {log.created_at}
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-[11px] text-ink">
                          IP: <strong>{log.ip_address}</strong> · UA: {log.user_agent}
                        </p>
                        <pre className="mt-1.5 overflow-x-auto rounded bg-canvas p-2 font-mono text-[10px] text-ink/85">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista rápida de últimas compras */}
          <div className="rounded-3xl border border-ink/15 bg-surface/45 p-6 no-print">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Últimas Licencias Emitidas
            </h3>
            {customers.length === 0 ? (
              <p className="mt-2 text-xs text-ink/75">
                Aún no hay compras registradas en este entorno.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/15 text-ink/70">
                      <th className="py-2 pr-3">Código</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Orden PayPal</th>
                      <th className="py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-ink/10">
                        <td className="py-2.5 pr-3 font-mono font-bold text-ink">
                          {c.license_code}
                        </td>
                        <td className="py-2.5 pr-3 text-ink">{c.email}</td>
                        <td className="py-2.5 pr-3 font-mono text-ink/80">
                          {c.paypal_order_id}
                        </td>
                        <td className="py-2.5">
                          <button
                            type="button"
                            onClick={() => setLookupQuery(c.license_code)}
                            className="font-semibold underline"
                          >
                            Cargar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Columna Derecha: Gestor de Contenido (Subir nuevas obras) */}
        <section className="lg:col-span-5 no-print">
          <div className="rounded-3xl border border-ink/20 bg-surface/55 p-6">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-ink" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Gestor de Contenido (+1,000 Obras)
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink/75">
              Publica nuevas obras con marca de agua pública y master 4K privado.
              Se indexan automáticamente en el <code>sitemap.xml</code>.
            </p>

            <form onSubmit={handleCreateArtwork} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Título de la Obra *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Estudio de Luz Nórdica en Atelier"
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Categoría SEO *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ArtworkCategory)}
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                >
                  <option value="retratos-ia">Retratos IA</option>
                  <option value="concept-art">Concept Art</option>
                  <option value="guias-personajes">Guías de Personajes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  URL Imagen Pública (Con Marca de Agua / Comprimida)
                </label>
                <input
                  type="url"
                  value={watermarkedUrl}
                  onChange={(e) => setWatermarkedUrl(e.target.value)}
                  placeholder="https://... (si se omite usa la URL master con overlay)"
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  URL Master Alta Resolución (Privada VIP) *
                </label>
                <input
                  type="url"
                  required
                  value={highResUrl}
                  onChange={(e) => setHighResUrl(e.target.value)}
                  placeholder="https://...supabase.co/storage/v1/..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Prompt Preview (Público corto)
                </label>
                <input
                  type="text"
                  value={promptPreview}
                  onChange={(e) => setPromptPreview(e.target.value)}
                  placeholder="Primeros caracteres visibles en galería..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Prompt Completo Protegido *
                </label>
                <textarea
                  rows={3}
                  required
                  value={promptFull}
                  onChange={(e) => setPromptFull(e.target.value)}
                  placeholder="Prompt técnico íntegro + --cref + --seed..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-canvas px-3.5 py-2.5 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Motor
                  </label>
                  <input
                    type="text"
                    value={motor}
                    onChange={(e) => setMotor(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-canvas px-2.5 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Aspecto
                  </label>
                  <input
                    type="text"
                    value={aspecto}
                    onChange={(e) => setAspecto(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-canvas px-2.5 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Resolución
                  </label>
                  <input
                    type="text"
                    value={resolucion}
                    onChange={(e) => setResolucion(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-canvas px-2.5 py-2 text-xs text-ink"
                  />
                </div>
              </div>

              {uploadMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-ink/25 bg-canvas p-3 text-xs font-medium text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{uploadMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-canvas hover:opacity-90"
              >
                Publicar Obra en el Catálogo
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
