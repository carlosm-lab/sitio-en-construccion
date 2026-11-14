import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  createSignedManualUploadUrl,
  deleteManualById,
  detectManualMimeFromMagicBytes,
  insertAuditLog,
  registerUploadedManual,
  uploadAndCreateManual,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    // Subida directa firmada para soportar manuales PDF/ZIP grandes (> 4.5 MB en Vercel)
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
      }

      if (body.step === 'prepare') {
        const fileName = String(body.fileName || '').trim();
        if (!fileName || !/\.(pdf|zip)$/i.test(fileName)) {
          return NextResponse.json(
            { error: 'Solo se permiten archivos con extensión .pdf o .zip.' },
            { status: 400 }
          );
        }

        const signed = await createSignedManualUploadUrl(fileName);
        return NextResponse.json(signed);
      }

      if (body.step === 'complete') {
        const title = String(body.title || '').trim();
        const description = String(body.description || '').trim();
        const pagesCount = parseInt(String(body.pages_count || '0'), 10);
        const format = String(body.format || 'PDF').trim().toUpperCase();
        const filePath = String(body.filePath || '').trim();
        const fileName = String(body.fileName || '').trim();

        if (!title || !description || !filePath || !fileName || pagesCount < 1) {
          return NextResponse.json(
            {
              error:
                'Faltan datos obligatorios del manual (título, descripción, páginas válidas o archivo).',
            },
            { status: 400 }
          );
        }

        const created = await registerUploadedManual({
          title,
          description,
          pages_count: pagesCount,
          format: format === 'ZIP' ? 'ZIP' : 'PDF',
          filePath,
          fileName,
        });

        const forensic = extractClientForensicInfo(req);
        await insertAuditLog({
          ipAddress: forensic.ipAddress,
          userAgent: forensic.userAgent,
          action: 'ADMIN_ACTION',
          metadata: {
            admin_email: auth.admin.email,
            operation: 'UPLOAD_MANUAL',
            manual_id: created.id,
            title: created.title,
          },
        });

        return NextResponse.json({ created }, { status: 201 });
      }

      return NextResponse.json({ error: 'Paso inválido.' }, { status: 400 });
    }

    const formData = await req.formData();

    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const pagesCount = parseInt(String(formData.get('pages_count') || '0'), 10);
    const file = formData.get('file') as File | null;

    if (!title || !description || !file || file.size === 0 || pagesCount < 1) {
      return NextResponse.json(
        {
          error:
            'Debes completar título, descripción, número real de páginas y adjuntar un archivo PDF o ZIP válido.',
        },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const detected = detectManualMimeFromMagicBytes(fileBuffer);
    if (!detected) {
      return NextResponse.json(
        {
          error:
            'El archivo seleccionado no es un documento PDF ni un paquete ZIP válido.',
        },
        { status: 400 }
      );
    }

    const created = await uploadAndCreateManual({
      title,
      description,
      pages_count: pagesCount,
      format: detected.format,
      fileBuffer,
      fileMime: detected.mime,
      fileName: file.name || `manual.${detected.format.toLowerCase()}`,
    });

    const forensic = extractClientForensicInfo(req);
    await insertAuditLog({
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ADMIN_ACTION',
      metadata: {
        admin_email: auth.admin.email,
        operation: 'UPLOAD_MANUAL',
        manual_id: created.id,
        title: created.title,
      },
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin/manuals:', error);
    return NextResponse.json(
      { error: 'No se pudo publicar el manual técnico.' },
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
      return NextResponse.json({ error: 'ID de manual requerido.' }, { status: 400 });
    }

    await deleteManualById(id);

    const forensic = extractClientForensicInfo(req);
    await insertAuditLog({
      ipAddress: forensic.ipAddress,
      userAgent: forensic.userAgent,
      action: 'ADMIN_ACTION',
      metadata: {
        admin_email: auth.admin.email,
        operation: 'DELETE_MANUAL',
        manual_id: id,
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Error DELETE /api/admin/manuals:', error);
    return NextResponse.json(
      { error: 'No se pudo eliminar el manual.' },
      { status: 500 }
    );
  }
}
