import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  ArtworkCategory,
  ArtworkFull,
  ArtworkPublic,
  AuditAction,
  AuditLogRecord,
  CustomerRecord,
  ManualItem,
} from '@/types';
import { getSupabaseAdmin } from './supabase';
import { SEED_ARTWORKS, SEED_MANUALS, stripPrivateArtworkFields } from './seed-data';

interface LocalStoreData {
  artworks: ArtworkFull[];
  manuals: ManualItem[];
  customers: CustomerRecord[];
  audit_logs: AuditLogRecord[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'artedigital-store.json');

let memoryStore: LocalStoreData | null = null;

function readLocalStore(): LocalStoreData {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as LocalStoreData;
      memoryStore = {
        artworks: parsed.artworks?.length ? parsed.artworks : [...SEED_ARTWORKS],
        manuals: parsed.manuals?.length ? parsed.manuals : [...SEED_MANUALS],
        customers: parsed.customers || [],
        audit_logs: parsed.audit_logs || [],
      };
      return memoryStore;
    }
  } catch {
    // Fallback to in-memory seed
  }

  memoryStore = {
    artworks: [...SEED_ARTWORKS],
    manuals: [...SEED_MANUALS],
    customers: [],
    audit_logs: [],
  };
  writeLocalStore(memoryStore);
  return memoryStore;
}

function writeLocalStore(store: LocalStoreData): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem in serverless runtime; in-memory state stays intact for current container
  }
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

export async function getPublicArtworks(category?: ArtworkCategory): Promise<ArtworkPublic[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
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
    if (!error && data && data.length > 0) {
      return data as ArtworkPublic[];
    }
  }

  const store = readLocalStore();
  const filtered = category
    ? store.artworks.filter((a) => a.category === category)
    : store.artworks;
  return filtered
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(stripPrivateArtworkFields);
}

export async function getPublicArtworkBySlug(slug: string): Promise<ArtworkPublic | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('artworks')
      .select(
        'id, title, slug, category, prompt_preview, render_params, watermarked_url, alt_text, created_at'
      )
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      return data as ArtworkPublic;
    }
  }

  const store = readLocalStore();
  const found = store.artworks.find((a) => a.slug === slug);
  return found ? stripPrivateArtworkFields(found) : null;
}

export async function getFullArtworks(): Promise<ArtworkFull[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as ArtworkFull[];
    }
  }

  const store = readLocalStore();
  return store.artworks.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getManuals(includeFileUrl: boolean): Promise<ManualItem[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const columns = includeFileUrl
      ? 'id, title, description, pages_count, format, file_url, created_at'
      : 'id, title, description, pages_count, format, created_at';
    const { data, error } = await supabase
      .from('manuals')
      .select(columns)
      .order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      return data as unknown as ManualItem[];
    }
  }

  const store = readLocalStore();
  return store.manuals.map((m) =>
    includeFileUrl
      ? m
      : {
          id: m.id,
          title: m.title,
          description: m.description,
          pages_count: m.pages_count,
          format: m.format,
          created_at: m.created_at,
        }
  );
}

export async function createArtwork(input: {
  title: string;
  slug: string;
  category: ArtworkCategory;
  prompt_preview: string;
  prompt_full: string;
  render_params: Record<string, string>;
  watermarked_url: string;
  high_res_url: string;
  alt_text: string;
}): Promise<ArtworkFull> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('artworks')
      .insert(input)
      .select('*')
      .single();
    if (!error && data) {
      return data as ArtworkFull;
    }
  }

  const store = readLocalStore();
  const created: ArtworkFull = {
    id: `art-${crypto.randomUUID().slice(0, 8)}`,
    ...input,
    created_at: new Date().toISOString(),
  };
  store.artworks.unshift(created);
  writeLocalStore(store);
  return created;
}

export async function upsertCustomerAfterPayment(params: {
  email: string;
  paypalOrderId: string;
  paypalPayerId: string | null;
  termsVersion: string;
}): Promise<CustomerRecord> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    // Check idempotency by paypal_order_id first
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

    if (!error && inserted) {
      return inserted as CustomerRecord;
    }
  }

  const store = readLocalStore();
  const existing = store.customers.find(
    (c) => c.paypal_order_id === params.paypalOrderId
  );
  if (existing) {
    return existing;
  }

  const created: CustomerRecord = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    license_code: generateLicenseCode(),
    paypal_order_id: params.paypalOrderId,
    paypal_payer_id: params.paypalPayerId,
    amount_usd: 20.0,
    terms_version: params.termsVersion,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.customers.unshift(created);
  writeLocalStore(store);
  return created;
}

export async function findCustomerByCredentials(
  email: string,
  licenseCode: string
): Promise<CustomerRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = licenseCode.trim().toUpperCase();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('email', cleanEmail)
      .eq('license_code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      return data as CustomerRecord;
    }
  }

  const store = readLocalStore();
  return (
    store.customers.find(
      (c) =>
        c.email.toLowerCase() === cleanEmail &&
        c.license_code.toUpperCase() === cleanCode &&
        c.is_active
    ) || null
  );
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
  if (supabase) {
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

    if (!error && data) {
      return data as AuditLogRecord;
    }
  }

  const store = readLocalStore();
  const record: AuditLogRecord = {
    id: crypto.randomUUID(),
    customer_id: entry.customerId ?? null,
    paypal_order_id: entry.paypalOrderId ?? null,
    ip_address: entry.ipAddress,
    user_agent: entry.userAgent,
    action: entry.action,
    metadata: entry.metadata ?? {},
    created_at: new Date().toISOString(),
  };
  store.audit_logs.unshift(record);
  writeLocalStore(store);
  return record;
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

  if (supabase) {
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
    if (customer || (logs && logs.length > 0)) {
      return {
        customer: (customer as CustomerRecord) || null,
        logs: (logs as AuditLogRecord[]) || [],
      };
    }
  }

  const store = readLocalStore();
  const customer =
    store.customers.find(
      (c) =>
        c.license_code.toUpperCase() === upperQuery ||
        c.paypal_order_id === cleanQuery ||
        c.email.toLowerCase() === lowerQuery
    ) || null;

  const targetOrder = customer?.paypal_order_id || cleanQuery;
  const logs = store.audit_logs
    .filter(
      (l) =>
        (customer && l.customer_id === customer.id) ||
        l.paypal_order_id === targetOrder ||
        (l.metadata &&
          typeof l.metadata.license_code === 'string' &&
          l.metadata.license_code.toUpperCase() === upperQuery)
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return { customer, logs };
}

export async function listRecentCustomers(): Promise<CustomerRecord[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      return data as CustomerRecord[];
    }
  }

  const store = readLocalStore();
  return store.customers.slice(0, 50);
}
