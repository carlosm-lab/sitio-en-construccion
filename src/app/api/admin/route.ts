import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import {
  getAllArtworksAdmin,
  getManuals,
  listRecentCustomers,
  lookupDisputeEvidence,
} from '@/lib/data-store';

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

    const [customers, artworks, manuals] = await Promise.all([
      listRecentCustomers(),
      getAllArtworksAdmin(),
      getManuals(true),
    ]);

    return NextResponse.json({
      adminEmail: auth.admin.email,
      customers,
      artworks,
      manuals,
    });
  } catch (error) {
    console.error('Error GET /api/admin:', error);
    return NextResponse.json(
      { error: 'Error consultando base de datos Supabase.' },
      { status: 500 }
    );
  }
}
