'use client';

import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Ban,
  BookPlus,
  CheckCircle2,
  FileSearch,
  ImagePlus,
  Inbox,
  Loader2,
  LogOut,
  Printer,
  RefreshCw,
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
  SupportMessageRecord,
} from '@/types';
import { BUCKET_HIGHRES, BUCKET_MANUALS, BUCKET_WATERMARKED } from '@/lib/constants';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  detectPdfPageCount,
  generateWatermarkedImageFile,
} from '@/lib/watermark-client';
import { useGalleryModal } from './GalleryContext';

interface DisputeEvidenceResult {
  customer: CustomerRecord | null;
  logs: AuditLogRecord[];
}

interface AdminDashboardClientProps {
  initialAdminEmail: string;
  initialCustomers: CustomerRecord[];
  initialArtworks: ArtworkFull[];
  initialManuals: ManualItem[];
  initialSupportMessages: SupportMessageRecord[];
}

export function AdminDashboardClient({
  initialAdminEmail,
  initialCustomers,
  initialArtworks,
  initialManuals,
  initialSupportMessages,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const { signOut } = useGalleryModal();

  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers);
  const [artworks, setArtworks] = useState<ArtworkFull[]>(initialArtworks);
  const [manuals, setManuals] = useState<ManualItem[]>(initialManuals);
  const [supportMessages, setSupportMessages] = useState<SupportMessageRecord[]>(
    initialSupportMessages
  );
  const [refreshingData, setRefreshingData] = useState(false);

  // Subida real de obras + detección automática de resolución y aspecto
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ArtworkCategory>('fotografia-editorial');
  const [promptPreview, setPromptPreview] = useState('');
  const [promptFull, setPromptFull] = useState('');
  const [motor, setMotor] = useState('Fotografía de Estudio');
  const [aspecto, setAspecto] = useState('');
  const [resolucion, setResolucion] = useState('');
  const [altText, setAltText] = useState('');
  const [highResFile, setHighResFile] = useState<File | null>(null);
  const [watermarkedFile, setWatermarkedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [generatingWatermark, setGeneratingWatermark] = useState(false);
  const [uploadingArt, setUploadingArt] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const artworkFileInputRef = useRef<HTMLInputElement | null>(null);

  // Subida real de manuales PDF/ZIP + detección automática de páginas PDF
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualFormat, setManualFormat] = useState<'PDF' | 'ZIP'>('PDF');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const manualFileInputRef = useRef<HTMLInputElement | null>(null);

  // Verificador y Reporte de Disputas
  const [lookupQuery, setLookupQuery] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidenceResult | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [togglingCustomerId, setTogglingCustomerId] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const refreshAdminData = useCallback(async () => {
    setRefreshingData(true);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCustomers(data.customers || []);
        setArtworks(data.artworks || []);
        setManuals(data.manuals || []);
        setSupportMessages(data.supportMessages || []);
      }
    } finally {
      setRefreshingData(false);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  const handleSelectHighResPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    setWatermarkedFile(null);
    setPreviewDataUrl(null);
    setAspecto('');
    setResolucion('');

    if (!file) {
      setHighResFile(null);
      return;
    }

    setHighResFile(file);
    setGeneratingWatermark(true);
    setUploadMsg(
      'Analizando dimensiones reales y generando vista previa con marca de agua...'
    );

    try {
      const result = await generateWatermarkedImageFile(file);
      setWatermarkedFile(result.previewFile);
      setPreviewDataUrl(result.dataUrl);
      setResolucion(`${result.width}x${result.height}px`);
      setAspecto(result.aspectRatio);
      setUploadMsg(
        `Imagen lista (${result.width}x${result.height}px · Relación ${result.aspectRatio}). Marca de agua generada correctamente.`
      );
    } catch (err) {
      setHighResFile(null);
      setUploadMsg(
        err instanceof Error
          ? err.message
          : 'Error procesando marca de agua en el navegador.'
      );
    } finally {
      setGeneratingWatermark(false);
    }
  };

  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatingWatermark) {
      setUploadMsg('Espera a que termine de generarse la marca de agua.');
      return;
    }
    if (!highResFile || !watermarkedFile) {
      setUploadMsg(
        'Selecciona una imagen válida y espera a que se genere la vista previa con marca de agua.'
      );
      return;
    }
    if (!aspecto.trim() || !resolucion.trim() || !motor.trim()) {
      setUploadMsg('Verifica que motor, aspecto y resolución estén completos.');
      return;
    }

    setUploadingArt(true);
    setUploadMsg('Preparando subida directa segura de alta resolución...');

    try {
      const rawExt = highResFile.name.split('.').pop()?.toLowerCase() || 'png';
      const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt)
        ? rawExt === 'jpeg'
          ? 'jpg'
          : rawExt
        : 'png';

      // Paso 1: Obtener Signed Upload URLs
      const prepRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'prepare',
          title: title.trim(),
          category,
          ext,
        }),
      });
      const prepData = await prepRes.json().catch(() => ({}));
      if (!prepRes.ok || !prepData.slug) {
        setUploadMsg(
          `Error: ${prepData.error || 'No se pudo autorizar la subida.'}`
        );
        setUploadingArt(false);
        return;
      }

      // Paso 2: Subir directamente desde el navegador a Storage (soporta 4K > 4.5 MB sin límite de función serverless)
      const supabase = createSupabaseBrowserClient();
      setUploadMsg('Subiendo vista previa con marca de agua y archivo master 4K...');

      const [wmUpload, hrUpload] = await Promise.all([
        supabase.storage
          .from(BUCKET_WATERMARKED)
          .uploadToSignedUrl(
            prepData.watermarkedPath,
            prepData.watermarkedToken,
            watermarkedFile,
            { contentType: 'image/jpeg' }
          ),
        supabase.storage
          .from(BUCKET_HIGHRES)
          .uploadToSignedUrl(
            prepData.highResPath,
            prepData.highResToken,
            highResFile,
            { contentType: highResFile.type || `image/${ext}` }
          ),
      ]);

      if (wmUpload.error || hrUpload.error) {
        setUploadMsg(
          `Error subiendo archivos: ${
            wmUpload.error?.message || hrUpload.error?.message
          }`
        );
        setUploadingArt(false);
        return;
      }

      // Paso 3: Registrar metadatos verificados en PostgreSQL
      const compRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'complete',
          title: title.trim(),
          slug: prepData.slug,
          category,
          prompt_preview: promptPreview.trim(),
          prompt_full: promptFull.trim(),
          motor: motor.trim(),
          aspecto: aspecto.trim(),
          resolucion: resolucion.trim(),
          alt_text: altText.trim(),
          watermarkedPath: prepData.watermarkedPath,
          highResPath: prepData.highResPath,
        }),
      });
      const compData = await compRes.json().catch(() => ({}));

      if (!compRes.ok || !compData.created) {
        setUploadMsg(
          `Error: ${compData.error || 'No se pudo publicar la obra.'}`
        );
      } else {
        setUploadMsg(
          `Obra publicada correctamente (/arte/${compData.created.slug})`
        );
        setArtworks((prev) => [compData.created, ...prev]);
        setTitle('');
        setPromptPreview('');
        setPromptFull('');
        setAltText('');
        setAspecto('');
        setResolucion('');
        setHighResFile(null);
        setWatermarkedFile(null);
        setPreviewDataUrl(null);
        if (artworkFileInputRef.current) {
          artworkFileInputRef.current.value = '';
        }
      }
    } catch {
      setUploadMsg('Error de red durante la publicación de la obra.');
    } finally {
      setUploadingArt(false);
    }
  };

  const handleDeleteArtwork = async (id: string, artTitle: string) => {
    if (!window.confirm(`¿Eliminar "${artTitle}" del catálogo?`)) return;
    const res = await fetch(`/api/admin/upload?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSelectManualFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setManualFile(file);
    setManualMsg(null);
    if (!file) {
      setManualPages('');
      return;
    }

    const isZip = file.name.toLowerCase().endsWith('.zip');
    setManualFormat(isZip ? 'ZIP' : 'PDF');

    if (!isZip) {
      const detectedPages = await detectPdfPageCount(file);
      if (detectedPages && detectedPages > 0) {
        setManualPages(String(detectedPages));
        setManualMsg(
          `PDF detectado automáticamente: ${detectedPages} página(s).`
        );
      } else {
        setManualPages('');
      }
    } else {
      setManualPages('1');
    }
  };

  const handleUploadManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFile) {
      setManualMsg('Selecciona un archivo PDF o ZIP desde tu dispositivo.');
      return;
    }
    const pagesNum = parseInt(manualPages, 10);
    if (!Number.isFinite(pagesNum) || pagesNum < 1) {
      setManualMsg('Indica el número real de páginas del documento.');
      return;
    }

    setUploadingManual(true);
    setManualMsg('Preparando subida directa del manual técnico...');

    try {
      const prepRes = await fetch('/api/admin/manuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'prepare',
          fileName: manualFile.name,
        }),
      });
      const prepData = await prepRes.json().catch(() => ({}));
      if (!prepRes.ok || !prepData.filePath) {
        setManualMsg(
          `Error: ${prepData.error || 'No se pudo preparar la subida del manual.'}`
        );
        setUploadingManual(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const uploadRes = await supabase.storage
        .from(BUCKET_MANUALS)
        .uploadToSignedUrl(prepData.filePath, prepData.token, manualFile, {
          contentType:
            manualFormat === 'ZIP' ? 'application/zip' : 'application/pdf',
        });

      if (uploadRes.error) {
        setManualMsg(`Error subiendo archivo: ${uploadRes.error.message}`);
        setUploadingManual(false);
        return;
      }

      const compRes = await fetch('/api/admin/manuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'complete',
          title: manualTitle.trim(),
          description: manualDesc.trim(),
          pages_count: pagesNum,
          format: manualFormat,
          filePath: prepData.filePath,
          fileName: prepData.safeName,
        }),
      });
      const compData = await compRes.json().catch(() => ({}));

      if (!compRes.ok || !compData.created) {
        setManualMsg(
          `Error: ${compData.error || 'No se pudo registrar el manual.'}`
        );
      } else {
        setManualMsg(`Manual "${compData.created.title}" publicado correctamente.`);
        setManuals((prev) => [compData.created, ...prev]);
        setManualTitle('');
        setManualDesc('');
        setManualPages('');
        setManualFile(null);
        if (manualFileInputRef.current) {
          manualFileInputRef.current.value = '';
        }
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

  const fetchDisputeEvidence = useCallback(async (queryToSearch: string) => {
    const clean = queryToSearch.trim();
    if (!clean) return;
    setLookupLoading(true);
    setLookupSearched(false);
    try {
      const res = await fetch(`/api/admin?lookup=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      setEvidence(data.evidence || { customer: null, logs: [] });
      setLookupSearched(true);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const handleLookupDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchDisputeEvidence(lookupQuery);
  };

  const handleToggleCustomerLicense = async (customer: CustomerRecord) => {
    const nextState = !customer.is_active;
    const actionLabel = nextState ? 'reactivar' : 'revocar';
    if (
      !window.confirm(
        `¿Confirmas que deseas ${actionLabel} la licencia ${customer.license_code} (${customer.email})?`
      )
    ) {
      return;
    }

    setTogglingCustomerId(customer.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_license',
          customerId: customer.id,
          isActive: nextState,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.customer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? data.customer : c))
        );
        if (evidence?.customer?.id === customer.id) {
          setEvidence((prev) =>
            prev ? { ...prev, customer: data.customer } : prev
          );
        }
      }
    } finally {
      setTogglingCustomerId(null);
    }
  };

  const handleToggleSupportTicket = async (ticket: SupportMessageRecord) => {
    const nextStatus = ticket.status === 'resolved' ? 'open' : 'resolved';
    setUpdatingTicketId(ticket.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_support_status',
          messageId: ticket.id,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        setSupportMessages((prev) =>
          prev.map((m) => (m.id === ticket.id ? { ...m, status: nextStatus } : m))
        );
      }
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-center no-print">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-surface px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Sesión Verificada: {initialAdminEmail}
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
          <span className="rounded-xl border border-ink/20 bg-surface px-3 py-2">
            Soporte:{' '}
            {supportMessages.filter((m) => m.status === 'open').length} abiertos
          </span>
          <button
            type="button"
            onClick={refreshAdminData}
            disabled={refreshingData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/25 bg-canvas px-3 py-2 text-ink hover:bg-surface"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshingData ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>
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
        {/* Columna Izquierda: Subida Real de Fotos y Manuales + Inventario */}
        <section className="space-y-8 lg:col-span-6 no-print">
          {/* Formulario Subida Real de Obra */}
          <div className="rounded-3xl border border-ink/20 bg-surface-blue/70 p-6">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Publicar Nueva Obra en el Catálogo
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink/75">
              Selecciona la imagen original 4K desde tu equipo. El sistema
              detecta automáticamente su resolución y relación de aspecto reales
              y genera la vista previa con marca de agua.
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
                    ref={artworkFileInputRef}
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
                    Vista Previa Automática con Marca de Agua ({resolucion} ·{' '}
                    {aspecto}):
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
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArtworkCategory)}
                    className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                  >
                    <option value="fotografia-editorial">Fotografía Editorial</option>
                    <option value="arte-conceptual">Arte Conceptual</option>
                    <option value="ilustracion-digital">Ilustración Digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Descripción / Dirección de Arte (Extracto público)
                </label>
                <input
                  type="text"
                  value={promptPreview}
                  onChange={(e) => setPromptPreview(e.target.value)}
                  placeholder="Breve descripción visible en la tarjeta pública..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/80">
                  Ficha Técnica / Detalles de Composición *
                </label>
                <textarea
                  rows={3}
                  required
                  value={promptFull}
                  onChange={(e) => setPromptFull(e.target.value)}
                  placeholder="Detalles técnicos, esquema de iluminación, paleta o técnica..."
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
                  placeholder="Descripción accesible de la obra..."
                  className="mt-1 w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Estilo / Técnica *
                  </label>
                  <input
                    type="text"
                    required
                    value={motor}
                    onChange={(e) => setMotor(e.target.value)}
                    placeholder="Ej. Fotografía de Estudio / Óleo Digital"
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Aspecto Real *
                  </label>
                  <input
                    type="text"
                    required
                    value={aspecto}
                    onChange={(e) => setAspecto(e.target.value)}
                    placeholder="Auto al elegir foto"
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-2.5 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Resolución Real *
                  </label>
                  <input
                    type="text"
                    required
                    value={resolucion}
                    onChange={(e) => setResolucion(e.target.value)}
                    placeholder="Auto al elegir foto"
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
                disabled={
                  uploadingArt ||
                  generatingWatermark ||
                  !highResFile ||
                  !watermarkedFile
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {(uploadingArt || generatingWatermark) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {generatingWatermark
                  ? 'Generando Marca de Agua...'
                  : uploadingArt
                  ? 'Subiendo Archivos en Alta Resolución...'
                  : 'Publicar Obra en el Catálogo'}
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
                  ref={manualFileInputRef}
                  type="file"
                  accept=".pdf,.zip,application/pdf,application/zip"
                  onChange={handleSelectManualFile}
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
                  placeholder="Ej. Catálogo Editorial de Obras en 4K"
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
                    Páginas Reales *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    placeholder="Detectado al elegir PDF"
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs text-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/75">
                    Formato
                  </label>
                  <select
                    value={manualFormat}
                    onChange={(e) =>
                      setManualFormat(e.target.value as 'PDF' | 'ZIP')
                    }
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-xs text-ink"
                  >
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
              </div>

              {manualMsg && (
                <div className="rounded-xl border border-ink/25 bg-canvas p-3 text-xs font-medium text-ink">
                  {manualMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingManual || !manualFile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-60"
              >
                {uploadingManual && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadingManual ? 'Subiendo archivo...' : 'Publicar Manual VIP'}
              </button>
            </form>
          </div>

          {/* Inventario Real Actual */}
          <div className="rounded-3xl border border-ink/15 bg-canvas p-6">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Inventario Activo ({artworks.length} obras · {manuals.length}{' '}
              manuales)
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
                      {a.category} · {a.render_params?.resolucion || ''} · /arte/
                      {a.slug}
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
                    <p className="truncate font-semibold text-ink">
                      [Manual] {m.title}
                    </p>
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

        {/* Columna Derecha: Verificador de Licencias, Reporte Anti-Disputas y Bandeja de Soporte */}
        <section className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-ink/20 bg-surface/70 p-6 no-print">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl font-semibold text-ink">
                Verificador de Licencias &amp; Exportador Anti-Disputas PayPal
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink/75">
              Busca por correo de Google del comprador, ID de Orden PayPal o
              referencia interna para verificar validez y generar el reporte PDF
              oficial.
            </p>

            <form onSubmit={handleLookupDispute} className="mt-4 flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Ej. comprador@gmail.com o ID de Orden PayPal..."
                className="flex-1 rounded-xl border border-ink/25 bg-white px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-canvas hover:opacity-90 disabled:opacity-60"
              >
                {lookupLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Consultar
              </button>
            </form>
          </div>

          {lookupSearched && evidence && (
            <div className="rounded-3xl border-2 border-ink bg-canvas p-6 sm:p-8 print-only-full">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/20 pb-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ink/70">
                    ArteDigital.click — Dossier Técnico para Centro de Resoluciones
                    PayPal
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-semibold text-ink">
                    Reporte Forense de Entrega Digital (DIGITAL_GOODS)
                  </h3>
                  <p className="mt-1 text-xs text-ink/75">
                    Generado el: {new Date().toISOString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 no-print">
                  {evidence.customer && (
                    <button
                      type="button"
                      onClick={() =>
                        evidence.customer &&
                        handleToggleCustomerLicense(evidence.customer)
                      }
                      disabled={togglingCustomerId === evidence.customer.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-ink/25 bg-surface px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-surface-blue"
                    >
                      <Ban className="h-3.5 w-3.5 text-accent" />
                      {evidence.customer.is_active
                        ? 'Revocar Licencia'
                        : 'Reactivar Licencia'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir / Guardar PDF
                  </button>
                </div>
              </div>

              {evidence.customer ? (
                <div className="mt-5 grid gap-3 rounded-2xl border border-ink/20 bg-surface/65 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      Comprador:
                    </span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.email}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      Código de Licencia:
                    </span>
                    <p className="mt-0.5 font-mono text-sm font-bold text-ink">
                      {evidence.customer.license_code}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      PayPal Order ID:
                    </span>
                    <p className="mt-0.5 font-mono text-ink">
                      {evidence.customer.paypal_order_id}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      Estado &amp; Monto:
                    </span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.is_active
                        ? 'ACTIVA (COMPLETED)'
                        : 'REVOCADA'}{' '}
                      · ${Number(evidence.customer.amount_usd).toFixed(2)} USD
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      PayPal Payer ID:
                    </span>
                    <p className="mt-0.5 font-mono text-ink">
                      {evidence.customer.paypal_payer_id ||
                        'Registrado vía Checkout'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-ink/65">
                      Versión Legal Aceptada:
                    </span>
                    <p className="mt-0.5 font-semibold text-ink">
                      {evidence.customer.terms_version} (Venta Final Digital)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink/20 bg-surface p-4 text-xs text-ink">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-accent" />
                  No se encontró un registro de cliente para &ldquo;
                  {lookupQuery}&rdquo;.
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ink/75">
                  Cronología Verificada de Eventos Forenses ({evidence.logs.length}{' '}
                  registros)
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
                          IP: <strong>{log.ip_address}</strong> · UA:{' '}
                          {log.user_agent}
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
              Últimas Licencias Emitidas ({customers.length})
            </h3>
            {customers.length === 0 ? (
              <p className="mt-2 text-xs text-ink/75">
                Aún no hay compras registradas.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink/15 text-ink/70">
                      <th className="py-2 pr-3">Código</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-ink/10">
                        <td className="py-2.5 pr-3 font-mono font-bold text-ink">
                          {c.license_code}
                        </td>
                        <td className="py-2.5 pr-3 text-ink">{c.email}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              c.is_active
                                ? 'bg-surface text-ink'
                                : 'bg-accent/20 text-accent'
                            }`}
                          >
                            {c.is_active ? 'Activa' : 'Revocada'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setLookupQuery(c.license_code);
                                fetchDisputeEvidence(c.license_code);
                              }}
                              className="font-semibold text-accent underline"
                            >
                              Cargar Dossier
                            </button>
                            <button
                              type="button"
                              disabled={togglingCustomerId === c.id}
                              onClick={() => handleToggleCustomerLicense(c)}
                              className="font-semibold text-ink/75 underline hover:text-accent"
                            >
                              {c.is_active ? 'Revocar' : 'Reactivar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bandeja Real de Soporte y Contacto */}
          <div className="rounded-3xl border border-ink/15 bg-canvas p-6 no-print">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-accent" />
                <h3 className="font-serif text-xl font-semibold text-ink">
                  Bandeja de Soporte y Contacto ({supportMessages.length})
                </h3>
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink">
                {supportMessages.filter((m) => m.status === 'open').length}{' '}
                pendientes
              </span>
            </div>

            {supportMessages.length === 0 ? (
              <p className="mt-3 text-xs text-ink/75">
                No hay mensajes de soporte registrados todavía.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {supportMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border p-4 text-xs ${
                      msg.status === 'resolved'
                        ? 'border-ink/10 bg-surface/35 opacity-80'
                        : 'border-ink/20 bg-surface-blue/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-ink">{msg.subject}</span>
                        <p className="mt-0.5 text-ink/80">
                          De:{' '}
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(
                              msg.subject
                            )}`}
                            className="font-semibold text-accent underline"
                          >
                            {msg.email}
                          </a>
                          {msg.name ? ` (${msg.name})` : ''}
                          {msg.order_or_license
                            ? ` · Ref: ${msg.order_or_license}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            msg.status === 'resolved'
                              ? 'bg-canvas text-ink/60'
                              : 'bg-accent text-white'
                          }`}
                        >
                          {msg.status === 'resolved' ? 'Atendido' : 'Pendiente'}
                        </span>
                        <button
                          type="button"
                          disabled={updatingTicketId === msg.id}
                          onClick={() => handleToggleSupportTicket(msg)}
                          className="rounded-lg border border-ink/20 bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink hover:bg-surface"
                        >
                          {msg.status === 'resolved'
                            ? 'Reabrir'
                            : 'Marcar Atendido'}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2.5 whitespace-pre-wrap rounded-xl bg-white p-3 text-xs text-ink">
                      {msg.message}
                    </p>
                    <p className="mt-2 font-mono text-[10px] text-ink/60">
                      Recibido: {msg.created_at} · IP: {msg.ip_address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
