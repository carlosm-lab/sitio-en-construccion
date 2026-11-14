import crypto from 'crypto';
import {
  ArtworkCategory,
  ArtworkFull,
  ArtworkPublic,
  AuditAction,
  AuditLogRecord,
  CustomerRecord,
  ManualItem,
  SupportMessageRecord,
} from '@/types';
import {
  BUCKET_HIGHRES,
  BUCKET_MANUALS,
  BUCKET_WATERMARKED,
} from './constants';
import { getSupabaseAdmin } from './supabase';

/**
 * Valida estrictamente el formato de correo y rechaza comodines SQL/PostgREST (%, _, \, comas, paréntesis).
 */
export function isValidCleanEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  if (/[%\\,()'"\s<>]/.test(trimmed)) return false;
  return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
    trimmed
  );
}

export function isValidLicenseCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^AD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim().toUpperCase());
}

/**
 * Valida magic bytes reales de imágenes (PNG, JPEG, WEBP).
 */
export function detectImageMimeFromMagicBytes(
  buf: Buffer
): { mime: string; ext: 'jpg' | 'png' | 'webp' } | null {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: 'png' };
  }

  // WEBP: RIFF....WEBP
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }

  return null;
}

/**
 * Valida magic bytes reales de documentos (PDF o ZIP).
 */
export function detectManualMimeFromMagicBytes(
  buf: Buffer
): { mime: string; format: 'PDF' | 'ZIP' } | null {
  if (!buf || buf.length < 5) return null;

  // PDF: %PDF-
  if (buf.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { mime: 'application/pdf', format: 'PDF' };
  }

  // ZIP: PK\x03\x04 o PK\x05\x06
  if (
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    ((buf[2] === 0x03 && buf[3] === 0x04) || (buf[2] === 0x05 && buf[3] === 0x06))
  ) {
    return { mime: 'application/zip', format: 'ZIP' };
  }

  return null;
}

/**
 * Genera código único alfanumérico limpio: AD-XXXX-XXXX
 */
export function generateLicenseCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => {
    let out = '';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return out;
  };
  return `AD-${segment()}-${segment()}`;
}

/**
 * Obtiene obras públicas reales (solo columnas públicas no sensibles).
 */
export async function getPublicArtworks(category?: ArtworkCategory): Promise<ArtworkPublic[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('artworks')
    .select(
      'id, title, slug, category, prompt_preview, render_params, watermarked_url, alt_text, created_at'
    )
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error leyendo artworks públicos:', error.message);
    throw new Error('No se pudo cargar el catálogo de obras.');
  }
  return (data || []) as ArtworkPublic[];
}

export async function getPublicArtworkBySlug(slug: string): Promise<ArtworkPublic | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('artworks')
    .select(
      'id, title, slug, category, prompt_preview, render_params, watermarked_url, alt_text, created_at'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error(`Error leyendo obra "${slug}":`, error.message);
    throw new Error('No se pudo consultar la obra solicitada.');
  }
  return (data as ArtworkPublic) || null;
}

/**
 * Obtiene obras completas con Signed URLs temporales (1 hora) para clientes VIP autenticados.
 */
export async function getFullArtworksWithSignedUrls(): Promise<ArtworkFull[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error leyendo artworks VIP:', error.message);
    throw new Error('No se pudo cargar el catálogo privado VIP.');
  }

  const items = (data || []) as ArtworkFull[];
  if (items.length === 0) return [];

  const paths = items.map((i) => i.high_res_path).filter(Boolean);
  const { data: signedList } = await supabase.storage
    .from(BUCKET_HIGHRES)
    .createSignedUrls(paths, 3600);

  const signedMap = new Map<string, string>();
  (signedList || []).forEach((entry) => {
    if (entry.path && entry.signedUrl) {
      signedMap.set(entry.path, entry.signedUrl);
    }
  });

  return items.map((item) => ({
    ...item,
    high_res_signed_url: signedMap.get(item.high_res_path) || item.watermarked_url,
  }));
}

