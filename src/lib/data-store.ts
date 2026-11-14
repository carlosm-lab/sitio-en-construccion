import crypto from 'crypto';
import {
  ArtworkCategory,
  ArtworkFull,
  ArtworkPublic,
  AuditAction,
  AuditLogRecord,
  CustomerRecord,
  ManualItem,
} from '@/types';
import {
  BUCKET_HIGHRES,
  BUCKET_MANUALS,
  BUCKET_WATERMARKED,
} from './constants';
import { getSupabaseAdmin } from './supabase';

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
 * Obtiene obras públicas reales desde Supabase (solo columnas no sensibles).
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
    throw new Error(`Error leyendo artworks desde Supabase: ${error.message}`);
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
    throw new Error(`Error leyendo obra "${slug}": ${error.message}`);
  }
  return (data as ArtworkPublic) || null;
}

/**
 * Obtiene obras completas con Signed URLs temporales (1 hora) desde Supabase Storage privado para VIPs.
 */
export async function getFullArtworksWithSignedUrls(): Promise<ArtworkFull[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error leyendo artworks VIP: ${error.message}`);
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
    throw new Error(`Error leyendo catálogo admin: ${error.message}`);
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
    throw new Error(`Error leyendo manuales desde Supabase: ${error.message}`);
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
    throw new Error(
      `No se pudo generar enlace firmado en ${bucket}: ${error?.message || 'sin URL'}`
    );
  }
  return data.signedUrl;
}

/**
 * Sube imagen con marca de agua al bucket público `watermarked-art`,
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
  const watermarkedPath = `${params.category}/${params.slug}-${timestamp}-preview.${params.ext}`;
  const highResPath = `${params.category}/${params.slug}-${timestamp}-master.${params.ext}`;

  const { error: wmErr } = await supabase.storage
    .from(BUCKET_WATERMARKED)
    .upload(watermarkedPath, params.watermarkedBuffer, {
      contentType: params.watermarkedMime,
      upsert: false,
    });

  if (wmErr) {
    throw new Error(`Error subiendo vista previa a Storage: ${wmErr.message}`);
  }

  const { error: hrErr } = await supabase.storage
    .from(BUCKET_HIGHRES)
    .upload(highResPath, params.highResBuffer, {
      contentType: params.highResMime,
      upsert: false,
    });

  if (hrErr) {
    await supabase.storage.from(BUCKET_WATERMARKED).remove([watermarkedPath]);
    throw new Error(`Error subiendo master 4K a Storage: ${hrErr.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_WATERMARKED)
    .getPublicUrl(watermarkedPath);

  const { data: created, error: dbErr } = await supabase
    .from('artworks')
    .insert({
      title: params.title,
      slug: params.slug,
      category: params.category,
      prompt_preview: params.prompt_preview,
      prompt_full: params.prompt_full,
      render_params: params.render_params,
      watermarked_path: watermarkedPath,
      watermarked_url: publicUrlData.publicUrl,
      high_res_path: highResPath,
      alt_text: params.alt_text,
    })
    .select('*')
    .single();

  if (dbErr || !created) {
    await supabase.storage.from(BUCKET_WATERMARKED).remove([watermarkedPath]);
    await supabase.storage.from(BUCKET_HIGHRES).remove([highResPath]);
    throw new Error(`Error guardando obra en PostgreSQL: ${dbErr?.message || 'desconocido'}`);
  }

  return created as ArtworkFull;
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
    throw new Error(`Error eliminando obra: ${delErr.message}`);
  }
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
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `guides/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET_MANUALS)
    .upload(filePath, params.fileBuffer, {
      contentType: params.fileMime || 'application/pdf',
      upsert: false,
    });

  if (upErr) {
    throw new Error(`Error subiendo manual a Storage: ${upErr.message}`);
  }

  const { data: created, error: dbErr } = await supabase
    .from('manuals')
    .insert({
      title: params.title,
      description: params.description,
      pages_count: params.pages_count,
      format: params.format,
      file_path: filePath,
      file_name: safeName,
    })
    .select('*')
    .single();

  if (dbErr || !created) {
    await supabase.storage.from(BUCKET_MANUALS).remove([filePath]);
    throw new Error(`Error guardando manual en PostgreSQL: ${dbErr?.message || 'desconocido'}`);
  }

  return created as ManualItem;
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
    throw new Error(`Error eliminando manual: ${delErr.message}`);
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
    throw new Error(`Error registrando cliente en Supabase: ${error?.message || 'desconocido'}`);
  }

  return inserted as CustomerRecord;
}

export async function findCustomerByCredentials(
  email: string,
  licenseCode: string
): Promise<CustomerRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = licenseCode.trim().toUpperCase();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', cleanEmail)
    .eq('license_code', cleanCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Error verificando licencia: ${error.message}`);
  }
  return (data as CustomerRecord) || null;
}

export async function findActiveCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', cleanEmail)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Error buscando cliente por Google email: ${error.message}`);
  }
  return (data as CustomerRecord) || null;
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
    throw new Error(`Error registrando audit_log: ${error?.message || 'desconocido'}`);
  }
  return data as AuditLogRecord;
}

export async function lookupDisputeEvidence(query: string): Promise<{
  customer: CustomerRecord | null;
  logs: AuditLogRecord[];
}> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { customer: null, logs: [] };
  }

  const upperQuery = cleanQuery.toUpperCase();
  const lowerQuery = cleanQuery.toLowerCase();
  const supabase = getSupabaseAdmin();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .or(
      `license_code.eq.${upperQuery},paypal_order_id.eq.${cleanQuery},email.ilike.${lowerQuery}`
    )
    .maybeSingle();

  const orderIdToSearch = customer?.paypal_order_id || cleanQuery;
  const customerIdToSearch = customer?.id;

  let logsQuery = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: true });

  if (customerIdToSearch) {
    logsQuery = logsQuery.or(
      `customer_id.eq.${customerIdToSearch},paypal_order_id.eq.${orderIdToSearch}`
    );
  } else {
    logsQuery = logsQuery.eq('paypal_order_id', orderIdToSearch);
  }

  const { data: logs } = await logsQuery;
  return {
    customer: (customer as CustomerRecord) || null,
    logs: (logs as AuditLogRecord[]) || [],
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
    throw new Error(`Error listando clientes: ${error.message}`);
  }
  return (data || []) as CustomerRecord[];
}
