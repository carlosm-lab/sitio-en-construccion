import { NextRequest, NextResponse } from 'next/server';
import { BUCKET_HIGHRES, BUCKET_MANUALS } from '@/lib/constants';
import { createSignedAssetUrl, insertAuditLog } from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { getSupabaseAdmin } from '@/lib/supabase';
import { resolveVipCustomer } from '@/lib/vip-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveVipCustomer(req);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Acceso restringido. Requiere membresía VIP activa.' },
        { status: 401 }
      );
    }

    const { customer } = resolved;
    const type = req.nextUrl.searchParams.get('type');
    const id = req.nextUrl.searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Parámetros type e id requeridos.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const forensic = extractClientForensicInfo(req);

    if (type === 'artwork') {
      const { data: art, error } = await supabase
        .from('artworks')
        .select('id, title, slug, high_res_path')
        .eq('id', id)
        .maybeSingle();

      if (error || !art) {
        return NextResponse.json({ error: 'Obra no encontrada.' }, { status: 404 });
      }

      const ext = art.high_res_path.split('.').pop() || 'png';
      const signedUrl = await createSignedAssetUrl(
        BUCKET_HIGHRES,
        art.high_res_path,
        `${art.slug}-ArteDigital-Master.${ext}`
      );

      await insertAuditLog({
        customerId: customer.id,
        paypalOrderId: customer.paypal_order_id,
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'ASSET_DOWNLOADED',
        metadata: {
          license_code: customer.license_code,
          email: customer.email,
          resource_id: art.id,
          resource_type: 'high_res_artwork',
          resource_title: art.title,
          storage_path: art.high_res_path,
          downloaded_at: new Date().toISOString(),
        },
      });

      return NextResponse.redirect(signedUrl);
    }

    if (type === 'manual') {
      const { data: manual, error } = await supabase
        .from('manuals')
        .select('id, title, file_path, file_name')
        .eq('id', id)
        .maybeSingle();

      if (error || !manual) {
        return NextResponse.json({ error: 'Manual no encontrado.' }, { status: 404 });
      }

      const signedUrl = await createSignedAssetUrl(
        BUCKET_MANUALS,
        manual.file_path,
        manual.file_name || 'Manual-ArteDigital.pdf'
      );

      await insertAuditLog({
        customerId: customer.id,
        paypalOrderId: customer.paypal_order_id,
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'ASSET_DOWNLOADED',
        metadata: {
          license_code: customer.license_code,
          email: customer.email,
          resource_id: manual.id,
          resource_type: 'manual_pdf',
          resource_title: manual.title,
          storage_path: manual.file_path,
          downloaded_at: new Date().toISOString(),
        },
      });

      return NextResponse.redirect(signedUrl);
    }

    return NextResponse.json({ error: 'Tipo de recurso inválido.' }, { status: 400 });
  } catch (error) {
    console.error('Error en /api/vip/download:', error);
    return NextResponse.json(
      { error: 'Error generando descarga segura desde Supabase Storage.' },
      { status: 500 }
    );
  }
}
