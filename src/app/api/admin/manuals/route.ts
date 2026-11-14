import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  deleteManualById,
  insertAuditLog,
  uploadAndCreateManual,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';

export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();

    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const pagesCount = parseInt(String(formData.get('pages_count') || '1'), 10) || 1;
    const format = String(formData.get('format') || 'PDF').trim();
    const file = formData.get('file') as File | null;

    if (!title || !description || !file || file.size === 0) {
      return NextResponse.json(
        {
          error:
            'Debes completar título, descripción y adjuntar un archivo PDF/ZIP real.',
        },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const created = await uploadAndCreateManual({
      title,
      description,
      pages_count: pagesCount,
      format,
      fileBuffer,
      fileMime: file.type || 'application/pdf',
      fileName: file.name || 'manual.pdf',
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
    const msg = error instanceof Error ? error.message : 'Error subiendo manual.';
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
    const msg = error instanceof Error ? error.message : 'Error eliminando manual.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
