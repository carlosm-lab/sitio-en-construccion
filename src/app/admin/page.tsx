'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  BookPlus,
  CheckCircle2,
  FileSearch,
  ImagePlus,
  Loader2,
  LogOut,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  ArtworkCategory,
  ArtworkFull,
  AuditLogRecord,
  CustomerRecord,
  ManualItem,
} from '@/types';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { generateWatermarkedImageFile } from '@/lib/watermark-client';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

interface DisputeEvidenceResult {
  customer: CustomerRecord | null;
  logs: AuditLogRecord[];
}

export default function AdminDashboardPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorizedAdminEmail, setAuthorizedAdminEmail] = useState<string | null>(
    null
  );
  const [authStatusCode, setAuthStatusCode] = useState<number>(0);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [signedInWrongEmail, setSignedInWrongEmail] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [artworks, setArtworks] = useState<ArtworkFull[]>([]);
  const [manuals, setManuals] = useState<ManualItem[]>([]);

  // Subida real de fotos + marca de agua automática
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ArtworkCategory>('retratos-ia');
  const [promptPreview, setPromptPreview] = useState('');
  const [promptFull, setPromptFull] = useState('');
  const [motor, setMotor] = useState('Midjourney v6.1');
  const [aspecto, setAspecto] = useState('4:5');
  const [resolucion, setResolucion] = useState('4096x5120px');
  const [altText, setAltText] = useState('');
  const [highResFile, setHighResFile] = useState<File | null>(null);
  const [watermarkedFile, setWatermarkedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadingArt, setUploadingArt] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Subida real de manuales PDF
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualPages, setManualPages] = useState('24');
  const [manualFormat, setManualFormat] = useState('PDF');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);

  // Verificador y Reporte de Disputas
  const [lookupQuery, setLookupQuery] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidenceResult | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  const loadAdminData = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        setAuthStatusCode(res.status);
        setAuthErrorMsg(data.error || 'Acceso no autorizado.');
        setSignedInWrongEmail(data.email || null);
        setAuthorizedAdminEmail(null);
      } else {
        setAuthorizedAdminEmail(data.adminEmail);
        setCustomers(data.customers || []);
        setArtworks(data.artworks || []);
        setManuals(data.manuals || []);
        setAuthStatusCode(200);
        setAuthErrorMsg(null);
      }
    } catch {
      setAuthErrorMsg('Error conectando con el servidor de administración.');
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAuthorizedAdminEmail(null);
    setSignedInWrongEmail(null);
    setAuthStatusCode(401);
  };

  const handleSelectHighResPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHighResFile(file);
    setUploadMsg('Generando vista previa comprimida con marca de agua...');
    try {
      const { previewFile, dataUrl } = await generateWatermarkedImageFile(file);
      setWatermarkedFile(previewFile);
      setPreviewDataUrl(dataUrl);
      setUploadMsg(
        'Vista previa con marca de agua generada. Lista para subir a Supabase Storage.'
      );
    } catch (err) {
      setUploadMsg(
        err instanceof Error
          ? err.message
          : 'Error procesando marca de agua en el navegador.'
      );
    }
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!highResFile) {
      setUploadMsg('Selecciona una imagen de tu dispositivo primero.');
      return;
    }

    setUploadingArt(true);
    setUploadMsg('Subiendo archivos a Supabase Storage...');

    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('prompt_preview', promptPreview);
      fd.append('prompt_full', promptFull);
      fd.append('motor', motor);
      fd.append('aspecto', aspecto);
      fd.append('resolucion', resolucion);
      fd.append('alt_text', altText);
      fd.append('highResFile', highResFile);
      if (watermarkedFile) {
        fd.append('watermarkedFile', watermarkedFile);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadMsg(`Error: ${data.error || 'No se pudo publicar la obra.'}`);
      } else {
        setUploadMsg(
          `Publicado correctamente en Supabase Storage y PostgreSQL (/arte/${data.created.slug})`
        );
        setArtworks((prev) => [data.created, ...prev]);
        setTitle('');
        setPromptPreview('');
        setPromptFull('');
        setAltText('');
        setHighResFile(null);
        setWatermarkedFile(null);
        setPreviewDataUrl(null);
      }
    } catch {
      setUploadMsg('Error de red durante la subida a Supabase Storage.');
    } finally {
      setUploadingArt(false);
    }
  };

  const handleDeleteArtwork = async (id: string, artTitle: string) => {
    if (!window.confirm(`¿Eliminar "${artTitle}" de Supabase y Storage?`)) return;
    const res = await fetch(`/api/admin/upload?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleUploadManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFile) {
      setManualMsg('Selecciona un archivo PDF o ZIP desde tu dispositivo.');
      return;
    }

    setUploadingManual(true);
    setManualMsg('Subiendo manual al bucket privado vip-manuals...');

    try {
      const fd = new FormData();
      fd.append('title', manualTitle);
      fd.append('description', manualDesc);
      fd.append('pages_count', manualPages);
      fd.append('format', manualFormat);
      fd.append('file', manualFile);

      const res = await fetch('/api/admin/manuals', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        setManualMsg(`Error: ${data.error || 'No se pudo subir el manual.'}`);
      } else {
        setManualMsg(`Manual "${data.created.title}" subido al bucket privado.`);
        setManuals((prev) => [data.created, ...prev]);
        setManualTitle('');
        setManualDesc('');
        setManualFile(null);
      }
    } catch {
      setManualMsg('Error de red subiendo manual.');
    } finally {
      setUploadingManual(false);
    }
  };

  const handleDeleteManual = async (id: string, mTitle: string) => {
    if (!window.confirm(`¿Eliminar manual "${mTitle}"?`)) return;
    const res = await fetch(`/api/admin/manuals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setManuals((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleLookupDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupSearched(false);

    const res = await fetch(
      `/api/admin?lookup=${encodeURIComponent(lookupQuery.trim())}`
    );
    const data = await res.json();
    setEvidence(data.evidence || { customer: null, logs: [] });
    setLookupSearched(true);
  };

  if (checkingAuth) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="mt-3 text-sm font-medium text-ink/75">
          Verificando sesión Google OAuth en Supabase Auth...
        </p>
      </div>
    );
  }

  if (!authorizedAdminEmail) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-ink/20 bg-surface/75 p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-canvas px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Protegido con Google OAuth + RLS
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
            Panel de Administración
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-ink/80">
            Acceso exclusivo mediante Google OAuth verificado en el servidor contra
            la tabla <code className="font-mono font-semibold">public.admin_users</code>.
            No existen contraseñas vulnerables.
          </p>

          {authStatusCode === 403 && signedInWrongEmail ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-accent bg-canvas p-4 text-xs text-ink">
                <p className="font-bold text-accent">403 — Acceso Denegado</p>
                <p className="mt-1">
                  Has iniciado sesión como <strong>{signedInWrongEmail}</strong>,
                  pero esa cuenta no está autorizada en{' '}
                  <code>public.admin_users</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-canvas"
              >
                Cerrar sesión e intentar con otra cuenta Google
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <GoogleSignInButton
                nextPath="/admin"
                label="Iniciar Sesión con Google (Admin)"
              />
              {authErrorMsg && authStatusCode !== 401 && (
                <p className="text-xs font-medium text-accent">{authErrorMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-center no-print">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Sesión Google Verificada: {authorizedAdminEmail}
          </span>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">
            Centro de Control ArteDigital.click
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
          <span className="rounded-xl border border-ink/20 bg-surface px-3 py-2">
            Obras: {artworks.length}
          </span>
          <span className="rounded-xl border border-ink/20 bg-surface px-3 py-2">
            Manuales: {manuals.length}
          </span>
          <span className="rounded-xl border border-ink/20 bg-surface px-3 py-2">
            Licencias: {customers.length}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/25 bg-canvas px-3 py-2 text-ink hover:bg-accent hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Subida Real de Fotos y Manuales + Listado */}
        <section className="space-y-8 lg:col-span-6 no-print">
          {/* Formulario Subida Real de Foto */}
          <div className="rounded-3xl border border-ink/20 bg-surface-blue/70 p-6">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Subir Nueva Obra y Foto a Supabase Storage
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink/75">
              Selecciona la foto original 4K desde tu PC o móvil. El sistema genera
              automáticamente la versión comprimida con marca de agua y guarda
              ambas en Supabase Storage.
            </p>

            <form onSubmit={handleUploadArtwork} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink/85">
                  1. Archivo de Imagen Master (JPG, PNG, WEBP) *
                </label>
                <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/30 bg-canvas p-5 text-center transition-colors hover:border-accent">
                  <UploadCloud className="h-7 w-7 text-accent" />
                  <span className="mt-2 text-xs font-semibold text-ink">
                    {highResFile
                      ? `Seleccionado: ${highResFile.name} (${Math.round(
                          highResFile.size / 1024
                        )} KB)`
                      : 'Haz clic aquí para elegir la fotografía de tu equipo'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleSelectHighResPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {previewDataUrl && (
                <div className="rounded-2xl border border-ink/20 bg-canvas p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/70">
                    Vista Previa Automática con Marca de Agua:
                  </p>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                    <Image
                      src={previewDataUrl}
                      alt="Vista previa con marca de agua"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/80">
                    Título de la Obra *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Retrato Editorial Luz Azul"
                    className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/80">
                    Categoría SEO *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArtworkCategory)}
                    className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="retratos-ia">Retratos IA</option>
                    <option value="concept-art">Concept Art</option>
                    <option value="guias-personajes">Guías de Personajes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Prompt Preview (Texto visible público)
                </label>
                <input
                  type="text"
                  value={promptPreview}
                  onChange={(e) => setPromptPreview(e.target.value)}
                  placeholder="Inicio corto del prompt visible en la tarjeta pública..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Prompt Completo Protegido (Solo VIP) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={promptFull}
                  onChange={(e) => setPromptFull(e.target.value)}
                  placeholder="Prompt técnico íntegro + --cref + --seed..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 font-mono text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Texto Alternativo SEO (Alt Text)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descripción accesible e indexable de la obra..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-xs text-ink"
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
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-xs text-ink"
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
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-xs text-ink"
                  />
                </div>
              </div>

              {uploadMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-ink/25 bg-canvas p-3 text-xs font-medium text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{uploadMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingArt}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {uploadingArt && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadingArt
                  ? 'Subiendo a Supabase Storage...'
                  : 'Publicar Obra Real en Supabase'}
              </button>
            </form>
          </div>

          {/* Formulario Subida Real de Manuales PDF */}
          <div className="rounded-3xl border border-ink/20 bg-surface/70 p-6">
            <div className="flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Subir Manual Técnico (PDF / ZIP Privado)
              </h2>
            </div>

            <form onSubmit={handleUploadManual} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Archivo PDF / ZIP *
                </label>
                <input
                  type="file"
                  accept=".pdf,.zip,.txt"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3 py-2 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Título del Manual *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ej. Manual Consistencia de Personajes 2026"
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Descripción *
                </label>
                <textarea
                  rows={2}
                  required
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Resumen del contenido técnico del manual..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2 text-xs text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Páginas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Formato
                  </label>
                  <input
                    type="text"
                    value={manualFormat}
                    onChange={(e) => setManualFormat(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs text-ink"
                  />
                </div>
              </div>

              {manualMsg && (
                <div className="rounded-xl border border-ink/25 bg-canvas p-3 text-xs font-medium text-ink">
                  {manualMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingManual}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-60"
              >
                {uploadingManual && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadingManual ? 'Subiendo archivo...' : 'Subir Manual a Storage Privado'}
              </button>
            </form>
          </div>

          {/* Inventario Real Actual en Supabase */}
          <div className="rounded-3xl border border-ink/15 bg-canvas p-6">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Inventario Real en Supabase ({artworks.length} obras · {manuals.length} manuales)
            </h3>

            <div className="mt-4 space-y-2.5">
              {artworks.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 bg-surface/50 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{a.title}</p>
                    <p className="truncate text-[11px] text-ink/70">
                      {a.category} · /arte/{a.slug}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteArtwork(a.id, a.title)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink/20 bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              ))}

              {manuals.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 bg-surface-blue/60 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">[Manual] {m.title}</p>
                    <p className="truncate text-[11px] text-ink/70">
                      {m.format} · {m.pages_count} págs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteManual(m.id, m.title)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink/20 bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Columna Derecha: Verificador de Licencias & Reporte Anti-Disputas */}
        <section className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-ink/20 bg-surface/70 p-6 no-print">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-accent" />
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
                className="flex-1 rounded-xl border border-ink/25 bg-white px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-canvas hover:opacity-90"
              >
                Consultar
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
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 no-print"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir / Guardar PDF
                </button>
              </div>

              {evidence.customer ? (
                <div className="mt-5 grid gap-3 rounded-2xl border border-ink/20 bg-surface/65 p-4 text-xs sm:grid-cols-2">
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
                      {Number(evidence.customer.amount_usd).toFixed(2)} USD
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
                  <ShieldAlert className="h-4 w-4 shrink-0 text-accent" />
                  No se encontró un registro de cliente para &ldquo;{lookupQuery}&rdquo;.
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ink/75">
                  Cronología Verificada (`audit_logs`: {evidence.logs.length})
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
                        className="rounded-xl border border-ink/15 bg-surface-blue/55 p-3 text-xs"
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
                        <pre className="mt-1.5 overflow-x-auto rounded bg-white p-2 font-mono text-[10px] text-ink/85">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista rápida de últimas compras reales */}
          <div className="rounded-3xl border border-ink/15 bg-surface-blue/50 p-6 no-print">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Últimas Licencias Emitidas en Supabase
            </h3>
            {customers.length === 0 ? (
              <p className="mt-2 text-xs text-ink/75">
                Aún no hay compras registradas en la base de datos.
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
                            className="font-semibold text-accent underline"
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
      </div>
    </div>
  );
}