export async function getAllArtworksAdmin(): Promise<ArtworkFull[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error leyendo catálogo admin:', error.message);
    throw new Error('Error consultando el inventario de obras.');
  }
  return (data || []) as ArtworkFull[];
}

export async function getManuals(includePrivateFields: boolean): Promise<ManualItem[]> {
  const supabase = getSupabaseAdmin();
  const columns = includePrivateFields
    ? 'id, title, description, pages_count, format, file_path, file_name, created_at'
    : 'id, title, description, pages_count, format, created_at';

  const { data, error } = await supabase
    .from('manuals')
    .select(columns)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error leyendo manuales:', error.message);
    throw new Error('No se pudo cargar la biblioteca de manuales.');
  }
  return (data || []) as unknown as ManualItem[];
}

export async function createSignedAssetUrl(
  bucket: string,
  objectPath: string,
  downloadFilename?: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, 300, {
      download: downloadFilename || true,
    });

  if (error || !data?.signedUrl) {
    console.error(`Error generando enlace firmado en ${bucket}:`, error?.message);
    throw new Error('No se pudo generar el enlace seguro de descarga.');
  }
  return data.signedUrl;
}

/**
 * Genera Signed Upload URLs para subir archivos pesados (4K > 4.5 MB) directamente desde el cliente
 * hacia Supabase Storage sin pasar por el límite de payload de Vercel Serverless Functions.
 */
export async function createSignedArtworkUploadUrls(params: {
  category: ArtworkCategory;
  slug: string;
  ext: 'jpg' | 'png' | 'webp';
}) {
  const supabase = getSupabaseAdmin();
  const timestamp = Date.now();
  const watermarkedPath = `${params.category}/${params.slug}-${timestamp}-preview.jpg`;
  const highResPath = `${params.category}/${params.slug}-${timestamp}-master.${params.ext}`;

  const [wmRes, hrRes] = await Promise.all([
    supabase.storage.from(BUCKET_WATERMARKED).createSignedUploadUrl(watermarkedPath),
    supabase.storage.from(BUCKET_HIGHRES).createSignedUploadUrl(highResPath),
  ]);

  if (wmRes.error || !wmRes.data) {
    console.error('Error creando signed upload URL para watermark:', wmRes.error);
    throw new Error('No se pudo autorizar la subida de la vista previa.');
  }

  if (hrRes.error || !hrRes.data) {
    console.error('Error creando signed upload URL para highres:', hrRes.error);
    throw new Error('No se pudo autorizar la subida del archivo master.');
  }

  return {
    watermarkedPath,
    watermarkedSignedUrl: wmRes.data.signedUrl,
    watermarkedToken: wmRes.data.token,
    highResPath,
    highResSignedUrl: hrRes.data.signedUrl,
    highResToken: hrRes.data.token,
  };
}

export async function registerUploadedArtwork(params: {
  title: string;
  slug: string;
  category: ArtworkCategory;
  prompt_preview: string;
  prompt_full: string;
  render_params: Record<string, string>;
  alt_text: string;
  watermarkedPath: string;
  highResPath: string;
}): Promise<ArtworkFull> {
  const supabase = getSupabaseAdmin();

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_WATERMARKED)
    .getPublicUrl(params.watermarkedPath);

  const { data: created, error: dbErr } = await supabase
    .from('artworks')
    .insert({
      title: params.title,
      slug: params.slug,
      category: params.category,
      prompt_preview: params.prompt_preview,
      prompt_full: params.prompt_full,
      render_params: params.render_params,
      watermarked_path: params.watermarkedPath,
      watermarked_url: publicUrlData.publicUrl,
      high_res_path: params.highResPath,
      alt_text: params.alt_text,
    })
    .select('*')
    .single();

  if (dbErr || !created) {
    console.error('Error insertando obra en PostgreSQL:', dbErr);
    await supabase.storage.from(BUCKET_WATERMARKED).remove([params.watermarkedPath]);
    await supabase.storage.from(BUCKET_HIGHRES).remove([params.highResPath]);
    throw new Error('No se pudo registrar la obra en la base de datos.');
  }

  return created as ArtworkFull;
}

