import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  createSignedArtworkUploadUrls,
  deleteArtworkById,
  detectImageMimeFromMagicBytes,
  insertAuditLog,
  registerUploadedArtwork,
  uploadAndCreateArtwork,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { ArtworkCategory } from '@/types';

const ALLOWED_CATEGORIES: ArtworkCategory[] = [
  'retratos-ia',
  'concept-art',
  'guias-personajes',
];

function buildUniqueSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${baseSlug || 'obra'}-${Date.now().toString(36).slice(-5)}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Flujo de subida directa firmada para soportar imágenes 4K (> 4.5 MB en Vercel)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
      }

      if (body.step === 'prepare') {
        const title = String(body.title || '').trim();
        const category = String(body.category || '') as ArtworkCategory;
        const rawExt = String(body.ext || 'png').toLowerCase();
        const ext = (['jpg', 'png', 'webp'].includes(rawExt) ? rawExt : 'png') as
          | 'jpg'
          | 'png'
          | 'webp';

        if (!title || !ALLOWED_CATEGORIES.includes(category)) {
          return NextResponse.json(
            { error: 'Título y categoría válida son requeridos.' },
            { status: 400 }
          );
        }

        const slug = buildUniqueSlug(title);
        const signed = await createSignedArtworkUploadUrls({
          category,
          slug,
          ext,
        });

        return NextResponse.json({ slug, ...signed });
      }

      if (body.step === 'complete') {
        const title = String(body.title || '').trim();
        const slug = String(body.slug || '').trim();
        const category = String(body.category || '') as ArtworkCategory;
        const promptPreview = String(body.prompt_preview || '').trim();
        const promptFull = String(body.prompt_full || '').trim();
        const motor = String(body.motor || '').trim();
        const aspecto = String(body.aspecto || '').trim();
        const resolucion = String(body.resolucion || '').trim();
        const altText = String(body.alt_text || '').trim();
        const watermarkedPath = String(body.watermarkedPath || '').trim();
        const highResPath = String(body.highResPath || '').trim();

        if (
          !title ||
          !slug ||
          !ALLOWED_CATEGORIES.includes(category) ||
          !promptFull ||
          !watermarkedPath ||
          !highResPath ||
          !motor ||
          !aspecto ||
          !resolucion
        ) {
          return NextResponse.json(
            {
              error:
                'Faltan campos técnicos obligatorios (título, categoría, prompt, motor, relación de aspecto, resolución o rutas de archivo).',
            },
            { status: 400 }
          );
        }

        const created = await registerUploadedArtwork({
          title,
          slug,
          category,
          prompt_preview: promptPreview || `${promptFull.slice(0, 105)}...`,
          prompt_full: promptFull,
          render_params: {
            motor,
            aspecto,
            resolucion,
          },
          alt_text: altText || `${title} — Arte Digital IA ArteDigital.click`,
          watermarkedPath,
          highResPath,
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
      }

      return NextResponse.json({ error: 'Paso de subida inválido.' }, { status: 400 });
    }

    // Flujo multipart/form-data con validación estricta de magic bytes y sin fallback inseguro
    const formData = await req.formData();

    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || '') as ArtworkCategory;
    const promptPreview = String(formData.get('prompt_preview') || '').trim();
    const promptFull = String(formData.get('prompt_full') || '').trim();
    const motor = String(formData.get('motor') || '').trim();
    const aspecto = String(formData.get('aspecto') || '').trim();
    const resolucion = String(formData.get('resolucion') || '').trim();
    const altText = String(formData.get('alt_text') || '').trim();

    const highResFile = formData.get('highResFile') as File | null;
    const watermarkedFile = formData.get('watermarkedFile') as File | null;

    if (
      !title ||
      !ALLOWED_CATEGORIES.includes(category) ||
      !promptFull ||
      !motor ||
      !aspecto ||
      !resolucion
    ) {
      return NextResponse.json(
        {
          error:
            'Campos obligatorios: título, categoría, prompt completo, motor, aspecto y resolución real.',
        },
        { status: 400 }
      );
    }

    if (!highResFile || highResFile.size === 0) {
      return NextResponse.json(
        { error: 'Debes adjuntar el archivo de imagen original en alta resolución.' },
        { status: 400 }
      );
    }

    if (!watermarkedFile || watermarkedFile.size === 0) {
      return NextResponse.json(
        {
          error:
            'Falta el archivo de vista previa con marca de agua. Por seguridad nunca se publica el archivo master en el bucket público.',
        },
        { status: 400 }
      );
    }

    const highResBuffer = Buffer.from(await highResFile.arrayBuffer());
    const wmBuffer = Buffer.from(await watermarkedFile.arrayBuffer());

    const detectedHighRes = detectImageMimeFromMagicBytes(highResBuffer);
    const detectedWm = detectImageMimeFromMagicBytes(wmBuffer);

    if (!detectedHighRes) {
      return NextResponse.json(
        { error: 'El archivo master no es una imagen PNG, JPEG o WEBP válida.' },
        { status: 400 }
      );
    }

    if (!detectedWm || detectedWm.mime !== 'image/jpeg') {
      return NextResponse.json(
        { error: 'La vista previa con marca de agua debe ser un archivo JPEG válido.' },
        { status: 400 }
      );
    }

    const uniqueSlug = buildUniqueSlug(title);

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
      watermarkedMime: 'image/jpeg',
      highResBuffer,
      highResMime: detectedHighRes.mime,
      ext: detectedHighRes.ext,
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
    return NextResponse.json(
      { error: 'No se pudo procesar y publicar la obra.' },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: 'No se pudo eliminar la obra solicitada.' },
      { status: 500 }
    );
  }
}
