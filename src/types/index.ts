export type ArtworkCategory = 'retratos-ia' | 'concept-art' | 'guias-personajes';

export interface ArtworkPublic {
  id: string;
  title: string;
  slug: string;
  category: ArtworkCategory;
  prompt_preview: string;
  render_params: Record<string, string>;
  watermarked_url: string;
  alt_text: string;
  created_at: string;
}

export interface ArtworkFull extends ArtworkPublic {
  prompt_full: string;
  watermarked_path: string;
  high_res_path: string;
  high_res_signed_url?: string;
}

export interface ManualItem {
  id: string;
  title: string;
  description: string;
  pages_count: number;
  format: string;
  file_path?: string;
  file_name?: string;
  created_at: string;
}

export interface CustomerRecord {
  id: string;
  email: string;
  license_code: string;
  paypal_order_id: string;
  paypal_payer_id: string | null;
  amount_usd: number;
  terms_version: string;
  is_active: boolean;
  created_at: string;
}

export type AuditAction =
  | 'TERMS_ACCEPTED'
  | 'PAYMENT_CAPTURED'
  | 'VIP_ACCESS_GRANTED'
  | 'VIP_LOGIN'
  | 'ASSET_DOWNLOADED'
  | 'ADMIN_ACTION';

export interface AuditLogRecord {
  id: string;
  customer_id: string | null;
  paypal_order_id: string | null;
  ip_address: string;
  user_agent: string;
  action: AuditAction;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SupportMessageRecord {
  id: string;
  name: string | null;
  email: string;
  subject: string;
  order_or_license: string | null;
  message: string;
  ip_address: string;
  user_agent: string;
  status: 'open' | 'resolved';
  created_at: string;
}

export interface CategoryMeta {
  slug: ArtworkCategory;
  name: string;
  shortDesc: string;
  seoTitle: string;
  seoDescription: string;
}