/**
 * Sube imagen con marca de agua (siempre .jpg) al bucket público `watermarked-art`,
 * sube imagen original 4K al bucket privado `vip-highres-art`,
 * y crea el registro real en `public.artworks`.
 */
export async function uploadAndCreateArtwork(params: {
  title: string;
  slug: string;
  category: ArtworkCategory;
  prompt_preview: string;
  prompt_full: string;
  render_params: Record<string, string>;
  alt_text: string;
  watermarkedBuffer: Buffer;
  watermarkedMime: string;
  highResBuffer: Buffer;
  highResMime: string;
  ext: string;
}): Promise<ArtworkFull> {
  const supabase = getSupabaseAdmin();
  const timestamp = Date.now();
  const watermarkedPath = `${params.category}/${params.slug}-${timestamp}-preview.jpg`;
  const highResPath = `${params.category}/${params.slug}-${timestamp}-master.${params.ext}`;

  const { error: wmErr } = await supabase.storage
    .from(BUCKET_WATERMARKED)
    .upload(watermarkedPath, params.watermarkedBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (wmErr) {
    console.error('Error subiendo vista previa a Storage:', wmErr);
    throw new Error('No se pudo almacenar la vista previa con marca de agua.');
  }

  const { error: hrErr } = await supabase.storage
    .from(BUCKET_HIGHRES)
    .upload(highResPath, params.highResBuffer, {
      contentType: params.highResMime,
      upsert: false,
    });

  if (hrErr) {
    console.error('Error subiendo master 4K a Storage:', hrErr);
    await supabase.storage.from(BUCKET_WATERMARKED).remove([watermarkedPath]);
    throw new Error('No se pudo almacenar el archivo master en alta resolución.');
  }

  return registerUploadedArtwork({
    title: params.title,
    slug: params.slug,
    category: params.category,
    prompt_preview: params.prompt_preview,
    prompt_full: params.prompt_full,
    render_params: params.render_params,
    alt_text: params.alt_text,
    watermarkedPath,
    highResPath,
  });
}

export async function deleteArtworkById(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchErr } = await supabase
    .from('artworks')
    .select('id, watermarked_path, high_res_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new Error('Obra no encontrada en la base de datos.');
  }

  if (existing.watermarked_path) {
    await supabase.storage.from(BUCKET_WATERMARKED).remove([existing.watermarked_path]);
  }
  if (existing.high_res_path) {
    await supabase.storage.from(BUCKET_HIGHRES).remove([existing.high_res_path]);
  }

  const { error: delErr } = await supabase.from('artworks').delete().eq('id', id);
  if (delErr) {
    console.error('Error eliminando obra:', delErr);
    throw new Error('No se pudo eliminar la obra seleccionada.');
  }
}

