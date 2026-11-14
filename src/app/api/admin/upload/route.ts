import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  deleteArtworkById,
  insertAuditLog,
  uploadAndCreateArtwork,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { ArtworkCategory } from '@/types';

const ALLOWED_CATEGORIES: ArtworkCategory[] = [
  'retratos-ia',
  'concept-art',
  'guias-personajes',
];

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();

    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || '') as ArtworkCategory;
    const promptPreview = String(formData.get('prompt_preview') || '').trim();
    const promptFull = String(formData.get('prompt_full') || '').trim();
    const motor = String(formData.get('motor') || 'Midjourney v6.1').trim();
    const aspecto = String(formData.get('aspecto') || '4:5').trim();
    const resolucion = String(formData.get('resolucion') || '4096x5120px').trim();
    const altText = String(formData.get('alt_text') || '').trim();

    const highResFile = formData.get('highResFile') as File | null;
    const watermarkedFile = formData.get('watermarkedFile') as File | null;

    if (!title || !ALLOWED_CATEGORIES.includes(category) || !promptFull) {
      return NextResponse.json(
        {
          error:
            'Campos obligatorios: título, categoría válida y prompt completo.',
        },
        { status: 400 }
      );
    }

    if (!highResFile || highResFile.size === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar el archivo de imagen original en alta resolución.' },
        { status: 400 }
      );
    }

    const rawName = highResFile.name || 'artwork.png';
    const rawExt = rawName.split('.').pop()?.toLowerCase() || 'png';
    const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'png';

    const highResBuffer = Buffer.from(await highResFile.arrayBuffer());
    const wmBuffer =
      watermarkedFile && watermarkedFile.size > 0
        ? Buffer.from(await watermarkedFile.arrayBuffer())
        : highResBuffer;

    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const uniqueSlug = `${baseSlug || 'obra'}-${Date.now().toString(36).slice(-5)}`;

    const created = await uploadAndCreateArtwork({
      title,
      slug: uniqueSlug,
      category,
      prompt_preview: promptPreview || `${promptFull.slice(0, 105)}...`,
      prompt_full: promptFull,
      render_params: {
        motor,
        aspecto,
        resolucion,
      },
      alt_text: altText || `${title} — Arte Digital IA ArteDigital.click`,
      watermarkedBuffer: wmBuffer,
      watermarkedMime: watermarkedFile?.type || 'image/jpeg',
      highResBuffer,
      highResMime: highResFile.type || 'image/png',
      ext,
    });

    const forensic = extractClientForensicInfo(req);
    await insertAuditLog({
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ADMIN_ACTION',
      metadata: {
        admin_email: auth.admin.email,
        operation: 'UPLOAD_ARTWORK',
        artwork_id: created.id,
        slug: created.slug,
      },
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/upload:', error);
    const msg = error instanceof Error ? error.message : 'Error subiendo obra a Storage.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de obra requerido.' }, { status: 400 });
    }

    await deleteArtworkById(id);

    const forensic = extractClientForensicInfo(req);
    await insertAuditLog({
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ADMIN_ACTION',
      metadata: {
        admin_email: auth.admin.email,
        operation: 'DELETE_ARTWORK',
        artwork_id: id,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error DELETE /api/admin/upload:', error);
    const msg = error instanceof Error ? error.message : 'Error eliminando obra.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
