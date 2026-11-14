import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  getAllArtworksAdmin,
  getManuals,
  insertAuditLog,
  listRecentCustomers,
  listSupportMessages,
  lookupDisputeEvidence,
  setCustomerLicenseStatus,
  updateSupportMessageStatus,
} from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, email: auth.email || null },
      { status: auth.status }
    );
  }

  try {
    const lookup = req.nextUrl.searchParams.get('lookup');
    if (lookup) {
      const evidence = await lookupDisputeEvidence(lookup);
      return NextResponse.json({ evidence });
    }

    const [customers, artworks, manuals, supportMessages] = await Promise.all([
      listRecentCustomers(),
      getAllArtworksAdmin(),
      getManuals(true),
      listSupportMessages(),
    ]);

    return NextResponse.json({
      adminEmail: auth.admin.email,
      customers,
      artworks,
      manuals,
      supportMessages,
    });
  } catch (error) {
    console.error('Error GET /api/admin:', error);
    return NextResponse.json(
      { error: 'Error consultando los datos del panel de administración.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
    }

    const forensic = extractClientForensicInfo(req);
    const { action } = body as { action?: string };

    if (action === 'toggle_license') {
      const { customerId, isActive } = body as {
        customerId?: string;
        isActive?: boolean;
      };
      if (!customerId || typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'customerId e isActive son obligatorios.' },
          { status: 400 }
        );
      }

      const updated = await setCustomerLicenseStatus(customerId, isActive);
      await insertAuditLog({
        customerId: updated.id,
        paypalOrderId: updated.paypal_order_id,
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'ADMIN_ACTION',
        metadata: {
          admin_email: auth.admin.email,
          operation: isActive ? 'REACTIVATE_LICENSE' : 'REVOKE_LICENSE',
          license_code: updated.license_code,
          customer_email: updated.email,
        },
      });

      return NextResponse.json({ customer: updated });
    }

    if (action === 'update_support_status') {
      const { messageId, status } = body as {
        messageId?: string;
        status?: 'open' | 'resolved';
      };
      if (!messageId || (status !== 'open' && status !== 'resolved')) {
        return NextResponse.json(
          { error: 'messageId y status válido (open/resolved) son obligatorios.' },
          { status: 400 }
        );
      }

      await updateSupportMessageStatus(messageId, status);
      await insertAuditLog({
        ipAddress: forensic.ipAddress,
        userAgent: forensic.userAgent,
        action: 'ADMIN_ACTION',
        metadata: {
          admin_email: auth.admin.email,
          operation: 'UPDATE_SUPPORT_TICKET',
          ticket_id: messageId,
          new_status: status,
        },
      });

      return NextResponse.json({ updated: true, messageId, status });
    }

    return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
  } catch (error) {
    console.error('Error PATCH /api/admin:', error);
    return NextResponse.json(
      { error: 'No se pudo completar la operación administrativa.' },
      { status: 500 }
    );
  }
}