export async function createSignedManualUploadUrl(fileName: string) {
  const supabase = getSupabaseAdmin();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'manual.pdf';
  const filePath = `guides/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_MANUALS)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    console.error('Error creando signed upload URL para manual:', error);
    throw new Error('No se pudo autorizar la subida del manual técnico.');
  }

  return {
    filePath,
    safeName,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function registerUploadedManual(params: {
  title: string;
  description: string;
  pages_count: number;
  format: string;
  filePath: string;
  fileName: string;
}): Promise<ManualItem> {
  const supabase = getSupabaseAdmin();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'manual.pdf';

  const { data: created, error: dbErr } = await supabase
    .from('manuals')
    .insert({
      title: params.title,
      description: params.description,
      pages_count: params.pages_count,
      format: params.format,
      file_path: params.filePath,
      file_name: safeName,
    })
    .select('*')
    .single();

  if (dbErr || !created) {
    console.error('Error guardando manual en PostgreSQL:', dbErr);
    await supabase.storage.from(BUCKET_MANUALS).remove([params.filePath]);
    throw new Error('No se pudo registrar el manual en la base de datos.');
  }

  return created as ManualItem;
}

export async function uploadAndCreateManual(params: {
  title: string;
  description: string;
  pages_count: number;
  format: string;
  fileBuffer: Buffer;
  fileMime: string;
  fileName: string;
}): Promise<ManualItem> {
  const supabase = getSupabaseAdmin();
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'manual.pdf';
  const filePath = `guides/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET_MANUALS)
    .upload(filePath, params.fileBuffer, {
      contentType: params.fileMime || 'application/pdf',
      upsert: false,
    });

  if (upErr) {
    console.error('Error subiendo manual a Storage:', upErr);
    throw new Error('No se pudo almacenar el archivo del manual.');
  }

  return registerUploadedManual({
    title: params.title,
    description: params.description,
    pages_count: params.pages_count,
    format: params.format,
    filePath,
    fileName: safeName,
  });
}

export async function deleteManualById(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchErr } = await supabase
    .from('manuals')
    .select('id, file_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new Error('Manual no encontrado.');
  }

  if (existing.file_path) {
    await supabase.storage.from(BUCKET_MANUALS).remove([existing.file_path]);
  }

  const { error: delErr } = await supabase.from('manuals').delete().eq('id', id);
  if (delErr) {
    console.error('Error eliminando manual:', delErr);
    throw new Error('No se pudo eliminar el manual.');
  }
}

export async function upsertCustomerAfterPayment(params: {
  email: string;
  paypalOrderId: string;
  paypalPayerId: string | null;
  termsVersion: string;
}): Promise<CustomerRecord> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: existingOrder } = await supabase
    .from('customers')
    .select('*')
    .eq('paypal_order_id', params.paypalOrderId)
    .maybeSingle();

  if (existingOrder) {
    return existingOrder as CustomerRecord;
  }

  const licenseCode = generateLicenseCode();
  const { data: inserted, error } = await supabase
    .from('customers')
    .insert({
      email: normalizedEmail,
      license_code: licenseCode,
      paypal_order_id: params.paypalOrderId,
      paypal_payer_id: params.paypalPayerId,
      amount_usd: 20.0,
      terms_version: params.termsVersion,
      is_active: true,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    console.error('Error registrando cliente:', error);
    throw new Error('No se pudo emitir el registro de licencia.');
  }

  return inserted as CustomerRecord;
}

export async function findCustomerByCredentials(
  email: string,
  licenseCode: string
): Promise<CustomerRecord | null> {
  if (!isValidCleanEmail(email) || !isValidLicenseCodeFormat(licenseCode)) {
    return null;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = licenseCode.trim().toUpperCase();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', cleanEmail)
    .eq('license_code', cleanCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error verificando licencia:', error.message);
    throw new Error('Error al verificar las credenciales de acceso.');
  }
  return (data as CustomerRecord) || null;
}

export async function findActiveCustomerByEmail(
  email: string
): Promise<CustomerRecord | null> {
  if (!isValidCleanEmail(email)) {
    return null;
  }

  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', cleanEmail)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error buscando cliente por email:', error.message);
    throw new Error('Error consultando membresía asociada al correo.');
  }
  return (data?.[0] as CustomerRecord) || null;
}

export async function setCustomerLicenseStatus(
  customerId: string,
  isActive: boolean
): Promise<CustomerRecord> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('customers')
    .update({ is_active: isActive })
    .eq('id', customerId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error actualizando estado de licencia:', error);
    throw new Error('No se pudo actualizar el estado de la licencia.');
  }
  return data as CustomerRecord;
}

