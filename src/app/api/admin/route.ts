import { NextRequest, NextResponse } from 'next/server';
import {
  createArtwork,
  getFullArtworks,
  listRecentCustomers,
  lookupDisputeEvidence,
} from '@/lib/data-store';
import { ArtworkCategory } from '@/types';

function verifyAdminAuth(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET_PASSWORD;
  if (!expected) return false;

  const provided =
    req.headers.get('x-admin-password') ||
    req.nextUrl.searchParams.get('password') ||
    '';

  return provided === expected;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: 'Contraseña maestra de administración incorrecta.' },
      { status: 401 }
    );
  }

  const lookup = req.nextUrl.searchParams.get('lookup');
  if (lookup) {
    const evidence = await lookupDisputeEvidence(lookup);
    return NextResponse.json({ evidence });
  }

  const [customers, artworks] = await Promise.all([
    listRecentCustomers(),
    getFullArtworks(),
  ]);

  return NextResponse.json({
    customers,
    artworksCount: artworks.length,
    artworks: artworks.slice(0, 20),
  });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      { error: 'Contraseña maestra de administración incorrecta.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      category,
      prompt_preview,
      prompt_full,
      watermarked_url,
      high_res_url,
      alt_text,
      motor,
      aspecto,
      resolucion,
    } = body as {
      title?: string;
      category?: ArtworkCategory;
      prompt_preview?: string;
      prompt_full?: string;
      watermarked_url?: string;
      high_res_url?: string;
      alt_text?: string;
      motor?: string;
      aspecto?: string;
      resolucion?: string;
    };

    if (!title || !category || !prompt_full || !high_res_url) {
      return NextResponse.json(
        {
          error:
            'Campos obligatorios: título, categoría, prompt completo y URL de alta resolución.',
        },
        { status: 400 }
      );
    }

    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const uniqueSlug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

    const created = await createArtwork({
      title: title.trim(),
      slug: uniqueSlug,
      category,
      prompt_preview:
        prompt_preview?.trim() || `${prompt_full.trim().slice(0, 95)}...`,
      prompt_full: prompt_full.trim(),
      render_params: {
        motor: motor?.trim() || 'Midjourney v6.1',
        aspecto: aspecto?.trim() || '4:5',
        resolucion: resolucion?.trim() || '4096x5120px',
      },
      watermarked_url: watermarked_url?.trim() || high_res_url.trim(),
      high_res_url: high_res_url.trim(),
      alt_text: alt_text?.trim() || `${title.trim()} - Arte IA ArteDigital.click`,
    });

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/admin:', error);
    return NextResponse.json({ error: 'Error creando obra.' }, { status: 500 });
  }
}
