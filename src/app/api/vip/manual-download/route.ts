import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByCredentials, insertAuditLog } from '@/lib/data-store';
import { extractClientForensicInfo } from '@/lib/request-info';
import { getVipSessionFromRequest } from '@/lib/vip-session';

const MANUAL_DOCS: Record<string, { title: string; content: string }> = {
  'consistencia-personajes-2026': {
    title: 'Manual Maestro: Consistencia de Personajes 100% Fiel (v2026)',
    content: `ARTEDIGITAL.CLICK - MANUAL TÉCNICO VIP
========================================================================
TÍTULO: Consistencia de Personajes 100% Fiel en Midjourney, Flux.1 y ComfyUI
VERSIÓN: 2026.1 | LICENCIA DIGITAL PRIVADA

1. ARQUITECTURA DE ANCLAJE FACIAL (--cref y --cw)
- Crea una hoja de referencia neutra (fondo Alabastro #FAF7F2, iluminación frontal).
- Usa --cw 100 para conservar rostro + vestuario exacto.
- Usa --cw 15 a 35 para mantener la identidad facial cambiando de ropa o época.

2. PARÁMETROS DE SEED Y CONSISTENCIA EN FLUX.1 / COMFYUI
- Fija el Seed base (ej. --seed 482910) durante iteraciones de pose.
- Combina ControlNet OpenPose (peso 0.75) + IP-Adapter FaceID Plus v2 (peso 0.85).
- Evita palabras contradictorias de iluminación al cambiar de escena.

3. PLANTILLA BASE RECOMENDADA
"[Descripción exacta de rostro y rasgos], [pose y ángulo], [vestuario], soft editorial lighting, 85mm f/1.4, natural skin pores --cref [URL_REFERENCIA] --cw 85 --ar 4:5 --v 6.1"
`,
  },
  'ingenieria-prompts-editoriales': {
    title: 'Ingeniería de Prompts Editoriales y Fotografía de Estudio',
    content: `ARTEDIGITAL.CLICK - MANUAL TÉCNICO VIP
========================================================================
TÍTULO: Ingeniería de Prompts Editoriales y Fotografía de Estudio
VERSIÓN: 2026.1 | LICENCIA DIGITAL PRIVADA

1. ÓPTICA Y PROFUNDIDAD DE CAMPO
- Retrato íntimo: 85mm f/1.4 Hasselblad medium format.
- Editorial cuerpo entero: 50mm f/2.0, distancia media.
- Arquitectura y Concept Art: 24mm tilt-shift, líneas verticales rectas.

2. ESQUEMAS DE ILUMINACIÓN PASTEL
- "Soft diffused skylight" + "warm alabaster bounce fill".
- Evita "neon", "hyper-saturated", "HDR extreme" para mantener elegancia editorial.
`,
  },
  'pipeline-escalado-4k': {
    title: 'Pipeline de Escalado 4K y Limpieza Comercial para Bancos de Arte',
    content: `ARTEDIGITAL.CLICK - MANUAL TÉCNICO VIP
========================================================================
TÍTULO: Pipeline de Escalado 4K y Limpieza Comercial
VERSIÓN: 2026.1 | LICENCIA DIGITAL PRIVADA

1. FLUJO DE UPSCALING SIN PÉRDIDA DE TEXTURA
- Pase 1: Generación nativa 1024x1280px.
- Pase 2: Ultimate SD Upscale con Denoise 0.18 - 0.24 usando 4x-UltraSharp o NMKD-Siax.
- Pase 3: Micro-grano analógico de película (Portra 400) al 4% en post-proceso para unificar piel.
`,
  },
};

export async function GET(req: NextRequest) {
  const session = getVipSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Acceso restringido. Requiere membresía VIP activa.' },
      { status: 401 }
    );
  }

  const customer = await findCustomerByCredentials(session.email, session.licenseCode);
  if (!customer) {
    return NextResponse.json({ error: 'Licencia no válida.' }, { status: 401 });
  }

  const docKey = req.nextUrl.searchParams.get('doc') || 'consistencia-personajes-2026';
  const doc = MANUAL_DOCS[docKey] || MANUAL_DOCS['consistencia-personajes-2026'];

  const forensic = extractClientForensicInfo(req);
  await insertAuditLog({
    customerId: customer.id,
    paypalOrderId: customer.paypal_order_id,
    ipAddress: forensic.ipAddress,
    userAgent: forensic.userAgent,
    action: 'ASSET_DOWNLOADED',
    metadata: {
      license_code: customer.license_code,
      email: customer.email,
      resource_id: docKey,
      resource_type: 'manual_guide',
      resource_title: doc.title,
      downloaded_at: new Date().toISOString(),
    },
  });

  const bodyContent = `${doc.content}\n------------------------------------------------------------------------\nLicencia emitida para: ${customer.email}\nCódigo de Miembro: ${customer.license_code}\nOrden PayPal: ${customer.paypal_order_id}\nDescargado desde IP: ${forensic.ipAddress} el ${new Date().toISOString()}\n`;

  return new NextResponse(bodyContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="ArteDigital-${docKey}.txt"`,
      'Cache-Control': 'no-store',
    },
  });
}