export async function verifyVipResourceExists(
  resourceId: string,
  resourceType: string
): Promise<{ exists: boolean; title: string }> {
  if (!resourceId || !/^[0-9a-fA-F-]{36}$/.test(resourceId.trim())) {
    return { exists: false, title: '' };
  }

  const supabase = getSupabaseAdmin();
  if (resourceType === 'manual_pdf') {
    const { data } = await supabase
      .from('manuals')
      .select('id, title')
      .eq('id', resourceId.trim())
      .maybeSingle();
    return { exists: Boolean(data), title: data?.title || '' };
  }

  const { data } = await supabase
    .from('artworks')
    .select('id, title')
    .eq('id', resourceId.trim())
    .maybeSingle();
  return { exists: Boolean(data), title: data?.title || '' };
}

export async function insertAuditLog(entry: {
  customerId?: string | null;
  paypalOrderId?: string | null;
  ipAddress: string;
  userAgent: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogRecord> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      customer_id: entry.customerId ?? null,
      paypal_order_id: entry.paypalOrderId ?? null,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      action: entry.action,
      metadata: entry.metadata ?? {},
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error registrando audit_log:', error?.message);
    throw new Error('No se pudo registrar el evento de auditoría.');
  }
  return data as AuditLogRecord;
}

export async function lookupDisputeEvidence(query: string): Promise<{
  customer: CustomerRecord | null;
  logs: AuditLogRecord[];
}> {
  const cleanQuery = query.trim().slice(0, 254);
  if (!cleanQuery) {
    return { customer: null, logs: [] };
  }

  const upperQuery = cleanQuery.toUpperCase();
  const lowerQuery = cleanQuery.toLowerCase();
  const supabase = getSupabaseAdmin();

  let matchedCustomers: CustomerRecord[] = [];

  if (isValidLicenseCodeFormat(upperQuery)) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('license_code', upperQuery)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) matchedCustomers = data as CustomerRecord[];
  }

  if (matchedCustomers.length === 0 && isValidCleanEmail(lowerQuery)) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email', lowerQuery)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) matchedCustomers = data as CustomerRecord[];
  }

  if (matchedCustomers.length === 0 && /^[A-Za-z0-9_-]{4,64}$/.test(cleanQuery)) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('paypal_order_id', cleanQuery)
      .order('created_at', { ascending: false });
    if (data && data.length > 0) matchedCustomers = data as CustomerRecord[];
  }

  const primaryCustomer = matchedCustomers[0] || null;
  const logMap = new Map<string, AuditLogRecord>();

  if (matchedCustomers.length > 0) {
    const customerIds = matchedCustomers.map((c) => c.id);
    const orderIds = matchedCustomers.map((c) => c.paypal_order_id).filter(Boolean);

    const [byCustomerId, byOrderId, byEmailMeta] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('*')
        .in('customer_id', customerIds)
        .order('created_at', { ascending: true }),
      orderIds.length > 0
        ? supabase
            .from('audit_logs')
            .select('*')
            .in('paypal_order_id', orderIds)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] }),
      supabase
        .from('audit_logs')
        .select('*')
        .contains('metadata', { email: primaryCustomer.email })
        .order('created_at', { ascending: true }),
    ]);

    for (const row of [
      ...(byCustomerId.data || []),
      ...(byOrderId.data || []),
      ...(byEmailMeta.data || []),
    ]) {
      logMap.set(row.id, row as AuditLogRecord);
    }
  } else if (/^[A-Za-z0-9_-]{4,64}$/.test(cleanQuery)) {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('paypal_order_id', cleanQuery)
      .order('created_at', { ascending: true });
    for (const row of data || []) {
      logMap.set(row.id, row as AuditLogRecord);
    }
  } else if (isValidCleanEmail(lowerQuery)) {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .contains('metadata', { email: lowerQuery })
      .order('created_at', { ascending: true });
    for (const row of data || []) {
      logMap.set(row.id, row as AuditLogRecord);
    }
  }

  const logs = Array.from(logMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    customer: primaryCustomer,
    logs,
  };
}

export async function listRecentCustomers(): Promise<CustomerRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error listando clientes:', error.message);
    throw new Error('No se pudo consultar la lista de licencias.');
  }
  return (data || []) as CustomerRecord[];
}

/**
 * Crea un ticket de soporte real en Supabase (`public.support_messages` y `public.audit_logs`).
 */
export async function createSupportMessage(params: {
  name?: string | null;
  email: string;
  subject: string;
  orderOrLicense?: string | null;
  message: string;
  ipAddress: string;
  userAgent: string;
}): Promise<SupportMessageRecord> {
  const supabase = getSupabaseAdmin();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name?.trim().slice(0, 120) || null;
  const cleanSubject = params.subject.trim().slice(0, 140) || 'Soporte de Licencia VIP';
  const cleanOrderOrLicense = params.orderOrLicense?.trim().slice(0, 80) || null;
  const cleanMessage = params.message.trim().slice(0, 4000);

  const auditRecord = await insertAuditLog({
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    action: 'ADMIN_ACTION',
    metadata: {
      operation: 'SUPPORT_TICKET_CREATED',
      ticket_status: 'open',
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      order_or_license: cleanOrderOrLicense,
      message: cleanMessage,
    },
  });

  const { data: tableInserted, error: tableErr } = await supabase
    .from('support_messages')
    .insert({
      id: auditRecord.id,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      order_or_license: cleanOrderOrLicense,
      message: cleanMessage,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      status: 'open',
    })
    .select('*')
    .maybeSingle();

  if (!tableErr && tableInserted) {
    return tableInserted as SupportMessageRecord;
  }

  return {
    id: auditRecord.id,
    name: cleanName,
    email: cleanEmail,
    subject: cleanSubject,
    order_or_license: cleanOrderOrLicense,
    message: cleanMessage,
    ip_address: auditRecord.ip_address,
    user_agent: auditRecord.user_agent,
    status: 'open',
    created_at: auditRecord.created_at,
  };
}

export async function listSupportMessages(): Promise<SupportMessageRecord[]> {
  const supabase = getSupabaseAdmin();

  const { data: tableRows, error: tableErr } = await supabase
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!tableErr && tableRows) {
    return tableRows as SupportMessageRecord[];
  }

  const { data: auditRows } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'ADMIN_ACTION')
    .contains('metadata', { operation: 'SUPPORT_TICKET_CREATED' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (auditRows || []).map((row) => {
    const meta = (row.metadata || {}) as Record<string, unknown>;
    return {
      id: String(row.id),
      name: meta.name ? String(meta.name) : null,
      email: String(meta.email || ''),
      subject: String(meta.subject || 'Soporte de Licencia VIP'),
      order_or_license: meta.order_or_license ? String(meta.order_or_license) : null,
      message: String(meta.message || ''),
      ip_address: String(row.ip_address || ''),
      user_agent: String(row.user_agent || ''),
      status: meta.ticket_status === 'resolved' ? 'resolved' : 'open',
      created_at: String(row.created_at),
    };
  });
}

export async function updateSupportMessageStatus(
  id: string,
  status: 'open' | 'resolved'
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('support_messages')
    .update({ status })
    .eq('id', id);

  const { data: existingLog } = await supabase
    .from('audit_logs')
    .select('id, metadata')
    .eq('id', id)
    .maybeSingle();

  if (existingLog) {
    const updatedMeta = {
      ...((existingLog.metadata as Record<string, unknown>) || {}),
      ticket_status: status,
      updated_at: new Date().toISOString(),
    };
    await supabase
      .from('audit_logs')
      .update({ metadata: updatedMeta })
      .eq('id', id);
  }
}
